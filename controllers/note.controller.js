const { prisma } = require("../lib/prisma")
const { generateFicheNote } = require("../utils/generate")
const { getNoteFunctionByMatiere } = require("../utils/util")


const postNote = async (req, res)=>{
    const body = req.body
    const {config, notes}= body
    if(!body){
        return res.status(400).json({message:'aucune classe selectionne'})
    }
    const id_matiere = await prisma.matiere.findFirst({where:{nom:config.matiere}, select:{id:true}})
    const anne = await prisma.anneeAcademique.findFirst({where:{actif:true}})
    try{
        for (let note of notes ) {
            const inscription = await prisma.inscription.findUnique({
                where :{
                    matricule_eleve_id_annee_academique:{
                        matricule_eleve:note.matricule,
                        id_annee_academique:anne.id
                    }
                }
            })
            await prisma.note.create({
                data:{
                    trimestre:{
                        connect : {id_trimestre:Number(config.trimestre)}
                    },
                    typeEvaluation:config.type,
                    coefficient:Number(config.coefficient),
                    valeur:note.note,
                    // relation obligatoire
                    matiere : {
                        connect: id_matiere
                    },
                    inscription:{
                        connect: {
                            id:Number(inscription.id)
                        }
                    }
                }
            })
        }
        return res.status(201).json({message:'notes enregistrés avec succes'})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur",err})
    }
}
const getNotesByElveId = async (req,res)=>{
    const matricule = req.params.id
    if(!matricule){
        return res.status(400).json({message:'veuillez renseigner le matricule'})
    }
    const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
    const inscription = await prisma.inscription.findUnique({
        where:{
            matricule_eleve_id_annee_academique:{
                matricule_eleve:matricule,
                id_annee_academique:annee.id
            }
        }
    })
    try {
        const notes = await prisma.note.findMany({
            where:{id_inscription:inscription.id},
            select : {
                typeEvaluation:true,
                coefficient:true,
                valeur:true,
                matiere:true
            }
        })
        const noteFinal = notes.map((note)=>({
            type:note.typeEvaluation,
            coefficient:note.coefficient,
            valeur:note.valeur,
            matiere:note.matiere.nom
        }))
        if(!notes.length){
            return res.status(404).json({message:"aucune note enregitrés pour vous"})
        }
        return res.status(201).json({message:"notes:", noteFinal})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur", err})
    }
}

