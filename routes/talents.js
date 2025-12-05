const express = require('express');
const Talent = require('../models/Talent');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Si l'utilisateur est un user normal, ne montrer que les talents non vérifiés
    // Si c'est un admin, montrer tous les talents
    const query = req.session.role === 'admin' 
      ? {} 
      : { verified: false };
    
    const talents = await Talent.find(query).sort({ createdAt: -1 });
    res.json(talents);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des talents" });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.fullName) {
      return res.status(400).json({ message: 'fullName est requis' });
    }

    const talent = await Talent.create({
      fullName: payload.fullName,
      organization: payload.organization || '',
      skills: payload.skills || [],
      passions: payload.passions || [],
      languages: payload.languages || [],
      projects: payload.projects || [],
      availability: payload.availability || '',
      verified: false,
    });

    res.status(201).json(talent);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'enregistrement du talent" });
  }
});

module.exports = router;
