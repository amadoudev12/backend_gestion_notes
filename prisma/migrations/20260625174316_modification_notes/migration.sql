/*
  Warnings:

  - You are about to drop the column `justifiee` on the `absence` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `absence` table. All the data in the column will be lost.
  - Added the required column `nombre_heure` to the `Absence` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `absence` DROP COLUMN `justifiee`,
    DROP COLUMN `nombre`,
    ADD COLUMN `nombre_heure` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `note` ADD COLUMN `dateEvaluation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
