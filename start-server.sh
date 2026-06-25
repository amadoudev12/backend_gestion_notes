#!/bin/bash

# Script de démarrage du serveur avec vérifications
# Usage: bash start-server.sh

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   🚀 DÉMARRAGE DU SERVEUR - GESTION DES NOTES     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Vérifications préalables
echo "📋 Vérifications..."

# 1. Vérifier .env
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env manquant!"
    echo "   → Copier .env.example vers .env"
    echo "   → Remplir les variables"
    exit 1
else
    echo "✅ Fichier .env trouvé"
fi

# 2. Vérifier les dépendances
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules manquant, installation..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation"
        exit 1
    fi
fi
echo "✅ Dépendances OK"

# 3. Créer le dossier logs s'il n'existe pas
if [ ! -d "logs" ]; then
    mkdir -p logs
    echo "✅ Dossier logs créé"
else
    echo "✅ Dossier logs trouvé"
fi

# 4. Vérifier les uploads
if [ ! -d "uploads" ]; then
    mkdir -p uploads/{bulletins,fiches_notes,imports,signatures}
    echo "✅ Dossiers uploads créés"
else
    echo "✅ Dossiers uploads trouvés"
fi

echo ""
echo "🔒 Configuration de sécurité..."

# Vérifier les secrets
if grep -q "SECRET_KEY=your-super-secret" .env 2>/dev/null; then
    echo "⚠️  ATTENTION: SECRET_KEY par défaut détecté!"
    echo "   → Générer une nouvelle clé secrète"
    NEW_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-me-$(date +%s)")
    echo "   → Suggérée: $NEW_SECRET"
fi

echo ""
echo "🌐 Vérification des ports..."

PORT=${PORT:-3000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port $PORT déjà utilisé!"
    echo "   → Changer le port dans .env ou tuer le processus"
    exit 1
else
    echo "✅ Port $PORT disponible"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Démarrage du serveur..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Afficher les infos
echo "📝 Informations:"
echo "   Port: $PORT"
echo "   Environnement: ${NODE_ENV:-development}"
echo "   Logs: logs/app.log et logs/error.log"
echo ""
echo "💡 Commandes utiles:"
echo "   • Voir les logs: tail -f logs/app.log"
echo "   • Voir les erreurs: tail -f logs/error.log"
echo "   • Arrêter: Ctrl+C"
echo ""

# Démarrer le serveur
npm start
