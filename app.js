// Stockage local des talents (localStorage pour garder les données sur ce navigateur)
const STORAGE_KEY = 'carte_des_talents.profils';

/** @type {Array<{id?:string, _id?:string, fullName:string, organization:string, skills:string[], passions:string[], languages:string[], projects:string[], availability:string, verified:boolean}>} */
let talents = [];

// API base URL - use same origin since frontend and backend are on same port
const API_BASE_URL = window.location.origin;

async function loadTalents() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents`);
    if (!response.ok) throw new Error('Erreur de chargement');
    const data = await response.json();
    talents = Array.isArray(data) ? data : [];
  } catch {
    talents = [];
  }
}

function saveTalents() {
  // Stockage local désactivé : la source de vérité est désormais MongoDB via l'API.
}

function splitToList(value) {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function updatePreviewFromForm() {
  const fullName = document.getElementById('fullName').value || 'Nom Prénom';
  const organization = document.getElementById('organization').value || 'Établissement / Organisation';
  const skills = document.getElementById('skills').value;
  const passions = document.getElementById('passions').value;
  const languages = document.getElementById('languages').value;
  const projects = document.getElementById('projects').value;
  const availability = document.getElementById('availability').value;

  document.getElementById('preview-name').textContent = fullName;
  document.getElementById('preview-org').textContent = organization;

  const badgeEl = document.getElementById('preview-badge');
  // Pour les utilisateurs normaux, toujours afficher "Non vérifié" en rouge
  // Pour les admins, afficher selon le statut (mais les admins ne voient pas cette section)
  if (currentUser && currentUser.role === 'admin') {
    // Les admins ne voient pas cette section normalement, mais au cas où
    badgeEl.hidden = true;
  } else {
    // Pour les users, afficher "Non vérifié" en rouge
    badgeEl.textContent = '✗ Non vérifié';
    badgeEl.className = 'badge badge-unverified';
    badgeEl.hidden = false;
  }

  const skillsContainer = document.getElementById('preview-skills');
  skillsContainer.innerHTML = '';
  splitToList(skills).forEach((skill) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = skill;
    skillsContainer.appendChild(span);
  });

  const passionsContainer = document.getElementById('preview-passions');
  passionsContainer.innerHTML = '';
  splitToList(passions).forEach((p) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = p;
    passionsContainer.appendChild(span);
  });

  const languagesContainer = document.getElementById('preview-languages');
  languagesContainer.innerHTML = '';
  splitToList(languages).forEach((l) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = l;
    languagesContainer.appendChild(span);
  });

  const projectsContainer = document.getElementById('preview-projects');
  projectsContainer.innerHTML = '';
  projects
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean)
    .forEach((prj) => {
      const li = document.createElement('li');
      li.textContent = prj;
      projectsContainer.appendChild(li);
    });

  const availabilityEl = document.getElementById('preview-availability');
  const availabilityMap = {
    '': 'Non renseigné',
    projets: 'Disponible pour des projets',
    aide: 'Disponible pour aider ponctuellement',
    mentorat: 'Disponible pour du mentorat',
  };
  availabilityEl.textContent = availabilityMap[availability] ?? 'Non renseigné';
}

function downloadTalentCardPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("La génération de PDF n'est pas disponible (jsPDF non chargé).");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const marginLeft = 20;
  const marginRight = 190; // 210 - 20
  let y = 20;

  const name = document.getElementById('preview-name').textContent || '';
  const org = document.getElementById('preview-org').textContent || '';
  const isVerified = !document.getElementById('preview-badge').hidden;

  const skills = Array.from(document.querySelectorAll('#preview-skills .tag')).map((el) => el.textContent);
  const passions = Array.from(document.querySelectorAll('#preview-passions .tag')).map((el) => el.textContent);
  const languages = Array.from(document.querySelectorAll('#preview-languages .tag')).map((el) => el.textContent);
  const projects = Array.from(document.querySelectorAll('#preview-projects li')).map((el) => `• ${el.textContent}`);
  const availability = document.getElementById('preview-availability').textContent || '';

  // Titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CARTE DES TALENTS', marginLeft, y);
  y += 4;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.7);
  doc.line(marginLeft, y, marginRight, y);
  y += 8;

  // Bloc identité
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Identité', marginLeft, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(name || 'Nom non renseigné', marginLeft, y);
  y += 6;
  if (org) {
    doc.text(org, marginLeft, y);
    y += 6;
  }
  if (isVerified) {
    doc.setTextColor(34, 197, 94);
    doc.text('[Talent Verified]', marginLeft, y);
    doc.setTextColor(60, 60, 60);
    y += 8;
  } else {
    y += 4;
  }

  const addSection = (title, linesArray) => {
    if (!linesArray || linesArray.length === 0) return;

    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text(title.toUpperCase(), marginLeft, y);
    y += 4;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(marginLeft, y, marginRight, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(55, 65, 81);

    const text = Array.isArray(linesArray) ? linesArray.join(', ') : String(linesArray);
    const wrapped = doc.splitTextToSize(text, marginRight - marginLeft);
    wrapped.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, marginLeft + 2, y);
      y += 5;
    });
    y += 3;
  };

  addSection('Compétences', skills);
  addSection("Passions / centres d'intérêt", passions);
  addSection('Langues', languages);
  addSection('Projets réalisés', projects);
  addSection('Disponibilité', [availability]);

  // Pied de page
  const footerY = 290;
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Généré depuis la plateforme "Carte des Talents" – Défi national', marginLeft, footerY);

  const safeName = name || 'carte_talent';
  const filename = `Carte_de_talents_${safeName.replace(/[^a-z0-9\-_]+/gi, '_')}.pdf`;
  doc.save(filename);
}

async function onSubmitProfil(event) {
  event.preventDefault();

  const fullName = document.getElementById('fullName').value.trim();
  const organization = document.getElementById('organization').value.trim();
  const skills = splitToList(document.getElementById('skills').value);
  const passions = splitToList(document.getElementById('passions').value);
  const languages = splitToList(document.getElementById('languages').value);
  const projects = document
    .getElementById('projects')
    .value.split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
  const availability = document.getElementById('availability').value;

  if (!fullName) {
    alert('Merci de renseigner au moins votre nom.');
    return;
  }

  const profile = {
    fullName,
    organization,
    skills,
    passions,
    languages,
    projects,
    availability,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/talents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error('Erreur HTTP');
    }

    const created = await response.json();
    talents.push(created);
    buildSkillsCloud();
    alert('Profil enregistré dans la base de données.');
  } catch (e) {
    alert("Erreur lors de l'enregistrement du profil. Vérifiez que l'API est démarrée.");
  }
}

function buildSkillsCloud() {
  const container = document.getElementById('skills-cloud');
  container.innerHTML = '';

  /** @type {Record<string, number>} */
  const counter = {};

  talents.forEach((t) => {
    t.skills.forEach((skill) => {
      const key = skill.toLowerCase();
      counter[key] = (counter[key] || 0) + 1;
    });
  });

  const skills = Object.entries(counter).sort((a, b) => b[1] - a[1]);

  if (skills.length === 0) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Aucune compétence enregistrée pour le moment.';
    container.appendChild(p);
    document.getElementById('skills-cloud-selection').hidden = true;
    return;
  }

  skills.forEach(([skill, count]) => {
    const span = document.createElement('button');
    span.type = 'button';
    span.className = 'skill-pill';
    span.textContent = `${skill} (${count})`;
    span.dataset.skill = skill;
    span.addEventListener('click', () => showTalentsForSkill(skill));
    container.appendChild(span);
  });
}

function showTalentsForSkill(skill) {
  const panel = document.getElementById('skills-cloud-selection');
  const titleSpan = document.getElementById('selected-skill');
  const list = document.getElementById('selected-skill-talents');

  titleSpan.textContent = skill;
  list.innerHTML = '';

  const matches = talents.filter((t) => t.skills.some((s) => s.toLowerCase() === skill.toLowerCase()));

  matches.forEach((t) => {
    const li = document.createElement('li');
    // Pour les users, afficher "Non vérifié" en rouge, pour les admins afficher le statut approprié
    let verifiedText = '';
    if (currentUser && currentUser.role === 'admin') {
      verifiedText = t.verified 
        ? ' · <span style="color: #22c55e; font-weight: 600;">✓ Talent Verified</span>' 
        : ' · <span style="color: #f97373; font-weight: 600;">✗ Non vérifié</span>';
    } else {
      // Les users ne voient que les non vérifiés, donc toujours afficher "Non vérifié" en rouge
      verifiedText = ' · <span style="color: #f97373; font-weight: 600;">✗ Non vérifié</span>';
    }
    li.innerHTML = `${t.fullName} (${t.organization || 'Organisation non renseignée'})${verifiedText}`;
    list.appendChild(li);
  });

  if (matches.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Aucun talent trouvé pour cette compétence.';
    list.appendChild(li);
  }

  panel.hidden = false;
}

function onSearch(event) {
  event.preventDefault();

  const skill = document.getElementById('search-skill').value.trim().toLowerCase();
  const language = document.getElementById('search-language').value.trim().toLowerCase();
  const availability = document.getElementById('search-availability').value;
  const verifiedOnlyCheckbox = document.getElementById('search-verified-only');
  const verifiedOnly = verifiedOnlyCheckbox ? verifiedOnlyCheckbox.checked : false;

  const list = document.getElementById('search-results-list');
  const empty = document.getElementById('search-empty');

  list.innerHTML = '';

  const results = talents.filter((t) => {
    if (skill && !t.skills.some((s) => s.toLowerCase().includes(skill))) return false;
    if (language && !t.languages.some((l) => l.toLowerCase().includes(language))) return false;
    if (availability && t.availability !== availability) return false;
    // For normal users, they only see unverified talents anyway (filtered by API)
    // For admin, respect the verifiedOnly filter
    if (verifiedOnly && !t.verified) return false;
    return true;
  });

  if (results.length === 0) {
    empty.textContent = 'Aucun talent ne correspond à cette recherche.';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  results.forEach((t) => {
    const li = document.createElement('li');
    const skillsText = t.skills.join(', ');
    const languagesText = t.languages.join(', ');
    // Pour les users, afficher "Non vérifié" en rouge, pour les admins afficher le statut approprié
    let verifiedText = '';
    if (currentUser && currentUser.role === 'admin') {
      verifiedText = t.verified 
        ? ' · <span style="color: #22c55e; font-weight: 600;">✓ Talent Verified</span>' 
        : ' · <span style="color: #f97373; font-weight: 600;">✗ Non vérifié</span>';
    } else {
      // Les users ne voient que les non vérifiés, donc toujours afficher "Non vérifié" en rouge
      verifiedText = ' · <span style="color: #f97373; font-weight: 600;">✗ Non vérifié</span>';
    }
    li.innerHTML = `<strong>${t.fullName}</strong> (${t.organization || 'Organisation non renseignée'})${verifiedText}<br/><span class="muted">Compétences : ${skillsText || 'Non renseigné'}<br/>Langues : ${languagesText || 'Non renseigné'}</span>`;
    list.appendChild(li);
  });
}

function setupNavigation() {
  const buttons = document.querySelectorAll('.nav button');
  const sections = {
    profil: document.getElementById('section-profil'),
    carte: document.getElementById('section-carte'),
    collaborateur: document.getElementById('section-collaborateur'),
    'admin-dashboard': document.getElementById('section-admin-dashboard'),
    'admin-users': document.getElementById('section-admin-users'),
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.section;
      if (sections[target]) {
        Object.values(sections).forEach((s) => {
          if (s) s.classList.remove('active');
        });
        sections[target].classList.add('active');
        
        // Load dashboard if admin section is opened
        if (target === 'admin-dashboard' && currentUser && currentUser.role === 'admin') {
          loadAdminDashboard();
        }
        
        // Load users if admin users section is opened
        if (target === 'admin-users' && currentUser && currentUser.role === 'admin') {
          loadAdminUsers();
        }
        
        // Load users if admin users section is opened
        if (target === 'admin-users' && currentUser && currentUser.role === 'admin') {
          loadAdminUsers();
        }
      }
    });
  });
}

function setupLivePreview() {
  ['fullName', 'organization', 'skills', 'passions', 'languages', 'projects', 'availability'].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const eventName = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(eventName, updatePreviewFromForm);
    }
  );
  updatePreviewFromForm();
}

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (!data.authenticated) {
      window.location.href = '/login';
      return null;
    }
    
    currentUser = data.user;
    
    // Display user info
    const userInfoEl = document.getElementById('user-info');
    if (userInfoEl) {
      userInfoEl.textContent = `Connecté en tant que: ${data.user.username}${data.user.role === 'admin' ? ' (Admin)' : ''}`;
    }
    
    // Hide "verified only" checkbox for normal users (they only see unverified)
    if (data.user.role !== 'admin') {
      const verifiedOnlyCheckbox = document.getElementById('search-verified-only');
      if (verifiedOnlyCheckbox) {
        const label = verifiedOnlyCheckbox.closest('label.checkbox');
        if (label) label.style.display = 'none';
      }
    }
    
    // Show admin buttons if admin and hide other sections
    if (data.user.role === 'admin') {
      const adminBtn = document.getElementById('admin-nav-btn');
      const adminUsersBtn = document.getElementById('admin-users-nav-btn');
      if (adminBtn) adminBtn.style.display = 'block';
      if (adminUsersBtn) adminUsersBtn.style.display = 'block';
      
      // Hide navigation buttons for admin (only show admin sections)
      const navButtons = document.querySelectorAll('.nav button[data-section]');
      navButtons.forEach(btn => {
        const section = btn.dataset.section;
        if (section !== 'admin-dashboard' && section !== 'admin-users') {
          btn.style.display = 'none';
        }
      });
      
      // Show only admin dashboard section by default
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => {
        section.classList.remove('active');
      });
      const adminSection = document.getElementById('section-admin-dashboard');
      if (adminSection) {
        adminSection.classList.add('active');
      }
    }
    
    return data.user;
  } catch (error) {
    console.error('Error checking auth:', error);
    window.location.href = '/login';
    return null;
  }
}

// Logout function
async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = '/login';
  } catch (error) {
    console.error('Error logging out:', error);
    window.location.href = '/login';
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  const user = await checkAuth();
  if (!user) return;
  
  await loadTalents();
  setupNavigation();
  setupLivePreview();

  const profilForm = document.getElementById('profil-form');
  profilForm.addEventListener('submit', onSubmitProfil);

  const pdfBtn = document.getElementById('download-pdf');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', downloadTalentCardPdf);
  }

  const searchForm = document.getElementById('search-form');
  searchForm.addEventListener('submit', onSearch);

  buildSkillsCloud();
  
  // Logout button
  const logoutBtnHeader = document.getElementById('logout-btn-header');
  if (logoutBtnHeader) {
    logoutBtnHeader.addEventListener('click', logout);
  }
  
  // Dashboard Admin
  setupAdminDashboard();
});

// Helper function for availability text
function getAvailabilityText(availability) {
  const map = {
    'projets': 'Disponible pour des projets',
    'aide': 'Disponible pour aider ponctuellement',
    'mentorat': 'Disponible pour du mentorat',
    '': 'Non renseigné'
  };
  return map[availability] || 'Non renseigné';
}

// ===== FONCTIONS DASHBOARD ADMIN =====
let currentUser = null;

async function setupAdminDashboard() {
  // Check if user is admin
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.authenticated && data.user.role === 'admin') {
      currentUser = data.user;
      document.getElementById('admin-nav-btn').style.display = 'block';
      await loadAdminDashboard();
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
}

async function loadAdminDashboard() {
  try {
    await Promise.all([
      loadAdminStats(),
      loadAdminTalents()
    ]);
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
  }
}

async function loadAdminStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erreur de chargement');
    const stats = await response.json();
    
    document.getElementById('stat-total-talents').textContent = stats.totalTalents;
    document.getElementById('stat-verified-talents').textContent = stats.verifiedTalents;
    document.getElementById('stat-unverified-talents').textContent = stats.unverifiedTalents;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}


let allAdminTalents = [];

async function loadAdminTalents() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/talents`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erreur de chargement');
    allAdminTalents = await response.json();
    
    displayAdminProfiles(allAdminTalents);
  } catch (error) {
    console.error('Error loading admin talents:', error);
    const container = document.getElementById('admin-profiles-list');
    if (container) {
      container.innerHTML = '<p class="error-message" style="text-align: center; padding: 2rem;">Erreur lors du chargement</p>';
    }
  }
}

