const { prisma } = require('../lib/prisma')
const activerTrimestreAutomatique = async () => {
    try {
        const aujourdHui = new Date()

        // 1️Trouver le trimestre correspondant à la date actuelle
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
        await prisma.trimestre.update({
            where: { id_trimestre: trimestreActuel.id_trimestre },
            data: { actif: true }
        })

    } catch (error) {
        console.log("Erreur activation automatique :", error)
    }
}

module.exports = activerTrimestreAutomatique