const {prisma}= require('../lib/prisma')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secret_key = process.env.SECRET_KEY
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
                where: { matricule: login }
            });
        }
        if (user.role === "ENSEIGNANT") {
            profil = await prisma.enseignant.findUnique({
                where: { matricule: login }
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

module.exports = {
    loginController
}