function displayAdminProfiles(talents) {
  const container = document.getElementById('admin-profiles-list');
  if (!container) return;
  
  if (talents.length === 0) {
    container.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">Aucun profil trouvé</p>';
    return;
  }
  
  container.innerHTML = talents.map(talent => {
    const date = new Date(talent.createdAt).toLocaleDateString('fr-FR');
    const skillsText = talent.skills.length > 0 ? talent.skills.join(', ') : 'Aucune';
    const passionsText = talent.passions.length > 0 ? talent.passions.join(', ') : 'Aucune';
    const languagesText = talent.languages.length > 0 ? talent.languages.join(', ') : 'Aucune';
    
    return `
      <div class="admin-profile-card ${talent.verified ? 'verified' : 'unverified'}">
        <div class="admin-profile-header">
          <div>
            <h4>${talent.fullName} ${talent.verified ? '<span class="verified-badge">✓ Vérifié</span>' : ''}</h4>
            <p class="muted">${talent.organization || 'Organisation non renseignée'}</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" ${talent.verified ? 'checked' : ''} onchange="toggleVerifyTalent('${talent._id}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="admin-profile-body">
          <div class="profile-info-row">
            <strong>Compétences:</strong>
            <span>${skillsText}</span>
          </div>
          <div class="profile-info-row">
            <strong>Passions:</strong>
            <span>${passionsText}</span>
          </div>
          <div class="profile-info-row">
            <strong>Langues:</strong>
            <span>${languagesText}</span>
          </div>
          ${talent.projects && talent.projects.length > 0 ? `
          <div class="profile-info-row">
            <strong>Projets:</strong>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
              ${talent.projects.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          <div class="profile-info-row">
            <strong>Disponibilité:</strong>
            <span>${getAvailabilityText(talent.availability)}</span>
          </div>
          <div class="profile-info-row">
            <strong>Date de création:</strong>
            <span>${date}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleVerifyTalent(id, verified) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/talents/${id}/toggle-verify`, {
      method: 'PATCH',
      credentials: 'include'
    });
    
    if (response.ok) {
      await loadAdminDashboard();
      await loadTalents();
      buildSkillsCloud();
    } else {
      const data = await response.json();
      alert(data.message || 'Erreur lors de la modification');
      // Reload to reset toggle
      await loadAdminDashboard();
    }
  } catch (error) {
    alert('Erreur lors de la modification');
    await loadAdminDashboard();
  }
}

// Make function available globally
window.toggleVerifyTalent = toggleVerifyTalent;

// Filter and search
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('admin-search');
  const filterSelect = document.getElementById('admin-filter');
  const refreshBtn = document.getElementById('refresh-dashboard');
  
  if (searchInput) {
    searchInput.addEventListener('input', filterAdminProfiles);
  }
  
  if (filterSelect) {
    filterSelect.addEventListener('change', filterAdminProfiles);
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAdminDashboard();
    });
  }
});

function filterAdminProfiles() {
  const search = document.getElementById('admin-search')?.value.toLowerCase() || '';
  const filter = document.getElementById('admin-filter')?.value || 'all';
  
  let filtered = allAdminTalents.filter(talent => {
    const matchesSearch = !search || 
      talent.fullName.toLowerCase().includes(search) ||
      (talent.organization && talent.organization.toLowerCase().includes(search)) ||
      talent.skills.some(s => s.toLowerCase().includes(search)) ||
      talent.passions.some(p => p.toLowerCase().includes(search));
    
    const matchesFilter = filter === 'all' ||
      (filter === 'verified' && talent.verified) ||
      (filter === 'unverified' && !talent.verified);
    
    return matchesSearch && matchesFilter;
  });
  
  displayAdminProfiles(filtered);
}

async function loadAdminUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erreur de chargement');
    const users = await response.json();
    
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    
    if (users.length === 0) {
      container.innerHTML = '<p class="muted">Aucun utilisateur</p>';
      return;
    }
    
    container.innerHTML = users.map(user => `
      <div class="user-item">
        <div class="user-info">
          <strong>${user.username}</strong>
          <span class="user-badge">${user.role}</span>
        </div>
        <span class="muted" style="font-size: 0.85rem;">Créé le ${new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Create admin
async function createAdmin(event) {
  event.preventDefault();
  
  const username = document.getElementById('new-admin-username').value.trim();
  const password = document.getElementById('new-admin-password').value;
  const messageEl = document.getElementById('create-admin-message');
  
  if (!username || !password) {
    messageEl.innerHTML = '<p class="error-message">Veuillez remplir tous les champs</p>';
    return;
  }
  
  if (password.length < 3) {
    messageEl.innerHTML = '<p class="error-message">Le mot de passe doit contenir au moins 3 caractères</p>';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageEl.innerHTML = '<p class="success-message">Admin créé avec succès!</p>';
      document.getElementById('create-admin-form').reset();
      await loadAdminUsers();
      setTimeout(() => {
        messageEl.innerHTML = '';
      }, 3000);
    } else {
      messageEl.innerHTML = `<p class="error-message">${data.message || 'Erreur lors de la création'}</p>`;
    }
  } catch (error) {
    messageEl.innerHTML = '<p class="error-message">Erreur de connexion au serveur</p>';
  }
}

// Create user
async function createUser(event) {
  event.preventDefault();
  
  const username = document.getElementById('new-user-username').value.trim();
  const password = document.getElementById('new-user-password').value;
  const messageEl = document.getElementById('create-user-message');
  
  if (!username || !password) {
    messageEl.innerHTML = '<p class="error-message">Veuillez remplir tous les champs</p>';
    return;
  }
  
  if (password.length < 3) {
    messageEl.innerHTML = '<p class="error-message">Le mot de passe doit contenir au moins 3 caractères</p>';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageEl.innerHTML = '<p class="success-message">Utilisateur créé avec succès!</p>';
      document.getElementById('create-user-form').reset();
      await loadAdminUsers();
      setTimeout(() => {
        messageEl.innerHTML = '';
      }, 3000);
    } else {
      messageEl.innerHTML = `<p class="error-message">${data.message || 'Erreur lors de la création'}</p>`;
    }
  } catch (error) {
    messageEl.innerHTML = '<p class="error-message">Erreur de connexion au serveur</p>';
  }
}

// Setup create admin/user forms and refresh button
document.addEventListener('DOMContentLoaded', () => {
  const createAdminForm = document.getElementById('create-admin-form');
  if (createAdminForm) {
    createAdminForm.addEventListener('submit', createAdmin);
  }
  
  const createUserForm = document.getElementById('create-user-form');
  if (createUserForm) {
    createUserForm.addEventListener('submit', createUser);
  }
  
  const refreshUsersBtn = document.getElementById('refresh-users');
  if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', () => {
      loadAdminUsers();
    });
  }
});
// ===== FIN FONCTIONS DASHBOARD ADMIN =====
