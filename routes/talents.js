const express = require('express');
const Talent = require('../models/Talent');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const talents = await Talent.find().sort({ createdAt: -1 });
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

router.patch('/:id/verify', async (req, res) => {
  try {
    const secretKey = req.header('X-RESPONSABLE-KEY');
    if (!secretKey || secretKey !== process.env.RESPONSABLE_KEY) {
      return res.status(403).json({ message: 'Accès refusé : rôle responsable requis' });
    }

    const { id } = req.params;
    const updated = await Talent.findByIdAndUpdate(
      id,
      { verified: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Talent non trouvé' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la validation du talent" });
  }
});

module.exports = router;
