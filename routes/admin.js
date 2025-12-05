const express = require('express');
const Talent = require('../models/Talent');
const User = require('../models/User');

const router = express.Router();

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

module.exports = router;

