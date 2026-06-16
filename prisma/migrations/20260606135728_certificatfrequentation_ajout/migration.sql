-- CreateTable
CREATE TABLE `CertificatFrequentation` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `date_emission` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eleve_id` VARCHAR(191) NOT NULL,
    `annee_academique_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CertificatFrequentation_numero_key`(`numero`),
    INDEX `CertificatFrequentation_eleve_id_idx`(`eleve_id`),
    INDEX `CertificatFrequentation_annee_academique_id_idx`(`annee_academique_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompteurCertificat` (
    `id` VARCHAR(191) NOT NULL,
    `annee_academique_id` INTEGER NOT NULL,
    `compteur` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CompteurCertificat_annee_academique_id_key`(`annee_academique_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CertificatFrequentation` ADD CONSTRAINT `CertificatFrequentation_eleve_id_fkey` FOREIGN KEY (`eleve_id`) REFERENCES `Eleve`(`matricule`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CertificatFrequentation` ADD CONSTRAINT `CertificatFrequentation_annee_academique_id_fkey` FOREIGN KEY (`annee_academique_id`) REFERENCES `AnneeAcademique`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompteurCertificat` ADD CONSTRAINT `CompteurCertificat_annee_academique_id_fkey` FOREIGN KEY (`annee_academique_id`) REFERENCES `AnneeAcademique`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
