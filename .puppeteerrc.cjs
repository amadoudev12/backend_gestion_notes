/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Utilise la version système de Chrome si disponible
  skipDownload: false,
  
  // Configure le répertoire de cache
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || process.env.HOME + '/.cache/puppeteer',
  
  // Télécharge la version spécifiée
  browsers: [
    {
      browser: 'chrome',
      platform: 'linux',
      buildId: '147.0.7727.57',
    },
  ],
};
