const { prisma } = require('../lib/prisma')
const { generateClasseBulletins } = require('./generate')
const activerTrimestreAutomatique = async () => {
    try {
        const aujourdHui = new Date()
        //Trouver le trimestre correspondant à la date actuelle
        const trimestreActuel = await prisma.trimestre.findFirst({
            where: {
                date_debut: { lte: aujourdHui },
                date_fin: { gte: aujourdHui }
            }
        })
        if (!trimestreActuel) {
            return
        }
        // Désactiver tous les trimestres
        await prisma.trimestre.updateMany({
            data: { actif: false }
        })

        //Activer le bon trimestre
        const trimestreActive = await prisma.trimestre.update({
            where: { id_trimestre: trimestreActuel.id_trimestre },
            data: { actif: true }
        })
        console.log("trimestre active", trimestreActive.libelle)
    } catch (error) {
        console.log("Erreur activation automatique :", error)
    }
}

module.exports = activerTrimestreAutomatique