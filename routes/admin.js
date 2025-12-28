const express = require('express');
const Talent = require('../models/Talent');
const User = require('../models/User');
const JobReference = require('../models/JobReference');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const router = express.Router();

// Configure Multer for PDF uploads
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé : droits administrateur requis' });
  }
};

// Get dashboard statistics
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const totalTalents = await Talent.countDocuments();
    const verifiedTalents = await Talent.countDocuments({ verified: true });
    const unverifiedTalents = await Talent.countDocuments({ verified: false });

    res.json({
      totalTalents,
      verifiedTalents,
      unverifiedTalents
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques", error: err.message });
  }
});

// Toggle verify status
router.patch('/talents/:id/toggle-verify', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const talent = await Talent.findById(id);

    if (!talent) {
      return res.status(404).json({ message: 'Talent non trouvé' });
    }

    const updated = await Talent.findByIdAndUpdate(
      id,
      { verified: !talent.verified },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la modification", error: err.message });
  }
});

// Get all talents for admin
router.get('/talents', isAdmin, async (req, res) => {
  try {
    const talents = await Talent.find().sort({ createdAt: -1 });
    res.json(talents);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des talents", error: err.message });
  }
});

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs", error: err.message });
  }
});

// Create admin user
router.post('/create-admin', isAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username et password sont requis' });
    }

    if (password.length < 3) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 3 caractères' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur existe déjà' });
    }

    // Create admin user
    const admin = await User.create({
      username: username.toLowerCase(),
      password,
      role: 'admin'
    });

    res.status(201).json({
      message: 'Admin créé avec succès',
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création de l'admin", error: err.message });
  }
});

// Create user
router.post('/create-user', isAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username et password sont requis' });
    }

    if (password.length < 3) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 3 caractères' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur existe déjà' });
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      password,
      role: 'user'
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur", error: err.message });
  }
});

// Trigger Model Retraining
router.post('/retrain-model', isAdmin, async (req, res) => {
  try {
    // Call ML Service to retrain
    const response = await axios.post('http://localhost:5001/retrain');
    res.json({ message: "Modèle réentraîné avec succès", details: response.data });
  } catch (mlError) {
    console.error("ML Service Retrain Error:", mlError.message);
    res.status(503).json({ message: "Impossible de réentraîner le modèle (Service ML indisponible)" });
  }
});

// Visualize Matrix (Python Window)
router.post('/visualize-matrix', isAdmin, async (req, res) => {
  try {
    const response = await axios.post('http://localhost:5001/visualize');
    res.json({ message: "Visualisation ouverte", details: response.data });
  } catch (mlError) {
    console.error("ML Service Visualize Error:", mlError.message);
    res.status(503).json({ message: "Impossible d'ouvrir la visualisation (Service ML indisponible)" });
  }
});

// Predict talent validity
router.get('/talents/:id/predict', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const talent = await Talent.findById(id);

    if (!talent) {
      return res.status(404).json({ message: 'Talent non trouvé' });
    }

    // Call ML Service
    try {
      const response = await axios.post('http://localhost:5001/predict', {
        skills: talent.skills,
        projects: talent.projects,
        languages: talent.languages
      });

      res.json({
        talentId: talent._id,
        prediction: response.data
      });
    } catch (mlError) {
      console.error("ML Service Error:", mlError.message);
      res.status(503).json({ message: "Le service de prédiction ML est indisponible" });
    }

  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la prédiction", error: err.message });
  }
});

// Get ML Model Metrics (Confusion Matrix)
router.get('/ml-metrics', isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5001/metrics');
    res.json(response.data);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ message: "Métriques non trouvées (modèle non entraîné ?)" });
    }
    console.error("ML Service Error:", err.message);
    res.status(503).json({ message: "Impossible de récupérer les métriques ML" });
  }
});

// Match talent against job description PDF
router.post('/match-job/:talentId', isAdmin, upload.single('jobDescription'), async (req, res) => {
  console.log(`[Admin] Match Job Request for ${req.params.talentId}`);
  console.log(`[Admin] Content-Type: ${req.headers['content-type']}`);
  console.log(`[Admin] File received:`, req.file);
  console.log(`[Admin] Body keys:`, Object.keys(req.body));

  try {
    const { talentId } = req.params;

    if (!req.file) {
      console.error("[Admin] Error: No file uploaded");
      return res.status(400).json({ message: 'Veuillez uploader un fichier PDF (jobDescription)' });
    }

    const talent = await Talent.findById(talentId);
    if (!talent) {
      console.error("[Admin] Error: Talent not found");
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Talent non trouvé' });
    }

    // 1. Read and parse PDF
    console.log(`[Admin] Reading PDF from ${req.file.path}`);
    const dataBuffer = fs.readFileSync(req.file.path);
    let jobDescriptionText = "";

    try {
      const data = await pdf(dataBuffer);
      jobDescriptionText = data.text;
      console.log(`[Admin] PDF Parsed. content length: ${jobDescriptionText.length}`);
    } catch (pdfError) {
      console.error("[Admin] PDF Parse Error:", pdfError);
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Erreur lors de la lecture du PDF", error: pdfError.message });
    }

    // Clean up uploaded file immediately after reading
    fs.unlinkSync(req.file.path);

    // 2. Prepare talent profile text
    const talentProfileText = [
      ...talent.skills,
      ...talent.projects,
      ...talent.languages,
      talent.bio || "", // assuming bio might exist or just empty
      talent.organization || ""
    ].join(" ");

    // 3. Call ML Service for matching
    try {
      const response = await axios.post('http://localhost:5001/match', {
        job_description: jobDescriptionText,
        talent_profile: talentProfileText
      });

      res.json({
        talentId: talent._id,
        matchResult: response.data
      });
    } catch (mlError) {
      console.error("ML Service Error:", mlError.message);
      res.status(503).json({ message: "Le service ML est indisponible pour le matching" });
    }

  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Erreur lors du matching", error: err.message });
  }
});



// Upload Global Job Reference (Admin)
router.post('/reference-job', isAdmin, upload.single('jobPdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Veuillez uploader un fichier PDF (jobPdf)' });
    }

    console.log(`[Admin] New Reference Job Upload: ${req.file.path}`);

    // Parse PDF
    // Parse PDF
    console.log(`[Admin] Reading PDF from ${req.file.path}`);
    const stats = fs.statSync(req.file.path);
    console.log(`[Admin] File size: ${stats.size} bytes`);

    if (stats.size === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Le fichier PDF est vide." });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    let jobText = "";

    try {
      const data = await pdf(dataBuffer);
      jobText = data.text;
    } catch (pdfError) {
      console.error("[Admin] PDF Parse Error Stack:", pdfError);
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: `Erreur lecture PDF: ${pdfError.message}`, error: pdfError.toString() });
    }

    fs.unlinkSync(req.file.path);

    // Save to DB (Deactivate others first if single reference policy)
    // For simplicity, we just add new and we will pick the latest
    await JobReference.create({
      filename: req.file.originalname,
      text: jobText,
      isActive: true
    });

    res.json({ message: "Fiche de poste de référence mise à jour avec succès !" });

  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Erreur upload reference", error: err.message });
  }
});

module.exports = router;

