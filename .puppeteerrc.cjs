/**
 * @type {import("puppeteer").Configuration}
 */
const path = require('path');
const os = require('os');

module.exports = {
  // Utilise la version système de Chrome si disponible
  skipDownload: false,
  
  // Configure le répertoire de cache - compatible Windows et Linux
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer'),
};
