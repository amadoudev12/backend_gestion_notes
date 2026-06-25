#!/bin/bash

# Script de vérification de sécurité post-correction
# Exécution: bash security-check.sh

echo "🔒 Vérification de sécurité du backend..."
echo ""

# Vérifier les fichiers de sécurité
echo "1️⃣  Vérification des fichiers critiques..."
files=(
    "middleware/verifyToken.js"
    "middleware/errorHandler.js"
    "lib/logger.js"
    "middleware/validators.js"
    "server.js"
    ".env.example"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file MANQUANT"
    fi
done

echo ""
echo "2️⃣  Vérification des dépendances..."
dependencies=("helmet" "express-rate-limit" "express-validator")

for dep in "${dependencies[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        echo "   ✅ $dep installé"
    else
        echo "   ❌ $dep NON installé"
    fi
done

echo ""
echo "3️⃣  Configuration .env..."
if [ -f ".env" ]; then
    echo "   ✅ Fichier .env trouvé"
    # Vérifier les variables critiques
    if grep -q "SECRET_KEY" .env; then
        echo "   ✅ SECRET_KEY configuré"
    else
        echo "   ⚠️  SECRET_KEY manquant"
    fi
else
    echo "   ⚠️  Fichier .env manquant - utiliser .env.example"
fi

echo ""
echo "4️⃣  Vérification des logs..."
if [ -d "logs" ]; then
    echo "   ✅ Dossier logs créé"
else
    echo "   ℹ️  Dossier logs sera créé au premier démarrage"
fi

echo ""
echo "✨ Vérification terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Copier .env.example vers .env"
echo "2. Remplir les variables d'environnement"
echo "3. Exécuter: npm start"
