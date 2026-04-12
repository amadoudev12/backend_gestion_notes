-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `login` VARCHAR(191) NOT NULL,
    `mot_passe` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'ENSEIGNANT', 'ELEVE') NOT NULL,

    UNIQUE INDEX `User_login_key`(`login`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Eleve` (
    `matricule` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `dateNaissance` DATETIME(3) NULL,
    `lieuNaissance` VARCHAR(191) NULL,
    `sexe` ENUM('M', 'F') NULL,
    `affecte` ENUM('oui', 'non') NOT NULL DEFAULT 'non',
    `boursier` ENUM('oui', 'non') NOT NULL DEFAULT 'non',
    `redoublant` ENUM('oui', 'non') NOT NULL DEFAULT 'non',
    `nationalite` VARCHAR(191) NOT NULL DEFAULT 'Ivoirienne',
    `idClasse` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Eleve_userId_key`(`userId`),
    PRIMARY KEY (`matricule`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enseignant` (
    `matricule` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Enseignant_userId_key`(`userId`),
    PRIMARY KEY (`matricule`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Administrateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Administrateur_email_key`(`email`),
    UNIQUE INDEX `Administrateur_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Classe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `libelle` VARCHAR(191) NOT NULL,
    `idEtablissement` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Matiere` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Matiere_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trimestre` (
    `id_trimestre` INTEGER NOT NULL AUTO_INCREMENT,
    `libelle` VARCHAR(191) NOT NULL,
    `date_debut` DATETIME(3) NOT NULL,
    `date_fin` DATETIME(3) NOT NULL,
    `actif` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_trimestre`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Note` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valeur` DOUBLE NOT NULL,
    `typeEvaluation` VARCHAR(191) NOT NULL,
    `coefficient` INTEGER NOT NULL DEFAULT 1,
    `matricule_eleve` VARCHAR(191) NOT NULL,
    `id_matiere` INTEGER NOT NULL,
    `id_trimestre` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dispenser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_matiere` INTEGER NOT NULL,
    `id_classe` INTEGER NOT NULL,
    `coefficient` INTEGER NOT NULL,

    UNIQUE INDEX `Dispenser_id_matiere_id_classe_key`(`id_matiere`, `id_classe`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enseigner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_prof` VARCHAR(191) NOT NULL,
    `id_matiere` INTEGER NOT NULL,
    `id_classe` INTEGER NOT NULL,

    UNIQUE INDEX `Enseigner_id_prof_id_matiere_id_classe_key`(`id_prof`, `id_matiere`, `id_classe`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResultatTrimestre` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eleveId` VARCHAR(191) NOT NULL,
    `idtrimestre` INTEGER NOT NULL,
    `moyenneGenerale` DOUBLE NOT NULL,
    `decision` VARCHAR(191) NOT NULL,
    `rang` INTEGER NOT NULL,
    `mention` VARCHAR(191) NULL,
    `anneeScolaire` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Absence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` INTEGER NOT NULL,
    `justifiee` ENUM('oui', 'non') NOT NULL DEFAULT 'oui',
    `matricule_eleve` VARCHAR(191) NOT NULL,
    `trimestreId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Absence_matricule_eleve_trimestreId_key`(`matricule_eleve`, `trimestreId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Etablissement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `adresse` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `statut` VARCHAR(191) NOT NULL,
    `directeur` VARCHAR(191) NOT NULL,
    `admin_id` INTEGER NOT NULL,

    UNIQUE INDEX `Etablissement_id_key`(`id`),
    UNIQUE INDEX `Etablissement_admin_id_key`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Eleve` ADD CONSTRAINT `Eleve_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Eleve` ADD CONSTRAINT `fk_eleve_classe` FOREIGN KEY (`idClasse`) REFERENCES `Classe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enseignant` ADD CONSTRAINT `Enseignant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Administrateur` ADD CONSTRAINT `Administrateur_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Classe` ADD CONSTRAINT `Classe_idEtablissement_fkey` FOREIGN KEY (`idEtablissement`) REFERENCES `Etablissement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_matricule_eleve_fkey` FOREIGN KEY (`matricule_eleve`) REFERENCES `Eleve`(`matricule`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_id_matiere_fkey` FOREIGN KEY (`id_matiere`) REFERENCES `Matiere`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_id_trimestre_fkey` FOREIGN KEY (`id_trimestre`) REFERENCES `Trimestre`(`id_trimestre`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispenser` ADD CONSTRAINT `fk_dispenser_matiere` FOREIGN KEY (`id_matiere`) REFERENCES `Matiere`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispenser` ADD CONSTRAINT `fk_dispenser_classe` FOREIGN KEY (`id_classe`) REFERENCES `Classe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enseigner` ADD CONSTRAINT `fk_enseigner_prof` FOREIGN KEY (`id_prof`) REFERENCES `Enseignant`(`matricule`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enseigner` ADD CONSTRAINT `fk_enseigner_matiere` FOREIGN KEY (`id_matiere`) REFERENCES `Matiere`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enseigner` ADD CONSTRAINT `fk_enseigner_classe` FOREIGN KEY (`id_classe`) REFERENCES `Classe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResultatTrimestre` ADD CONSTRAINT `ResultatTrimestre_eleveId_fkey` FOREIGN KEY (`eleveId`) REFERENCES `Eleve`(`matricule`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Absence` ADD CONSTRAINT `Absence_matricule_eleve_fkey` FOREIGN KEY (`matricule_eleve`) REFERENCES `Eleve`(`matricule`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Absence` ADD CONSTRAINT `Absence_trimestreId_fkey` FOREIGN KEY (`trimestreId`) REFERENCES `Trimestre`(`id_trimestre`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Etablissement` ADD CONSTRAINT `Etablissement_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `Administrateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
