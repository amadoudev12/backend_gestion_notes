const jwt = require('jsonwebtoken')

const VerifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        
        // Vérifie que le header existe et commence par "Bearer "
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        
        const token = authHeader.split(' ')[1]
        if (!token) {
            return res.status(401).json({ message: 'Token manquant' });
        }
        
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        req.user = decoded
        next()
    } catch (err) {
        console.log(err)
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expiré' });
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        return res.status(500).json({ message: 'Erreur serveur' });
    }
}

module.exports = VerifyToken