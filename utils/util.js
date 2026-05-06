const {prisma} = require('../lib/prisma')
const getMention = (moyenne) => {
    if (moyenne < 10) return "Insuffisant"
    if (moyenne < 12) return "Passable"
    if (moyenne < 14) return "Assez Bien"
    if (moyenne < 16) return "Bien"
    return "Très Bien"
}
// recuperer la liste des eleves d'une classe



const listeElevesRequest = async (idClasse) => {
    console.log("id classe",idClasse)
    try {
        const annee = await prisma.anneeAcademique.findFirst({
            where: { actif: true }
        });
        if (!annee) {
            throw new Error("Aucune année académique active");
        }
        const inscriptions = await prisma.inscription.findMany({
            where: {
                id_classe:Number(idClasse),
                id_annee_academique: annee.id
            },
            include: {
                eleve:true
            }
        });
        // on retourne uniquement les élèves
        const listeEleves = inscriptions.map(i => i.eleve);
        return listeEleves;
    } catch (err) {
        console.log("error au niveau du utils", err);
        throw err;
    }
};


const moyenne = (tab) => {
    if (!tab || tab.length === 0) return 0;

    let total = 0;
    let totalCoef = 0;

    tab.forEach(t => {
        // On vérifie explicitement != null pour accepter 0
        const val = t.valeur != null ? t.valeur : t.moyenne;
        total     += val * t.coefficient;
        totalCoef += t.coefficient;
    });

    return parseFloat((total / totalCoef).toFixed(2));
}

const moyenneE = (tab)=>{
    if(!tab || tab.length === 0){
        return 0
    }
    let total = 0
    tab.forEach(t=>{
        total += isNaN(t.moyenneGenerale) ? 0 : t.moyenneGenerale
    })
    console.log(total)
    return parseFloat((total / tab.length).toFixed(2))
}

