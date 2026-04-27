-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ENSEIGNANT', 'ELEVE');

-- CreateEnum
CREATE TYPE "SEXE" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "Redoublant" AS ENUM ('oui', 'non');

-- CreateEnum
CREATE TYPE "Bourse" AS ENUM ('oui', 'non');

-- CreateEnum
CREATE TYPE "Affecte" AS ENUM ('oui', 'non');

-- CreateEnum
CREATE TYPE "Justifie" AS ENUM ('oui', 'non');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "mot_passe" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eleve" (
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "sexe" "SEXE",
    "affecte" "Affecte" NOT NULL DEFAULT 'non',
    "boursier" "Bourse" NOT NULL DEFAULT 'non',
    "redoublant" "Redoublant" NOT NULL DEFAULT 'non',
    "nationalite" TEXT NOT NULL DEFAULT 'Ivoirienne',
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Eleve_pkey" PRIMARY KEY ("matricule")
);

-- CreateTable
CREATE TABLE "Enseignant" (
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Enseignant_pkey" PRIMARY KEY ("matricule")
);

-- CreateTable
CREATE TABLE "Administrateur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Administrateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classe" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "idEtablissement" INTEGER,

    CONSTRAINT "Classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matiere" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "etablissement_id" INTEGER NOT NULL,

    CONSTRAINT "Matiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trimestre" (
    "id_trimestre" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL,

    CONSTRAINT "Trimestre_pkey" PRIMARY KEY ("id_trimestre")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,
    "typeEvaluation" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL DEFAULT 1,
    "id_inscription" INTEGER NOT NULL,
    "id_matiere" INTEGER NOT NULL,
    "id_trimestre" INTEGER NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affectation" (
    "id" SERIAL NOT NULL,
    "id_classe" INTEGER NOT NULL,
    "id_matiere" INTEGER NOT NULL,
    "id_prof" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL,

    CONSTRAINT "Affectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultatTrimestre" (
    "id" SERIAL NOT NULL,
    "eleveId" TEXT NOT NULL,
    "idtrimestre" INTEGER NOT NULL,
    "id_annee" INTEGER NOT NULL,
    "moyenneGenerale" DOUBLE PRECISION NOT NULL,
    "decision" TEXT NOT NULL,
    "rang" INTEGER NOT NULL,
    "mention" TEXT,

    CONSTRAINT "ResultatTrimestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" SERIAL NOT NULL,
    "nombre" INTEGER NOT NULL,
    "justifiee" "Justifie" NOT NULL DEFAULT 'oui',
    "matricule_eleve" TEXT NOT NULL,
    "trimestreId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etablissement" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "directeur" TEXT NOT NULL,
    "admin_id" INTEGER NOT NULL,

    CONSTRAINT "Etablissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnneeAcademique" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnneeAcademique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" SERIAL NOT NULL,
    "matricule_eleve" TEXT NOT NULL,
    "id_classe" INTEGER NOT NULL,
    "id_annee_academique" INTEGER NOT NULL,
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnseignantEtablissement" (
    "id" SERIAL NOT NULL,
    "enseignant_id" TEXT NOT NULL,
    "etablissement_id" INTEGER NOT NULL,

    CONSTRAINT "EnseignantEtablissement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_matricule_key" ON "Eleve"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_userId_key" ON "Eleve"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Enseignant_userId_key" ON "Enseignant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Administrateur_email_key" ON "Administrateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Administrateur_userId_key" ON "Administrateur"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Matiere_etablissement_id_key" ON "Matiere"("etablissement_id");

-- CreateIndex
CREATE UNIQUE INDEX "Matiere_nom_etablissement_id_key" ON "Matiere"("nom", "etablissement_id");

-- CreateIndex
CREATE INDEX "Note_id_inscription_idx" ON "Note"("id_inscription");

-- CreateIndex
CREATE INDEX "Note_id_matiere_idx" ON "Note"("id_matiere");

-- CreateIndex
CREATE INDEX "Note_id_trimestre_idx" ON "Note"("id_trimestre");

-- CreateIndex
CREATE UNIQUE INDEX "Affectation_id_classe_id_matiere_key" ON "Affectation"("id_classe", "id_matiere");

-- CreateIndex
CREATE UNIQUE INDEX "ResultatTrimestre_eleveId_idtrimestre_id_annee_key" ON "ResultatTrimestre"("eleveId", "idtrimestre", "id_annee");

-- CreateIndex
CREATE UNIQUE INDEX "Absence_matricule_eleve_trimestreId_key" ON "Absence"("matricule_eleve", "trimestreId");

-- CreateIndex
CREATE UNIQUE INDEX "Etablissement_id_key" ON "Etablissement"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Etablissement_admin_id_key" ON "Etablissement"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_matricule_eleve_id_annee_academique_key" ON "Inscription"("matricule_eleve", "id_annee_academique");

-- CreateIndex
CREATE UNIQUE INDEX "EnseignantEtablissement_enseignant_id_etablissement_id_key" ON "EnseignantEtablissement"("enseignant_id", "etablissement_id");

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enseignant" ADD CONSTRAINT "Enseignant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administrateur" ADD CONSTRAINT "Administrateur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_idEtablissement_fkey" FOREIGN KEY ("idEtablissement") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matiere" ADD CONSTRAINT "Matiere_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "Etablissement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_id_inscription_fkey" FOREIGN KEY ("id_inscription") REFERENCES "Inscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_id_matiere_fkey" FOREIGN KEY ("id_matiere") REFERENCES "Matiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_id_trimestre_fkey" FOREIGN KEY ("id_trimestre") REFERENCES "Trimestre"("id_trimestre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affectation" ADD CONSTRAINT "Affectation_id_classe_fkey" FOREIGN KEY ("id_classe") REFERENCES "Classe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affectation" ADD CONSTRAINT "Affectation_id_matiere_fkey" FOREIGN KEY ("id_matiere") REFERENCES "Matiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affectation" ADD CONSTRAINT "Affectation_id_prof_fkey" FOREIGN KEY ("id_prof") REFERENCES "Enseignant"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultatTrimestre" ADD CONSTRAINT "ResultatTrimestre_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultatTrimestre" ADD CONSTRAINT "ResultatTrimestre_idtrimestre_fkey" FOREIGN KEY ("idtrimestre") REFERENCES "Trimestre"("id_trimestre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultatTrimestre" ADD CONSTRAINT "ResultatTrimestre_id_annee_fkey" FOREIGN KEY ("id_annee") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_matricule_eleve_fkey" FOREIGN KEY ("matricule_eleve") REFERENCES "Eleve"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_trimestreId_fkey" FOREIGN KEY ("trimestreId") REFERENCES "Trimestre"("id_trimestre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etablissement" ADD CONSTRAINT "Etablissement_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Administrateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_matricule_eleve_fkey" FOREIGN KEY ("matricule_eleve") REFERENCES "Eleve"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_id_classe_fkey" FOREIGN KEY ("id_classe") REFERENCES "Classe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_id_annee_academique_fkey" FOREIGN KEY ("id_annee_academique") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnseignantEtablissement" ADD CONSTRAINT "EnseignantEtablissement_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "Enseignant"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnseignantEtablissement" ADD CONSTRAINT "EnseignantEtablissement_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "Etablissement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
