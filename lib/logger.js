const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const formatLog = (level, message, data) => {
    return JSON.stringify({
        timestamp: getTimestamp(),
        level,
        message,
        data: data || {}
    });
};

const logger = {
    info: (message, data = {}) => {
        const log = formatLog('INFO', message, data);
        console.log(log);
        fs.appendFileSync(path.join(logsDir, 'app.log'), log + '\n');
    },

    error: (message, data = {}) => {
        const log = formatLog('ERROR', message, data);
        console.error(log);
        fs.appendFileSync(path.join(logsDir, 'error.log'), log + '\n');
    },

    warn: (message, data = {}) => {
        const log = formatLog('WARN', message, data);
        console.warn(log);
        fs.appendFileSync(path.join(logsDir, 'app.log'), log + '\n');
    },

    debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            const log = formatLog('DEBUG', message, data);
            console.debug(log);
        }
    }
};

module.exports = logger;
