// Stockage local des talents (localStorage pour garder les données sur ce navigateur)
const STORAGE_KEY = 'carte_des_talents.profils';

/** @type {Array<{id?:string, _id?:string, fullName:string, organization:string, skills:string[], passions:string[], languages:string[], projects:string[], availability:string, verified:boolean}>} */
let talents = [];

async function loadTalents() {
  try {
    const response = await fetch('http://localhost:5000/api/talents');
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
  const verified = document.getElementById('talentVerified').checked;

  document.getElementById('preview-name').textContent = fullName;
  document.getElementById('preview-org').textContent = organization;

  const badgeEl = document.getElementById('preview-badge');
  badgeEl.hidden = !verified;

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
  const verified = document.getElementById('talentVerified').checked;

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
    verified,
  };

  try {
    const response = await fetch('http://localhost:5000/api/talents', {
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
    const verifiedText = t.verified ? ' · Talent Verified' : '';
    li.textContent = `${t.fullName} (${t.organization || 'Organisation non renseignée'})${verifiedText}`;
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
  const verifiedOnly = document.getElementById('search-verified-only').checked;

  const list = document.getElementById('search-results-list');
  const empty = document.getElementById('search-empty');

  list.innerHTML = '';

  const results = talents.filter((t) => {
    if (skill && !t.skills.some((s) => s.toLowerCase().includes(skill))) return false;
    if (language && !t.languages.some((l) => l.toLowerCase().includes(language))) return false;
    if (availability && t.availability !== availability) return false;
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
    const verifiedText = t.verified ? ' · Talent Verified' : '';
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
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.section;
      Object.values(sections).forEach((s) => s.classList.remove('active'));
      sections[target].classList.add('active');
    });
  });
}

function setupLivePreview() {
  ['fullName', 'organization', 'skills', 'passions', 'languages', 'projects', 'availability', 'talentVerified'].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const eventName = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(eventName, updatePreviewFromForm);
    }
  );
  updatePreviewFromForm();
}

window.addEventListener('DOMContentLoaded', async () => {
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
});
