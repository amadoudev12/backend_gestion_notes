const { prisma } = require("../lib/prisma")
const bcrypt = require('bcrypt')
const { meilleureByClasse, moyenneElevesEtablissement, moyenneEtablissement } = require("../utils/util")
// const level_hash = process.env.level_hash
const jwt = require('jsonwebtoken')

/**
 * POST /api/auth/register
 * Body : {
 *   admin: { prenom, nom, email, mot_passe },
 *   etablissement: { nom, directeur, adresse, phone?, email?, code, statut }
 * }
 */
const register = async (req, res) => {
  const { admin, etablissement } = req.body;
  console.log(admin)  
  // ── 1. Validation des champs obligatoires ──────────────────────
  const missingAdmin = ['prenom', 'nom', 'email', 'mot_passe'].filter(
    (k) => !admin?.[k]?.trim()
  );
  const missingEtab = ['nom', 'directeur', 'adresse', 'code', 'statut'].filter(
    (k) => !etablissement?.[k]?.trim()
  );

  if (missingAdmin.length || missingEtab.length) {
    return res.status(400).json({
      message: 'Champs obligatoires manquants.',
      details: { admin: missingAdmin, etablissement: missingEtab },
    });
  }

  // ── 2. Vérification email admin unique ─────────────────────────
  const emailExiste = await prisma.user.findUnique({
    where: { login: admin.email },
  });

  if (emailExiste) {
    return res.status(409).json({
      message: 'Un compte avec cet email existe déjà.',
    });
  }

  // ── 3. Vérification code établissement unique ──────────────────
  const codeExiste = await prisma.etablissement.findFirst({
    where: { code: etablissement.code },
  });

  if (codeExiste) {
    return res.status(409).json({
      message: 'Ce code établissement est déjà utilisé.',
    });
  }

  // ── 4. Transaction Prisma ──────────────────────────────────────
  // Crée en une seule opération atomique :
  //   User → Administrateur → Etablissement
  try {
    const motPasseHash = await bcrypt.hash(admin.mot_passe, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 4a. Créer le User (table d'authentification)
      const user = await tx.user.create({
        data: {
          login: admin.email,          // ou générer un login depuis nom/prenom
          mot_passe: motPasseHash,
          role: 'ADMIN',
        },
      });

      // 4b. Créer l'Administrateur lié au User
      const administrateur = await tx.administrateur.create({
        data: {
          nom:    admin.nom,
          prenom: admin.prenom,
          email:  admin.email,
          userId: user.id,
        },
      });

      // 4c. Créer l'Etablissement lié à l'Administrateur
      const etab = await tx.etablissement.create({
        data: {
          nom:       etablissement.nom,
          directeur: etablissement.directeur,
          adresse:   etablissement.adresse,
          phone:     etablissement.phone   ?? null,
          email:     etablissement.email   ?? null,
          code:      etablissement.code,
          statut:    etablissement.statut,
          admin_id:  administrateur.id,
        },
      });

      return { user, administrateur, etab };
    });

    // ── 5. Générer le JWT ────────────────────────────────────────
    const token = jwt.sign(
        {
            user: {
                id:    result.user.id,
                role:  result.user.role,
                email: admin.email,
                adminId: result.administrateur.id,
                etablissementId: result.etab.id,
            },
        },
        process.env.SECRET_KEY,
        { expiresIn: "7d" }
    );

    // ── 6. Réponse ───────────────────────────────────────────────
    return res.status(201).json({
      message: 'Compte créé avec succès.',
      token,
      data: {
        administrateur: {
          id:     result.administrateur.id,
          nom:    result.administrateur.nom,
          prenom: result.administrateur.prenom,
          email:  result.administrateur.email,
        },
        etablissement: {
          id:        result.etab.id,
          nom:       result.etab.nom,
          code:      result.etab.code,
          statut:    result.etab.statut,
          directeur: result.etab.directeur,
        },
      },
    });
  } catch (err) {
    console.error('[register] erreur transaction :', err);
    return res.status(500).json({
      message: 'Erreur serveur. Veuillez réessayer.',
    });
  }
};


