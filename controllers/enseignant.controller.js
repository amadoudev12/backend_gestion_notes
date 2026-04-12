const {prisma} = require('../lib/prisma')
const bcrypt = require('bcrypt')
const createEnseignantController = async(req,res)=>{
    const body = req.body
    if(!body){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try{
            // const {enseignants} = body
            for (let enseignant of body){
                const hashPass = await bcrypt.hash(enseignant.matricule,10)
                const user = await prisma.user.create({
                    data : {
                        login:enseignant.matricule,
                        mot_passe:hashPass,
                        role:"ENSEIGNANT"
                    }
                })
                await prisma.enseignant.create({
                    data: {
                        matricule: enseignant.matricule,
                        nom: enseignant.prenom,
                        prenom: enseignant.prenom,
                        userId: user.id,
                    }
                })
            }
            return res.status(201).json({message:'les enseignants ont été enregistré avec succes'})
    }catch(err){
            console.log(err)
            return res.status(500).json({message:"erreur:",err})
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
                enseignements : {
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
                enseignements:{
                    include:{
                        classe:true,
                        matiere:true
                    }
                }
            }
        })
        if(!classe){
            return res.status(404).json({message:"information non trouvé"})
        }
        const classeEnseigner = classe.enseignements.map(item=>({
            classe:item.classe, matiere: item.matiere.nom
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
        const nombreClasse = await prisma.enseigner.count({
            where : {id_prof:matricule}
        })
        const classes= await prisma.enseigner.findMany({
            where:{id_prof:matricule},
            select:{
                classe:{select:{id:true}}
            }
        })
        const classeIds = classes.map(item=>item.classe.id)
        const nombreEleve = await prisma.eleve.count({
            where:{
                idClasse:{in: classeIds}
            }
        })
        return res.status(201).json({message:"stat:", nombreClasse, nombreEleve})
    }catch(err){
        console.error(err)
        return res.status(500).json({ message: "Erreur serveur", err })
    }
}

module.exports = {
    createEnseignantController, 
    getEnseignantByMatriculeController, 
    classeEnseignerParEnsignant,
    enseignantStatController
}