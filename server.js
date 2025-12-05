const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
const talentsRouter = require('./routes/talents');
app.use('/api/talents', talentsRouter);

// Serve frontend static files
const BASE_PATH = '/CartedesTalents';
app.use(`${BASE_PATH}`, express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve index.html for the frontend path
app.get([BASE_PATH, `${BASE_PATH}/`], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Also serve at root for convenience
app.get('/', (req, res) => {
  res.redirect(`${BASE_PATH}/`);
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI manquant dans le fichier .env');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Serveur démarré sur le port ${PORT}`);
      console.log(`\n🌐 Frontend accessible sur:`);
      console.log(`   - http://10.0.1.253:${PORT}${BASE_PATH}/`);
      console.log(`   - http://localhost:${PORT}${BASE_PATH}/`);
      console.log(`\n🔌 API accessible sur:`);
      console.log(`   - http://10.0.1.253:${PORT}/api/talents`);
      console.log(`   - http://localhost:${PORT}/api/talents\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Erreur: Le port ${PORT} est déjà utilisé.`);
        console.error(`💡 Solution: Arrêtez le processus utilisant le port ${PORT} ou changez le port dans le fichier .env\n`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  })
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB', err);
    process.exit(1);
  });