const StatEtablissement = async (req, res) => {
    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un administrateur"})
    }
    const admin_id = req.user.profil.id
        if(!admin_id){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try {
        const etablissement = await prisma.etablissement.findUnique({
            where : {admin_id : Number(admin_id)}
        })
        if(!etablissement){
            return res.status(200).json({message:"aucun etablissement trouvés"})
        }
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        if (!annee) {
            return res.status(404).json({ message: "Aucune année académique active" });
        }
        const nombreEleves = await prisma.inscription.count({
            where:{
                id_annee_academique:annee.id
            }
        })
        const nombreClasses = await prisma.classe.count({
            where : {
                idEtablissement:etablissement.id
            }
        })
        
        const enseignements = await prisma.affectation.findMany({
            where: {
                classe: {
                idEtablissement: etablissement.id
                }
            },
            select: {
                id_prof: true
            }
        })
        const enseignantsUniques = [...new Set(enseignements.map(e => e.id_prof))];
        const nombreEnseignants = enseignantsUniques.length;
        const moyEtablisement = await moyenneEtablissement(admin_id)
        return res.status(200).json({nombreEleves:nombreEleves ?? "0", nombreClasses:nombreClasses?? "0", nombreEnseignants:nombreEnseignants??"0", moyenneEtablissement:moyEtablisement??"0"})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur:",err})
    }
}


const listePlusFaiblesMoyennes = async (req, res)=>{
    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un administrateur"})
    }
    const admin_id = req.user.profil.id
    console.log(admin_id)
        if(!admin_id){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try{
        const moyennesEleves = await moyenneElevesEtablissement(admin_id, "faibles")
        if (!Array.isArray(moyennesEleves)) {
            console.log("erreur")
            return res.status(500).json({
                message: "Erreur lors de la récupération des moyennes",
                data: moyennesEleves
            })
        }
    const faibles = moyennesEleves.sort((a, b) => a.moyenne - b.moyenne)
    return res.status(200).json({ elevesFaibles: faibles })
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur lors de la recuperation", err})
    }
}
const listePlusFortesMoyennes = async (req, res)=>{
    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un administrateur"})
    }
    const admin_id = req.user.profil.id
    console.log(admin_id)
    if(!admin_id){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try{
        const moyennesEleves = await moyenneElevesEtablissement(admin_id,"meilleure")
        if (!Array.isArray(moyennesEleves)) {
            return res.status(500).json({
                message: "Erreur lors de la récupération des moyennes",
                data: moyennesEleves
            })
        }
        const fortes = moyennesEleves.sort((a,b)=> b.moyenne - a.moyenne)
        console.log(fortes)
        return res.status(200).json({elevesForts:fortes})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur lors de la recuperation", err})
    }
}

const meilleureByClasseController = async(req, res)=>{
    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un administrateur"})
    }
    const admin_id = req.user.profil.id
    console.log(admin_id)
    if(!admin_id){
        return res.status(400).json({message:'fournissez les donnés'})
    }

    try {
        const etablissement = await prisma.etablissement.findUnique({where:{admin_id:admin_id}})
        const listeClasse = await prisma.classe.findMany({where:{idEtablissement:etablissement.id}})
        
        const resultat = await Promise.all(
            listeClasse.map(async (classe)=>{
                const meilleuresClasse = await meilleureByClasse(classe.id)
                return {
                    classe:classe.libelle,
                    eleves: meilleuresClasse
                }
            })
        )
        return res.status(200).json({message:"les 5 meilleurs eleves par classe",resultat})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur lors de la recuperation", err})
    }
}

module.exports = {
    StatEtablissement,
    listePlusFaiblesMoyennes,
    listePlusFortesMoyennes,
    meilleureByClasseController,
    register
}