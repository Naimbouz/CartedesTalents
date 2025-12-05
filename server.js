const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');

dotenv.config();

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'carte-des-talents-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS configuration with credentials
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// API Routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const talentsRouter = require('./routes/talents');
app.use('/api/talents', talentsRouter);

const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

// Serve frontend static files
const BASE_PATH = '/CartedesTalents';

// Serve static files (CSS, JS, HTML, etc.) with proper paths
// Exclude login.html from static serving
app.use(`${BASE_PATH}`, express.static(path.join(__dirname), {
  index: false, // Don't serve index.html as default
  dotfiles: 'ignore', // Ignore dotfiles
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.js') {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (ext === '.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// Serve login.js as static file
app.get('/CartedesTalents/login.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.js'));
});

// Serve login.html at root
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve index.html for the frontend path (protected)
app.get([BASE_PATH, `${BASE_PATH}/`], (req, res) => {
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Also serve at root for convenience - redirect to login if not authenticated
app.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
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
  .then(async () => {
    // Initialize admin user if it doesn't exist
    const initializeAdmin = require('./utils/initAdmin');
    await initializeAdmin();
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
