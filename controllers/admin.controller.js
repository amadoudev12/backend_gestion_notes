const { prisma } = require("../lib/prisma")
const bcrypt = require('bcrypt')
const { meilleureByClasse, moyenneElevesEtablissement, moyenneEtablissement } = require("../utils/util")
// const level_hash = process.env.level_hash
const createAdmin = async (req, res)=> {
    const body = req.body
    if(!body){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try {
        const {nom, prenom, email, login, mot_passe } = body
        const exist = await prisma.user.findUnique({
            where : {login: body.login}
        })
        if(exist) {
            return res.status(200).json({message:'ce login existe deja'})
        }
        const hashPass = await bcrypt.hash(mot_passe,10)
        const user = await prisma.user.create({
            data : {
                login:login,
                mot_passe:hashPass,
                role:"ADMIN"
            }
        })
        await prisma.administrateur.create({
            data : {
                nom:nom,
                prenom:prenom,
                email:email,
                userId:user.id
            }
        })
        return res.status(201).json({message:"administrateur cree avec succes"})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur:",err})
    }
}


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
        const nombreEleves = await prisma.eleve.count({
            where: {
                classe: {
                    idEtablissement: etablissement.id
                }
            }
        })
        const nombreClasses = await prisma.classe.count({
            where : {
                idEtablissement:etablissement.id
            }
        })
        
        const enseignements = await prisma.enseigner.findMany({
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
        return res.status(200).json({nombreEleves:nombreEleves, nombreClasses:nombreClasses, nombreEnseignants:nombreEnseignants, moyenneEtablissement:moyEtablisement})
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
        const moyennesEleves = await moyenneElevesEtablissement(admin_id,"faibles")
        const faibles = moyennesEleves.sort((a,b)=> b.moyenne - a.moyenne)
        return res.status(200).json({moyennesEleves:faibles})
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
        // const fortes = moyennesEleves.filter(m=> m.moyenne > 10)
        const fortes = moyennesEleves.sort((a,b)=> b.moyenne - a.moyenne)
        console.log(fortes)
        return res.status(200).json({moyennesEleves:fortes})
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
    createAdmin,
    StatEtablissement,
    listePlusFaiblesMoyennes,
    listePlusFortesMoyennes,
    meilleureByClasseController
}