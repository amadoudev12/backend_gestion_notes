const logger = require('../lib/logger');

// Middleware centralisé pour la gestion des erreurs
const errorHandler = (err, req, res, next) => {
    logger.error(`[${req.method}] ${req.path}`, {
        message: err.message,
        stack: err.stack,
        body: req.body
    });

    // Erreurs de validation
    if (err.status === 400 || err.message.includes('validation')) {
        return res.status(400).json({
            message: 'Données invalides',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Erreurs non trouvé
    if (err.status === 404) {
        return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    // Erreurs d'autorisation
    if (err.status === 403 || err.message.includes('autorisation')) {
        return res.status(403).json({ message: 'Accès refusé' });
    }

    // Erreur par défaut
    return res.status(err.status || 500).json({
        message: 'Erreur serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = errorHandler;
