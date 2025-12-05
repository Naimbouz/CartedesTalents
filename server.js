const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const talentsRouter = require('./routes/talents');
app.use('/api/talents', talentsRouter);

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
    const server = app.listen(PORT, () => {
      console.log(`Serveur API démarré sur le port ${PORT}`);
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
