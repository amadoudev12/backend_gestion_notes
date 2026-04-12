const { generateClasseBulletin } = require("../utils/generate")

const getBulletinClasse = async (req, res)=> {
    if(req.user.user.role !="ADMIN"){
        return res.status(403).json({message:"vous êtes pas un administrateur"})
    }
    const id_classe = req.params.id
    if(!id_classe){
        return res.status(400).json({message:'veuillez entrez les données'})
    }
    try {
        const bulletinsClasseFile = await generateClasseBulletin(Number(id_classe))
        res.download(bulletinsClasseFile, 'bulletin.pdf')
    }catch(err){
        console.log(err)
        res.status(500).json({ message: "Erreur lors de la génération du bulletin" })
    }
}

module.exports = {
    getBulletinClasse
}