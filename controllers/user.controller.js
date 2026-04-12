const {prisma}= require('../lib/prisma')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secret_key = process.env.SECRET_KEY
const loginController = async(req,res)=>{ 
    const body = req.body
    if(!body){
        return res.json({messahe:"veuillez renseigner les données demandé"}).status(404)
    }

    try{
        // const {login, mot_passe} = body
        const user = await prisma.user.findUnique({
            where:{login:body.login}
        })

        const hashCompare = await bcrypt.compare(user.mot_passe, body.mot_passe) 
        console.log(hashCompare)
        if(!user){
            return res.status(404).json({message:"login incorrect ou mot Passe"})
        }
        let profil = null
        if(user.role=="ELEVE"){
            profil = await prisma.eleve.findUnique({
                where:{matricule:body.login}
            })
        }
        if(user.role=="ENSEIGNANT"){
            profil = await prisma.enseignant.findUnique({
                where:{matricule:body.login}
            })
        }
        if(user.role=="ADMIN"){
            profil = await prisma.administrateur.findUnique({
                where : {userId:user.id},
                include : {
                    etablissement : true
                }
            })
        }
        delete user.mot_passe
        const token = jwt.sign({
            user:user,
            profil:profil
        },secret_key, {expiresIn:"7d"} )
        return res.status(201).json({message:`bienvenue ${profil.nom}`,token})
    }catch(err){
        console.log(err)
        return res.json({message:'erreur au niveaux de la base',err}).status(505)
    }
}

module.exports = {
    loginController
}