const {prisma}= require('../lib/prisma')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const supabase = require('../lib/supabaseClient')
const secret_key = process.env.SECRET_KEY
const level_hash = parseInt(process.env.level_hash || '10')
const loginController = async (req, res) => {
    const { login, mot_passe } = req.body;
    if (!login || !mot_passe) {
        return res.status(400).json({
            message: "Veuillez renseigner les données demandées"
        });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { login }
        });
        if (!user) {
            return res.status(404).json({
                message: "Login incorrect ou mot de passe"
            });
        }
        const hashCompare = await bcrypt.compare(
            mot_passe,
            user.mot_passe
        );
        if (!hashCompare) {
            return res.status(401).json({
                message: "Mot de passe incorrect"
            });
        }
        let profil = null;
        if (user.role === "ELEVE") {
            profil = await prisma.eleve.findUnique({
                where: { userId: user.id }
            });
        }
        if (user.role === "ENSEIGNANT") {
            profil = await prisma.enseignant.findUnique({
                where: { userId: user.id }
            });
        }
        if (user.role === "ADMIN") {
            profil = await prisma.administrateur.findUnique({
                where: { userId: user.id },
                include: { etablissement: true }
            });
        }
        delete user.mot_passe;
        const token = jwt.sign(
            { user, profil },
            secret_key,
            { expiresIn: "7d" }
        );
        return res.status(200).json({
            message: `Bienvenue ${profil?.nom || "utilisateur"}`,
            token
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Erreur serveur",
            err
        });
    }
};




const modificationController = async (req, res) => {
    const { login, password } = req.body;

    if (!req.user) {
        return res.status(403).json({
            message: "Vous n'êtes pas autorisé"
        });
    }

    if (!login || !password) {
        return res.status(400).json({
            message: "Veuillez renseigner toutes les informations"
        });
    }

   if(req.user.role == "ENSEIGNANT"){
        if (!req.file) {
            return res.status(400).json({
                message: "Veuillez fournir votre signature"
            });
        }
   }
    try {
        const hashPass = await bcrypt.hash(password, level_hash);

        // const chemin = `signature/${req.user.user.id}.png`;
        // console.log('buffer:', req.file.buffer)
        // const { error } = await supabase.storage
        //     .from("signatures")
        //     .upload(
        //         chemin,
        //         req.file.buffer,
        //         {
        //             contentType: req.file.mimetype,
        //             upsert: true
        //         }
        //     );

        // if (error) {
        //     throw error;
        // }
        const filePath = `/uploads/signatures/${req.file.filename}`
        const user = await prisma.user.update({
            where: {
                id: req.user.user.id
            },
            data: {
                login,
                mot_passe: hashPass,
                firstLogin: false,
                signatureComplete: true
            }
        });

        if(req.user.user.role == "ENSEIGNANT"){
            await prisma.signature.upsert({
                where: {
                    user_id: req.user.user.id
                },
                update: {
                    url: filePath
                },
                create: {
                    url:filePath ,
                    user_id: req.user.user.id
                }
            });
        }
        delete user.mot_passe;
        const token = jwt.sign(
            { user, profil:req.user.profil},
            secret_key,
            { expiresIn: "7d" }
        );
        return res.status(200).json({
            message: "Première connexion effectuée avec succès",
            token
        });

    }catch(err) {
        console.log(err);
        return res.status(500).json({
            message: "Erreur serveur",
            error: err.message
        });
    }
    }
module.exports = {
    loginController,
    modificationController
}