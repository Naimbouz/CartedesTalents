const express = require('express');
const Talent = require('../models/Talent');
const axios = require('axios');

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

// Analyze profile (Public/User)
// Analyze profile (Public/User)
router.post('/analyze', async (req, res) => {
  try {
    const { skills, projects, languages } = req.body;

    // Check if there is a Reference Job (created by Admin)
    // We create a temporary model requirement here to retrieve it, or we could require it at top
    // For clean code, let's assume we can fetch it. Ideally we should import JobReference at top
    // But since we didn't import it in this file yet:
    const mongoose = require('mongoose');
    let JobReference;
    try {
      JobReference = mongoose.model('JobReference');
    } catch {
      JobReference = require('../models/JobReference');
    }

    const latestJob = await JobReference.findOne({ isActive: true }).sort({ createdAt: -1 });

    const talentProfileText = [
      ...(skills || []),
      ...(projects || []),
      ...(languages || [])
    ].join(" ");

    // Call ML Service
    try {
      let response;
      let analysisType = 'validity';

      if (latestJob) {
        // MATCHING MODE
        console.log("Analyzing against Reference Job:", latestJob.filename);
        response = await axios.post('http://localhost:5001/match', {
          job_description: latestJob.text,
          talent_profile: talentProfileText
        });
        analysisType = 'job_match';
      } else {
        // VALIDITY MODE (Legacy)
        console.log("Analyzing validity (no reference job)");
        response = await axios.post('http://localhost:5001/predict', {
          skills: skills || [],
          projects: projects || [],
          languages: languages || []
        });
      }

      res.json({
        ...response.data,
        analysisType
      });

    } catch (mlError) {
      console.error("ML Service Error:", mlError.message);
      if (mlError.response) {
        console.error("ML Service Response Data:", mlError.response.data);
        console.error("ML Service Status:", mlError.response.status);
      } else if (mlError.request) {
        console.error("ML Service: No response received (Connection refused?)");
      }
      res.status(503).json({ message: "Le service de prédiction ML est indisponible" });
    }

  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'analyse", error: err.message });
  }
});

module.exports = router;
