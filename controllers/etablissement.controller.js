const { prisma } = require("../lib/prisma")

const postEtablissement = async (req, res) => {
    const body = req.body
    if(!body){
        return res.status(400).json({message:'fournissez les donnés'})
    }
    try {
        const {nom, adresse, phone, email, code, statut, directeur, admin_id} = body
        await prisma.etablissement.create({
            data : {
                nom:nom,
                adresse:adresse,
                phone:phone,
                email:email,
                code:code,
                statut:statut,
                directeur:directeur,
                admin_id:Number(admin_id)
            }
        })
        return res.status(201).json({message:"etablissement crée"})
    }catch(err){
        console.log(err)
        return res.status(500).json("erreur lors de l'enregistrement")
    }
}

const getEtablissementByIdAdmin = async (req, res) => {
    const id = req.params.id
    try {
        const etablissement = await prisma.etablissement.findUnique({
            where : {admin_id : Number(id)}
        })
        if(etablissement){
            return res.status(200).json({message:"etatblissement", etablissement})
        }
    }catch(err){
        console.log(err)
        return res.status(500).json(err)
    }
}
module.exports = {
    postEtablissement,
    getEtablissementByIdAdmin
}