// recuperer les notes de tout une classe pour creer  la fiche de note 
const getAllNotesByClasseByMatier = async (req,res)=>{
    if(!req.body){
        return res.status(400).json({message:'veuillez renseigner le matricule'})
    }
    console.log(req.body)
    const {id_classe, id_matiere} = req.body
    console.log(id_classe)
    try {
        const anne = await prisma.anneeAcademique.findFirst({
            where :{actif:true}
        })
        const trimestre = await prisma.trimestre.findFirst({
            where : {
                actif:true
            }
        })
        // liste des eleves 
        const classes = await prisma.inscription.findMany({
            where : {
                id_classe:id_classe,
                id_annee_academique:anne.id
            }
        })
        const matiere = await prisma.matiere.findUnique({
            where :{id:Number(id_matiere)},
            select : {
                nom:true
            }
        })
        const etablissement = await prisma.classe.findUnique({
            where : {
                id:id_classe
            },
            include : {
                etablissement :{
                    select : {
                        nom:true
                    }
                }
            }
        })
        const classe = await prisma.classe.findUnique({
            where:{
                id:id_classe
            },
            select:{
                libelle:true
            }
        })
        const proffesseur = await prisma.affectation.findFirst({
            where : {
                id_classe:id_classe,
                id_matiere:id_matiere,
            },
            include:{
                enseignant:{
                    select:{
                        nom:true,
                        prenom:true
                    }
                }
            }
        })
        let notes = []
        for (let eleve of classes) {
            const notesEleve = await getNoteFunctionByMatiere(eleve.matricule_eleve, id_matiere, trimestre.id_trimestre )
            notes.push(notesEleve)
        }
        const infosProf = `${proffesseur.enseignant.nom} ${proffesseur.enseignant.prenom}`
        // console.log(notes)
        const listeFile = await generateFicheNote(notes, matiere.nom, etablissement.etablissement.nom, trimestre.libelle, classe.libelle, infosProf)
        return res.download(listeFile, "liste-notes")
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur", err})       
    }
}
const getAllNotesByMatiere = async (req,res)=>{
    if(!req.body){
        return res.status(400).json({message:'veuillez renseigner le matricule'})
    }
    console.log(req.body)
    const {id_classe, id_matiere} = req.body
    console.log(id_classe)
    try {
        const annee = await prisma.anneeAcademique.findFirst({
            where :{actif:true}
        })
        const trimestre = await prisma.trimestre.findFirst({
            where : {
                actif:true
            }
        })
        // // liste des eleves 
        const classes = await prisma.inscription.findMany({
            where : {
                id_classe:Number(id_classe),
                id_annee_academique:annee.id
            }
        })
        // const matiere = await prisma.matiere.findUnique({
        //     where :{id:Number(id_matiere)},
        //     select : {
        //         nom:true
        //     }
        // })
        // const etablissement = await prisma.classe.findUnique({
        //     where : {
        //         id:id_classe
        //     },
        //     include : {
        //         etablissement :{
        //             select : {
        //                 nom:true
        //             }
        //         }
        //     }
        // })
        // const classe = await prisma.classe.findUnique({
        //     where:{
        //         id:id_classe
        //     },
        //     select:{
        //         libelle:true
        //     }
        // })
        // const proffesseur = await prisma.affectation.findFirst({
        //     where : {
        //         id_classe:id_classe,
        //         id_matiere:id_matiere,
        //     },
        //     include:{
        //         enseignant:{
        //             select:{
        //                 nom:true,
        //                 prenom:true
        //             }
        //         }
        //     }
        // })
        let notes = []
        for (let eleve of classes) {
            const notesEleve = await getNoteFunctionByMatiere(eleve.matricule_eleve, id_matiere, trimestre.id_trimestre )
            notes.push(notesEleve)
        }
        // const infosProf = `${proffesseur.enseignant.nom} ${proffesseur.enseignant.prenom}`
        // console.log(notes)
        return res.status(200).json({message:"notes:",notes})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur", err})       
    }
}


const noteRepartition = async (req, res)=>{
    const partition = {
        "0-5": 0,
        "5-10": 0,
        "10-15": 0,
        "15-20": 0,
    }
    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un administrateur"})
    }
    const admin_id = req.user.profil.id
        if(!admin_id){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try {
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        const etablissement = await prisma.etablissement.findUnique({where:{admin_id:admin_id}})
        const trimestre = await prisma.trimestre.findFirst({where:{actif:true}})
        if(!etablissement){
            return null
        }
        if(!trimestre){
            return 0
        }
        const notes = await prisma.note.findMany({
            where : {
                inscription:{
                    classe:{
                        idEtablissement:etablissement.id
                    },
                    id_annee_academique:annee.id
                },
                id_trimestre:trimestre.id_trimestre
            }
        })

        notes.forEach((note)=> {
            if(note.valeur < 5) partition["0-5"]++
            else if (note.valeur < 10) partition["5-10"]++
            else if (note.valeur < 15) partition["10-15"]++
            else partition["15-20"]++
        })
        const repartition = [
            { range: "0–5", count: partition["0-5"] },
            { range: "5–10", count: partition["5-10"] },
            { range: "10–15", count: partition["10-15"] },
            { range: "15–20", count: partition["15-20"] },
        ]
        return res.status(200).json({message:"repartition", repartition})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"imposible d'acceder au serveur"})
    }
}
module.exports = {
    postNote,
    getNotesByElveId,
    getAllNotesByClasseByMatier,
    noteRepartition,
    getAllNotesByMatiere
}