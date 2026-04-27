const { prisma } = require('../lib/prisma')
const {listeElevesRequest,  bestAndBadMoyClasse, moyClasse} = require('../utils/util')

const createClasse = async (req, res) => {
    try {
        //Vérifier authentification
        if (!req.user || !req.user.user) {
            return res.status(401).json({ message: "Utilisateur non authentifié" });
        }

        //Vérifier rôle
        if (req.user.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Accès refusé" });
        }
        //Vérifier établissement
        if (!req.user.profil.etablissement) {
            return res.status(400).json({ message: "Établissement introuvable" });
        }
        const etablissement_id = req.user.profil.etablissement.id;
        //Données envoyées
        const { nom } = req.body;
        if (!nom) {
            return res.status(400).json({ message: "Le nom de la classe est obligatoire" });
        }

        // 🔎 Vérifier si la classe existe déjà
        const classeExistante = await prisma.classe.findFirst({
            where: {
                libelle: nom,
                idEtablissement: etablissement_id
            }
        });

        if (classeExistante) {
            return res.status(400).json({ message: "Cette classe existe déjà" });
        }

        // Création
        const classe = await prisma.classe.create({
            data: {
                libelle: nom,
                idEtablissement: etablissement_id
            }
        });

        return res.status(201).json({
            message: "Classe créée avec succès",
            classe
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Erreur serveur",
            error: err.message
        });
    }
};

const listeEleveParClasse = async (req,res) => {
    const classe_id = req.params.id
    console.log(classe_id)
    if(!classe_id){
        return res.status(400).json({message:'aucune classe selectionne'})
    }
    try{
        const listeEleves = await listeElevesRequest(classe_id)
        return res.status(201).json({message:'liste etudiant ',listeEleves})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur",err})
    }
}

const listeClasses = async (req,res) => {
    try {
        const classes = await prisma.classe.findMany()
        return res.status(200).json({message:"Liste des classes", classes})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur au niveau de la bd", err})
    }
}

const listeClasseByEtabblissement = async (req, res)=>{
    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un proffesseur"})
    }
    const id = req.user.profil.etablissement.id
    if(!id){
        return res.status(400).json({message:'aucune etablissement selectionne'})
    }
    try {
        const classes = await prisma.classe.findMany({
            where : {
                idEtablissement:Number(id)
            }
        })
        return res.status(200).json({message:"liste etablissement", classes})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur au niveau de la bd", err})
    }
}

const getClasseMatiere = async (req, res)=>{
    const classe_id = req.params.id
    console.log(classe_id)
    if(!classe_id){
        return res.status(400).json({message:'aucune classe selectionne'})
    }
    try {
        const matieres = await prisma.enseigner.findMany({
            where : {id_classe:Number(classe_id)},
            include : {
                matiere : true
            }
        })
        return res.status(200).json({
            matieres
        })
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur dans la base",err})
    }
}

const bestAndBadMoyenneController = async (req, res)=>{
    try {
        const id = req.params.id
        const moy = await moyClasse(id)
        return res.status(200).json({moy})
    }catch(err){
        console.log(err)
        return res.status(500).json({err})
    }
}



module.exports = {
    listeEleveParClasse,
    listeClasses,
    listeClasseByEtabblissement,
    getClasseMatiere,
    bestAndBadMoyenneController,
    createClasse
}