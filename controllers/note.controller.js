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
    try{
        for (let note of notes ) {
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
                    eleve:{
                        connect : {matricule:note.matricule}
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
    try {
        const notes = await prisma.note.findMany({
            where:{matricule_eleve:matricule},
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
        const trimestre = await prisma.trimestre.findFirst({
            where : {
                actif:true
            }
        })
        // liste des eleves 
        const classes = await prisma.eleve.findMany({
            where : {
                idClasse:id_classe
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
        const proffesseur = await prisma.enseigner.findFirst({
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
            const notesEleve = await getNoteFunctionByMatiere(eleve.matricule, id_matiere, trimestre.id_trimestre )
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
module.exports = {
    postNote,
    getNotesByElveId,
    getAllNotesByClasseByMatier
}