const {prisma} = require('../lib/prisma')
const bcrypt = require('bcrypt')
const { calculerMoyenne, getRang } = require('../utils/util')
const { generate } = require('../utils/generate')
const xlsx = require('xlsx')
// const createEleveController = async(req,res)=>{
//     const body = req.body
//     if(!body){
//         return res.status(400).json({message:'fournissez les donnés'})
//     }
//     try{
//         // const {eleves} = body
//         for (let eleve of body){
//             const exixtUser = await prisma.user.findUnique({where:{login:eleve.matricu7}})
//             const hashPass = await bcrypt.hash(eleve.matricule,10)
//             const user = await prisma.user.create({
//                 data : {
//                     login:eleve.matricule,
//                     mot_passe:hashPass,
//                     role:"ELEVE"
//                 }
//             })
//             await prisma.eleve.create({
//                 data: {
//                     matricule: eleve.matricule,
//                     nom: eleve.prenom,
//                     prenom: eleve.prenom,
//                     dateNaissance:new Date(eleve.dateNaissance),
//                     lieuNaissance:eleve.lieuNaissance,
//                     boursier:eleve.boursier,
//                     sexe:eleve.sexe,
//                     affecte:eleve.affecte,
//                     redoublant:eleve.redoublant,
//                     idClasse: eleve.idClasse,
//                     nationalite:eleve.nationalite,
//                     userId: user.id,
//                 }
//             })
//         }
//         return res.status(201).json({message:'les eleves ont été enregistré avec succes'})
//     }catch(err){
//         console.log(err)
//         return res.status(500).json({message:"erreur:",err})
//     }
// }


const createEleveController = async (req, res) => {
    const {classe} = req.body;

    if (!req.file) {
        return res.status(404).json("aucun fichier n'a été sélectionné");
    }

    if (!classe) {
        return res.status(404).json("aucune classe sélectionnée");
    }
    try {
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        const filename = req.file.filename
        const wb = xlsx.readFile(`./upload/${filename}`)
        const sheetName = wb.SheetNames[0]
        const sheet = wb.Sheets[sheetName]
        const eleves = xlsx.utils.sheet_to_json(sheet)
        for (let row of eleves) {
            let user = await prisma.user.findUnique({
                where: { login: row.matricule }
            })
            // verifions le user 
                if (!user) {
                    const hashPass = await bcrypt.hash(row.matricule, 10);
                    user = await prisma.user.create({
                        data: {
                            login: row.matricule,
                            mot_passe: hashPass,
                            role: "ELEVE"
                        }
                    })
                }
            //Vérifions si élève existe
            let eleve = await prisma.eleve.findUnique({
                where: { matricule: row.matricule }
            });
            if (!eleve) {
                eleve = await prisma.eleve.create({
                    data: {
                        matricule: row.matricule,
                        nom: row.nom,
                        prenom: row.prenom,
                        dateNaissance: row.dateNaissance
                            ? new Date(row.dateNaissance)
                            : null,
                        lieuNaissance: row.lieuNaissance || null,
                        sexe: row.sexe,
                        affecte:row.affecte,
                        boursier:row.boursier,
                        redoublant:row.redoublant,
                        nationalite:row.nationalite,
                        userId: user.id
                    }
                })
            }
            //INSCRIPTION 
            await prisma.inscription.create({
                data: {
                    matricule_eleve: eleve.matricule,
                    id_classe: Number(classe),
                    id_annee_academique: Number(annee.id)
                }
            })
        }
        return res.status(201).json({
            message: "les élèves ont été ajoutés avec succès ✅"
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "erreur au niveau de la base de données"
        })
    }
}

const getAllElevesController = async (req, res)=>{
    try {
        const eleves = await prisma.eleve.findMany()
        return res.json({message:'liste des eleves:', eleves}).status(200)
    }catch(err){
        console.log('erreur serveur', err)
        return res.json({message:'erreur', err}).status(505)
    }
}

const  getEleveByClasseController = async (req,res)=>{
    try{
        const eleves = await prisma.eleve.findMany({
            where : {idClasse:req.id}
        })
        if(!eleves){
            return res.status(404).json({message:"la classe n'existe pas"})
        }
        return res.status(200).json({message:"liste de la classe", eleves})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur",err})
    }
}

const getEleveController = async (req,res)=>{
    const matricule = req.params.id
    if(!matricule){
        return res.status(400).json({message:'veuillez renseigner le matricule'})
    }
    try {
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        const eleve = await prisma.inscription.findUnique({
            where :{
                matricule_eleve_id_annee_academique :{
                    matricule_eleve:matricule,
                    id_annee_academique:annee.id
                },
            },
            include :{
                eleve:true,
                classe:{
                    select:{
                        libelle:true
                    }
                }
            }
        })
        if(!eleve){
            return res.status(404).json({message:"l'eleve n'existe pas !!"})
        }
        return res.status(201).json({eleveInformation:eleve})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur",err})
    }
}

const moyennesController = async (req,res)=>{
    const id = req.params.id
    if(!id){
        return res.status(400).json({message:'veuillez renseigner le matricule'})
    }
    try{
        const moyenne = await calculerMoyenne(id)
        return res.status(201).json({message:'vos moyenne:', moyenne})
    }catch(err){
        console.log('erreur au  niveau du controller',err)
        return res.status(500).json({message:"erreur au nieveau du serveur",err})
    }
}

const EleveRang = async (req,res)=>{
    console.log(req.user.profil)
    const matricule = req.user.profil.matricule
    // const idClasse = req.user.profil.idClasse
    try{
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        const idClasse = await prisma.inscription.findUnique({
            where :{
                matricule_eleve_id_annee_academique:{
                    matricule_eleve:matricule,
                    id_annee_academique:annee.id
                },
            },
            select:{
                id_classe:true
            }
        })
        const rang = await getRang(matricule, idClasse.id_classe)
        //console.log(rang)
        return res.status(200).json({rang})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:'erreur:', err})
    }
}

const bulletinController = async (req, res) => {
    const matricule = req.user.profil.matricule
    try {
        const filePath = await generate(matricule)
        res.download(filePath, 'bulletin.pdf')
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Erreur lors de la génération du bulletin" })
    }
}

const absenceController = async (req, res) => {
    const body = req.body
    const {config, absences}  = body
    if(!body){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try {
        for (let absence of absences) {
            await prisma.absence.create({
                data:{
                    nombre:absence.nombre,
                    justifiee:(absence.justifiee).toLowerCase(),
                    eleve : {
                        connect: {matricule:absence.matricule}
                    },
                    trimestre : {
                        connect: {id_trimestre:Number(config.trimestre)}
                    }
                }
            })
        }
        return res.status(201).json({message:"Absence enregistré"})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:'erreur au niveau de la bd'})
    }
}



module.exports = {
    getAllElevesController,
    createEleveController,
    getEleveByClasseController,
    getEleveController,
    moyennesController,
    EleveRang,
    bulletinController,
    absenceController
}