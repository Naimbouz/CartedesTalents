const User = require('../models/User');

async function initializeAdmin() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = await User.create({
        username: 'admin',
        password: 'admin',
        role: 'admin'
      });
      console.log('✅ Utilisateur admin créé: username=admin, password=admin');
    } else {
      console.log('ℹ️  Utilisateur admin existe déjà');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'admin:', error);
  }
}

module.exports = initializeAdmin;