//recupere toutes les notes d'un eleve
const getNoteFunction = async (id) => {
    if (!id) {
        throw new Error('aucun id selectionné')
    }
    try {
        const trimestre = await prisma.trimestre.findFirst({
            where: { actif: true }
        })
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        const eleve = await prisma.eleve.findUnique({
            where: { matricule: id },
            include: {
                inscriptions: {
                    where: {
                        id_annee_academique: annee.id
                    },
                    include: {
                        notes: {
                            where: {
                                id_trimestre: trimestre.id_trimestre
                            },
                            select: {
                                valeur: true,
                                coefficient: true,
                                matiere: {
                                    select: {
                                        nom: true,
                                        affectation:{
                                            select:{
                                                coefficient:true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        // élève introuvable
        if (!eleve) {
            throw new Error("élève introuvable")
        }
        if (!eleve.inscriptions.length) {
            return []
        }
        const inscription = eleve.inscriptions[0]
        // aucune note
        if (!eleve.inscriptions.length || !eleve.inscriptions[0].notes.length) {
            return []
        }
        const matieres = {}
        inscription.notes.forEach(note => {
            const nomMatiere = note.matiere.nom
            const coefMatiere = note.matiere.affectation[0]?.coefficient
            if (!matieres[nomMatiere]) {
                matieres[nomMatiere] = {
                    matiere: nomMatiere,
                    coefficient_matiere: coefMatiere,
                    notes: [],
                }
            }
            matieres[nomMatiere].notes.push({
                valeur: note.valeur,
                coefficient: note.coefficient
            })
        })
        return Object.values(matieres)
    } catch (err) {
        console.log('erreur au niveau du utils:', err)
        throw err
    }
}

//recuperation des notes des matieres 
const getNoteFunctionByMatiere = async (id, id_matiere, id_trimestre) => {
    if(!id){
        throw new Error('aucun id selectionné')
    }
    const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
    const inscription = await prisma.inscription.findUnique({
        where:{
            matricule_eleve_id_annee_academique :{
                matricule_eleve:id,
                id_annee_academique:annee.id
            }
        }
    })
    try {
        const notes = await prisma.note.findMany({
            where:{ id_inscription:inscription.id, id_matiere:Number(id_matiere), id_trimestre:id_trimestre },
            select:{
                valeur:true,
                coefficient:true,
                matiere : {
                    select : {
                        nom:true,
                        affectation:{
                            select : {
                                coefficient:true,
                            }
                        }
                    }
                },
                inscription :{
                    include : {
                        eleve : {
                            select:{
                                matricule:true,
                                nom:true,
                                prenom:true,
                            }
                        }
                    }
                }
            }
        })
        const matieres = {}
        notes.forEach(note => {
            const nomMatiere = note.matiere.nom
            const coefMatiere = note.matiere.affectation[0]?.coefficient
            const matricule = note.inscription.matricule_eleve
            const nom = note.inscription.eleve.nom
            const prenom = note.inscription.eleve.prenom
            if(!matieres[nomMatiere]){
                matieres[nomMatiere] = {
                    matiere: nomMatiere,
                    coefficient_matiere: coefMatiere,
                    infos : {
                        matricule:matricule,
                        nom:nom,
                        prenom:prenom
                    },
                    notes:[],
                }
            }
            matieres[nomMatiere].notes.push({
                valeur: note.valeur,
                coefficient: note.coefficient,
            })
        })
        return Object.values(matieres)
    }catch(err){
        console.log('erreur au niveau du utils:',err)
        throw err
    }
}
//recupere les moyennes des matieres
const calculerMoyenne = async (id) => {
    const matieres = await getNoteFunction(id)
    return matieres.map(m => ({
        matiere: m.matiere,
        coefficient: m.coefficient_matiere,
        moyenne: Number(moyenne(m.notes)),
        appreciation: getMention(moyenne(m.notes))
    }))
}



// calcule du rang 
const getRang = async (matricule, idClasse)=>{
    console.log(idClasse)
    const moyennesEleves = []
    try{
        const listeEleves = await listeElevesRequest(idClasse)
        for(let eleve of listeEleves){
            const matricule = eleve.matricule
            const eleveMoy = await calculerMoyenne(matricule)
            moyennesEleves.push({
                matricule:eleve.matricule,
                nom:eleve.nom,
                prenom:eleve.prenom,
                moyenne: eleveMoy ? Number(moyenne(eleveMoy)) : 0
            })
        }
        moyennesEleves.sort((a,b)=> b.moyenne - a.moyenne)
        let rang = null
        for (let i=0; i<=moyennesEleves.length; i++){
            if(moyennesEleves[i].matricule == matricule){
                rang = i+1
                break;
            }
        }
        //console.log(rang)
        return rang
    }catch(err){
        return err
    }
}

const getRangParMatiere = async (matricule, idClasse) => {
    try {
        const listeEleves = await listeElevesRequest(idClasse)
        //Récupérer toutes les moyennes par matière pour chaque élève
        const toutesMoyennes = []
        for (let eleve of listeEleves) {
            const moyennes = await calculerMoyenne(eleve.matricule)
            toutesMoyennes.push({
                matricule: eleve.matricule,
                moyennes
            })
        }
        // Récupérer les matières depuis le premier élève
        const matieres = toutesMoyennes[0]?.moyennes || []
        const resultats = []
        // 3. Pour chaque matière → faire le classement
        for (let mat of matieres) {
            const classement = []
            for (let eleve of toutesMoyennes) {
                const matiereTrouvee = eleve.moyennes.find(m => m.matiere === mat.matiere)
                classement.push({
                    matricule: eleve.matricule,
                    moyenne: matiereTrouvee ? matiereTrouvee.moyenne : 0
                })
            }
            // Trier
            classement.sort((a, b) => b.moyenne - a.moyenne)
            // Trouver rang
            let rang = null
            for (let i = 0; i < classement.length; i++) {
                if (classement[i].matricule === matricule) {
                    rang = i + 1
                    break
                }
            }
            resultats.push({
                matiere: mat.matiere,
                rang
            })
        }
        return resultats
    } catch (err) {
        console.error(err)
        throw new Error("Erreur lors du calcul du rang par matière")
    }
}


// meilleure moyenne d'une classe 

const bestAndBadMoyClasse = async(id)=>{
    try {
        const eleves = await prisma.eleve.findMany({
            where:{
                idClasse:Number(id)
            }
        })
        let moyennesClasses = []
        for(let eleve of eleves){
            const moyenneMatieres = await calculerMoyenne(eleve.matricule)
            const moyenneEleve = moyenne(moyenneMatieres)
            moyennesClasses.push({
                matricule:eleve.matricule,
                moyenne: moyenneEleve
            })
        }

        moyennesClasses.sort((a,b)=> b.moyenne - a.moyenne)
        const bestMoy = moyennesClasses[0]
        const badMoy = moyennesClasses[moyennesClasses.length-1]
        console.log(badMoy)
        return {
            bestMoy:bestMoy ,
            badMoy:badMoy
        }
    }catch(err){
        console.log("erreur au niveau de la fonction de recuperation de la moyenne",err)
    }
}
// moyenne de la classe 
const moyClasse = async (id) => {
    try {
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        const eleves = await prisma.inscription.findMany({
            where :{
                classe:{
                    id:id
                },
                id_annee_academique:annee.id
            }
        })
        
        let sum = 0
        for(let eleve of eleves){
            
            const moyenneMatieres = await calculerMoyenne(eleve.matricule_eleve)
            const moyenneEleve = moyenne(moyenneMatieres)
            console.log(moyenneEleve)
            if(moyenneEleve){
                sum += moyenneEleve 
            }
        }
        
        const moyenneClasses = parseFloat((sum/eleves.length).toFixed(2))
        console.log('moy classe:', moyenneClasses)
        return moyenneClasses
    }catch(err){
        console.log("erreur au niveau de la fonction de recuperation de la moyenne",err)
    }
}

// information du bulletin 
const getBulletinInformation = async (matricule)=>{
    try{
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        const eleve = await prisma.inscription.findFirst({
            where :{
                matricule_eleve:matricule,
                id_annee_academique:annee.id
            },
            include :{
                eleve:true,
                classe:{
                    select :{
                        id:true,
                        libelle:true,
                        idEtablissement:true
                    }
                }
            }
        })
        const idEtablissement = eleve.classe?.idEtablissement
        const etablissement = await prisma.etablissement.findUnique({
            where : {
                id:idEtablissement
            }
        })
        // const enseignants = await prisma.aff.findMany({
        //     where : {
        //         id_classe : eleve.classe.id
        //     },
        //     include : {
        //         enseignant : {
        //             select : {
        //                 nom:true,
        //                 prenom:true
        //             }
        //         }
        //     }
        // })
        const enseignants = await prisma.affectation.findMany({
            where:{
                id_classe:eleve.classe.id
            },
            include:{
                enseignant:{
                    select:{
                        nom:true,
                        prenom:true
                    }
                }
            }
        })
        const matieres = await calculerMoyenne(matricule)
        const matiereAvecProf = await Promise.all(
                matieres.map(async (m) => {
                const matiereId = await prisma.matiere.findUnique({
                    where: { nom_etablissement_id:{
                        nom: m.matiere, etablissement_id:etablissement.id 
                    }},
                    select: { id: true }
                })
                if (!matiereId) {
                    // Si la matière n'existe pas, on retourne juste la matière sans prof
                    return { ...m, professeur: "Non attribué" };
                }
                const enseignant = await prisma.affectation.findFirst({
                    where:{
                        id_classe:eleve.classe.id,
                        id_matiere:matiereId.id
                    },
                    include:{
                        enseignant: {select:{nom:true, prenom:true}}
                    }
                })
                return {
                    ...m,
                    professeur: enseignant ? `${enseignant.enseignant.nom} ${enseignant.enseignant.prenom}` : "Non attribué"
                }
            })
        )
        const moyenneGenerale = moyenne(matieres)
        const rang = await getRang(matricule, eleve.classe.id)
        const rangMatiere = await getRangParMatiere(matricule, eleve.classe.id)
        console.log(rangMatiere)
        return{
            eleveInfo:eleve,
            matiere:Object.values(matiereAvecProf),
            moyenneGenerale:moyenneGenerale,
            rang:rang,
            etablissement:etablissement,
            enseignants:enseignants,
            rangMatiere: rangMatiere
        }
    }catch(err){
        console.log(err)
    }
}

// recuperer les eleves bon et mauvais 
const moyenneElevesEtablissement = async (admin_id, type) => {
    try {
        const etablissement = await prisma.etablissement.findUnique({
            where: { admin_id: admin_id }
        })

        const annee = await prisma.anneeAcademique.findFirst({
            where: { actif: true }
        })

        if (!etablissement) {
            return []
        }

        const eleves = await prisma.inscription.findMany({
            where: {
                id_annee_academique: annee.id,
                classe: {
                    idEtablissement: etablissement.id
                }
            },
            include: {
                eleve: true,
                classe: {
                    select: {
                        libelle: true
                    }
                }
            }
        })

        const moyennes = await Promise.all(
            eleves.map(async (eleve) => {
                const moyenneMatieres = await calculerMoyenne(eleve.matricule_eleve)

                const moyenneGenerale = moyenneMatieres.length
                    ? moyenne(moyenneMatieres)
                    : 0

                return {
                    matricule: eleve.eleve.matricule,
                    nom: eleve.eleve.nom,
                    prenom: eleve.eleve.prenom,
                    classe: eleve.classe.libelle,
                    moyenne: moyenneGenerale
                }
            })
        )

        if (type === "faibles") {
            return moyennes.filter(m => m.moyenne < 10)
        } else {
            return moyennes.filter(m => m.moyenne >= 10)
        }

    } catch (err) {
        console.log("ERREUR MOYENNE:", err)
        return []
    }
}

const moyenneEtablissement = async(admin_id)=>{
    try{
        const etablissement = await prisma.etablissement.findUnique({
            where : {admin_id :admin_id}
        })
        const trimestre = await prisma.trimestre.findFirst({where:{actif:true}})
        if(!etablissement){
            return null
        }
        if(!trimestre){
            return 0
        }
        const annee = await prisma.anneeAcademique.findFirst({where:{actif:true}})
        const eleves = await prisma.inscription.findMany({
            where :{
                id_annee_academique:annee.id,
                classe:{
                    idEtablissement:etablissement.id
                }
            },
            include : {
                eleve:true,
                classe:{
                    select:{
                        libelle:true
                    }
                }
            }
        })

        const moyennesEleves = await Promise.all(
            eleves.map(async (eleve) =>{
                const moyenneMatieres = await calculerMoyenne(eleve.matricule_eleve)
                const moyenneGenerale = moyenne(moyenneMatieres)
                return {
                    moyenneGenerale: moyenneGenerale
                }
            })
        )
        console.log(moyennesEleves)
        const moyenneEtablissement = moyenneE(moyennesEleves)
        return {
            moyenneEtablissement,
            trimestre:trimestre.libelle
        }
    }catch(err){
        console.log(err)
        return err
    }
}


const meilleureByClasse = async (idClasse)=>{
    try {
        const eleves = await prisma.inscription.findMany({
            where :{
                classe:{
                    id:idClasse
                }
            },
            include : {
                eleve:true,
            }
        })
        let elevesWithMoy = []
        for(let eleve of eleves){
            const moyenneMatieres = await calculerMoyenne(eleve.matricule_eleve)
            const moyenneEleve = moyenne(moyenneMatieres)
            elevesWithMoy.push({
                nom:eleve.eleve.nom,
                prenom:eleve.eleve.prenom,
                moyenne:moyenneEleve
            })
        }
        return elevesWithMoy.sort((a,b)=> b.moyenne - a.moyenne).slice(0,3)
    }catch(err){
        return err
    }
}

module.exports = {
    calculerMoyenne, 
    listeElevesRequest,
    moyenne,
    getBulletinInformation, 
    getRang,
    getMention,
    getNoteFunctionByMatiere,
    bestAndBadMoyClasse,
    moyClasse,
    moyenneElevesEtablissement,
    moyenneEtablissement,
    meilleureByClasse
}