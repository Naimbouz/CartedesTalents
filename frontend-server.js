const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const BASE_PATH = '/CartedesTalents';

// Serve static files from the current directory
app.use(BASE_PATH, express.static(path.join(__dirname)));

// Serve index.html for the base path
app.get(BASE_PATH, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve index.html for the base path with trailing slash
app.get(`${BASE_PATH}/`, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server on all network interfaces (0.0.0.0) to be accessible from network
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server démarré sur http://10.0.1.253:${PORT}${BASE_PATH}/`);
  console.log(`Accessible également sur http://localhost:${PORT}${BASE_PATH}/`);
});

