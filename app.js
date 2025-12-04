// Stockage local des talents (localStorage pour garder les données sur ce navigateur)
const STORAGE_KEY = 'carte_des_talents.profils';

/** @type {Array<{id:string, fullName:string, organization:string, skills:string[], passions:string[], languages:string[], projects:string[], availability:string, verified:boolean}>} */
let talents = [];

function loadTalents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    talents = raw ? JSON.parse(raw) : [];
  } catch {
    talents = [];
  }
}

function saveTalents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(talents));
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

function onSubmitProfil(event) {
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
    id: Date.now().toString(),
    fullName,
    organization,
    skills,
    passions,
    languages,
    projects,
    availability,
    verified,
  };

  talents.push(profile);
  saveTalents();
  buildSkillsCloud();
  alert('Profil enregistré localement sur ce navigateur.');
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

window.addEventListener('DOMContentLoaded', () => {
  loadTalents();
  setupNavigation();
  setupLivePreview();

  const profilForm = document.getElementById('profil-form');
  profilForm.addEventListener('submit', onSubmitProfil);

  const searchForm = document.getElementById('search-form');
  searchForm.addEventListener('submit', onSearch);

  buildSkillsCloud();
});
