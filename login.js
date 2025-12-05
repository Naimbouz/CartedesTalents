// API base URL
const API_BASE_URL = window.location.origin;

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    
    // Update tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${targetTab}-tab`).classList.add('active');
    
    // Clear messages
    hideMessages();
  });
});

function showError(message) {
  const errorEl = document.getElementById('error-message');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  document.getElementById('success-message').style.display = 'none';
}

function showSuccess(message) {
  const successEl = document.getElementById('success-message');
  successEl.textContent = message;
  successEl.style.display = 'block';
  document.getElementById('error-message').style.display = 'none';
}

function hideMessages() {
  document.getElementById('error-message').style.display = 'none';
  document.getElementById('success-message').style.display = 'none';
}

// Check if already logged in
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.authenticated) {
      // Redirect to main app
      window.location.href = '/CartedesTalents/';
    }
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}

// Login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    showError('Veuillez remplir tous les champs');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccess('Connexion réussie! Redirection...');
      setTimeout(() => {
        window.location.href = '/CartedesTalents/';
      }, 1000);
    } else {
      showError(data.message || 'Erreur lors de la connexion');
    }
  } catch (error) {
    showError('Erreur de connexion au serveur');
  }
});

// Register form
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();
  
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const passwordConfirm = document.getElementById('register-password-confirm').value;
  
  if (!username || !password || !passwordConfirm) {
    showError('Veuillez remplir tous les champs');
    return;
  }
  
  if (password.length < 3) {
    showError('Le mot de passe doit contenir au moins 3 caractères');
    return;
  }
  
  if (password !== passwordConfirm) {
    showError('Les mots de passe ne correspondent pas');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccess('Compte créé avec succès! Connexion...');
      setTimeout(() => {
        window.location.href = '/CartedesTalents/';
      }, 1000);
    } else {
      showError(data.message || 'Erreur lors de la création du compte');
    }
  } catch (error) {
    showError('Erreur de connexion au serveur');
  }
});

// Check auth on load
checkAuth();


