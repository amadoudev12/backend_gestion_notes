/*
  Warnings:

  - You are about to drop the `ResultatTrimestre` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ResultatTrimestre" DROP CONSTRAINT "ResultatTrimestre_eleveId_fkey";

-- DropForeignKey
ALTER TABLE "ResultatTrimestre" DROP CONSTRAINT "ResultatTrimestre_id_annee_fkey";

-- DropForeignKey
ALTER TABLE "ResultatTrimestre" DROP CONSTRAINT "ResultatTrimestre_idtrimestre_fkey";

-- DropTable
DROP TABLE "ResultatTrimestre";

-- CreateTable
CREATE TABLE "Bulletin" (
    "id" SERIAL NOT NULL,
    "eleveId" TEXT NOT NULL,
    "idtrimestre" INTEGER NOT NULL,
    "id_annee" INTEGER NOT NULL,
    "moyenneGenerale" DOUBLE PRECISION NOT NULL,
    "decision" TEXT NOT NULL,
    "rang" INTEGER NOT NULL,
    "mention" TEXT,
    "fichier_url" TEXT,

    CONSTRAINT "Bulletin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bulletin_eleveId_idtrimestre_id_annee_key" ON "Bulletin"("eleveId", "idtrimestre", "id_annee");

-- AddForeignKey
ALTER TABLE "Bulletin" ADD CONSTRAINT "Bulletin_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bulletin" ADD CONSTRAINT "Bulletin_idtrimestre_fkey" FOREIGN KEY ("idtrimestre") REFERENCES "Trimestre"("id_trimestre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bulletin" ADD CONSTRAINT "Bulletin_id_annee_fkey" FOREIGN KEY ("id_annee") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
