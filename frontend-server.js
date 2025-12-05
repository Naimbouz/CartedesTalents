const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const BASE_PATH = '/CartedesTalents';

// Serve static files (CSS, JS, etc.) from the current directory
app.use(`${BASE_PATH}`, express.static(path.join(__dirname), {
  // Set proper MIME types
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve index.html for the base path (with or without trailing slash)
app.get([BASE_PATH, `${BASE_PATH}/`], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server on all network interfaces (0.0.0.0) to be accessible from network
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Frontend server démarré!`);
  console.log(`🌐 URL principale: http://10.0.1.253:${PORT}${BASE_PATH}/`);
  console.log(`🔗 URL locale: http://localhost:${PORT}${BASE_PATH}/`);
  console.log(`\n💡 Assurez-vous que le backend est démarré sur le port 5000\n`);
});

