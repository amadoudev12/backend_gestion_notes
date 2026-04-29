const {prisma} = require('../lib/prisma')
const xlsx = require('xlsx')
const bcrypt = require('bcrypt')
const createEnseignantController = async (req, res) => {

    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un administrateur"})
    }
    const admin_id = req.user.profil.id
    if(!admin_id){
        return res.status(400).json({message:'fournissez les donnés'})
    }

    if (!req.file) {
        return res.status(404).json("aucun fichier n'a été sélectionné");
    }
    const idEtablissement = req.user.profil.etablissement.id
    try {
        const annee = await prisma.anneeAcademique.findFirst({
            where: { actif: true }
        });

        const filename = req.file.filename;
        const wb = xlsx.readFile(`./upload/${filename}`);
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const enseignants = xlsx.utils.sheet_to_json(sheet);
        console.log(enseignants)
        for (let enseignant of enseignants) {

            //sécuriser matricule
            const matricule = enseignant.matricule?.toString().trim();

            // if (!matricule) continue;

            // chercher user
            let user = await prisma.user.findUnique({
                where: { login: matricule }
            });

            // créer user si inexistant
            if (!user) {
                const hashPass = await bcrypt.hash(matricule, 10);
                user = await prisma.user.create({
                    data: {
                        login: matricule,
                        mot_passe: hashPass,
                        role: "ENSEIGNANT"
                    }
                });
            }
            // vérifier enseignant
            let enseignantExist = await prisma.enseignantEtablissement.findUnique({
                where :{
                    enseignant_id_etablissement_id: {
                        enseignant_id: matricule,
                        etablissement_id: 1
                    }
                }
            });

            if (!enseignantExist) {
                const enseignantCree = await prisma.enseignant.create({
                    data: {
                        matricule: matricule,
                        nom: enseignant.nom,  
                        prenom: enseignant.prenom,
                        userId: user.id
                    }
                });
                await prisma.enseignantEtablissement.create({
                    data:{
                        enseignant_id:enseignantCree.matricule,
                        etablissement_id:idEtablissement
                    }
                })
            }
        }

        return res.status(201).json({
            message: "Les enseignants ont été enregistrés avec succès"
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "erreur",
            error: err.message
        });
    }
};

const enseignantEtablissement = async (req, res)=>{
    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un administrateur"})
    }
    const admin_id = req.user.profil.id
    if(!admin_id){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    if (!req.user.profil.etablissement) {
        return res.status(400).json({ message: "établissement introuvable" });
    }
    const idEtablissement = req.user.profil.etablissement.id
    
    try {
        const enseignants = await prisma.enseignantEtablissement.findMany({
            where : {etablissement_id:idEtablissement},
            include :{
                enseignant:true
            }
        })
        // console.log(enseignant)
        return res.status(200).json({enseignants})
    }catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "erreur",
            error: err.message
        });
    }
}

const getEnseignantByMatriculeController = async (req, res) => {
    
    const { matricule } = req.body
    if (!matricule) {
        return res.status(400).json({ message: "Veuillez fournir le matricule" })
    }

    try {
        const enseignant = await prisma.enseignant.findUnique({
            where: { matricule },
            include: {
                affectation : {
                    include : {
                        classe:true
                    }
                }
            }
        })

        if (!enseignant) {
            return res.status(404).json({ message: "Enseignant non trouvé" })
        }

        return res.status(200).json({
            message: "Enseignant trouvé",
            enseignant
        })

    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: "Erreur serveur", err })
    }
};

const classeEnseignerParEnsignant = async(req,res)=>{
    if(req.user.user.role !="ENSEIGNANT"){
        return res.status(403).json({message:"vous êtes pas un proffesseur"})
    }
    const matricule = req.user.profil.matricule
    console.log(matricule)
    try{
        const classe = await prisma.enseignant.findUnique({
            where:{matricule:matricule},
            include : {
                affectation:{
                    include:{
                        classe:true,
                        matiere:true
                    }
                }
            }
        })
        console.log(classe)
        if(!classe){
            return res.status(404).json({message:"information non trouvé"})
        }
        const classeEnseigner = classe?.affectation.map(item=>({
            classe:item.classe, matiere: {id:item.matiere.id,nom:item.matiere.nom}
        }))
        return res.status(201).json({message:"liste des classe:", classeEnseigner})
    }catch(err){
        console.error(err)
        return res.status(500).json({ message: "Erreur serveur", err })
    }
}
const enseignantStatController = async (req,res)=>{
    try{
        if(req.user.user.role !=="ENSEIGNANT"){
            return res.status(403).json({message:"vous êtes pas un proffesseur"})
        }
        const matricule = req.user.profil.matricule
        console.log(matricule)
        const nombreClasse = await prisma.affectation.count({
            where : {id_prof:matricule}
        })
        const classes= await prisma.affectation.findMany({
            where:{id_prof:matricule},
            select:{
                classe:{select:{id:true}}
            }
        })
        const classeIds = classes.map(item=>item.classe.id)
        const nombreEleve = await prisma.inscription.count({
            where:{
                id_classe:{in: classeIds}
            }
        })
        const nombreMatiere = await prisma.affectation.count({
            where : {
                id_prof: matricule
            }
        })
        return res.status(201).json({message:"stat:", nombreClasse, nombreEleve, nombreMatiere})
    }catch(err){
        console.error(err)
        return res.status(500).json({ message: "Erreur serveur", err })
    }
}

const nombreElevesClasse = async (req, res)=>{
        if(req.user.user.role !=="ENSEIGNANT"){
            return res.status(403).json({message:"vous êtes pas un proffesseur"})
        }
        const matricule = req.user.profil.matricule
        try {
            const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
            const classes = await prisma.affectation.findMany({
                where:{id_prof:matricule},
                include:{
                    classe:true
                }
            })
            const resultat = await Promise.all(
                classes.map(async(classe)=>{
                    const effectif = await prisma.inscription.count({
                        where:{
                            id_annee_academique:annee.id,
                            id_classe:classe.id_classe
                        }
                    })
                    return {
                        name:classe.classe.libelle,
                        effectif:effectif
                    }
                })
            )

            return res.status(200).json({message:"classe et effectiff", resultat})
        }catch(err){
        console.error(err)
        return res.status(500).json({ message: "Erreur serveur", err })
        }
}

module.exports = {
    createEnseignantController, 
    getEnseignantByMatriculeController, 
    classeEnseignerParEnsignant,
    enseignantStatController,
    enseignantEtablissement,
    nombreElevesClasse
}