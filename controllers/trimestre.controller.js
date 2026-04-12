const { prisma } = require("../lib/prisma")

const postTrimestreController = async (req, res) => {
    const body = req.body
    if(!body){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try {
        const {nom, debut, fin} = body
        await prisma.trimestre.create({
            data : {
                libelle:nom,
                date_debut: new Date(debut),
                date_fin:new Date(fin),
                actif: false
            }
        })
        return res.status(201).json({message:'Trimestre crée avec succès'})
    }catch(err){
        console.log(err)
        return res.status(500).json({message:"erreur", err})
    }
}

const getTrimestres = async (req, res) => {
    try {
        const trimestres = await prisma.trimestre.findMany({
            orderBy : {
                date_debut : "asc"
            }
        })
        if(trimestres.length > -1) {
            return res.status(200).json(trimestres)
        }
    }catch(err){
        console.log(err)
        return res.status(500).json({err})
    }
}

const actifTrimestreController = async (req, res) => {
    const id = req.params.id
    console.log(id)
    try {
        await prisma.trimestre.updateMany({
            data : {
                actif:false
            }
        })
        const trimestre = await prisma.trimestre.update({
            where : {id_trimestre:Number(id)},
            data : {
                actif: true
            }
        })
        res.json({
            message: "Trimestre activé avec succès",
            trimestre
        })
    }catch(err){
        console.error(err)
        res.status(500).json({
            message: "Erreur lors de l'activation du trimestre"
        })
    }
}
module.exports = {
    postTrimestreController,
    getTrimestres,
    actifTrimestreController
}