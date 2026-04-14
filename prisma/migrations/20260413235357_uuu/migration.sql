/*
  Warnings:

  - A unique constraint covering the columns `[matricule]` on the table `Eleve` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Eleve_matricule_key` ON `Eleve`(`matricule`);

-- AddForeignKey
ALTER TABLE `ResultatTrimestre` ADD CONSTRAINT `ResultatTrimestre_idtrimestre_fkey` FOREIGN KEY (`idtrimestre`) REFERENCES `Trimestre`(`id_trimestre`) ON DELETE RESTRICT ON UPDATE CASCADE;
