const jwt = require('jsonwebtoken')
const VerifyToken = async (req, res, next)=>{
        const authHeader = req.headers['authorization']
        // Vérifie que le header existe et commence par "Bearer "
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Veuillez vous connecter' });
        }
        const token = authHeader && authHeader.split(' ')[1]
        
        if(!token){
            return res.json({message:'veuillez vous connecter'}).status(401)
        }
        try{
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            console.log(decoded)
            req.user = decoded

            next()
        }catch(err){
            console.log(err)
            return res.json({message:'erreur au niveau des token'})
        }
}
module.exports = VerifyToken