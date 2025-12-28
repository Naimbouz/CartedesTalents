// User Score Logic
document.addEventListener('DOMContentLoaded', () => {
    const btnCalculate = document.getElementById('btn-calculate-user-score');
    if (btnCalculate) {
        btnCalculate.addEventListener('click', calculateUserScore);
    }
});

async function calculateUserScore() {
    const skills = splitToList(document.getElementById('skills').value);
    const languages = splitToList(document.getElementById('languages').value);
    const projects = document
        .getElementById('projects')
        .value.split('\n')
        .map((v) => v.trim())
        .filter(Boolean);

    if (skills.length === 0 && languages.length === 0 && projects.length === 0) {
        alert("Veuillez d'abord remplir votre profil (Compétences, Projets, Langues).");
        return;
    }

    const btn = document.getElementById('btn-calculate-user-score');
    const originalText = btn.textContent;
    btn.textContent = "Analyse IA en cours...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/talents/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                skills,
                languages,
                projects
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Erreur lors de l'analyse");

        displayUserScore(data, skills.length, projects.length, languages.length);

    } catch (error) {
        alert("Erreur: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function displayUserScore(data, skillsCount, projectsCount, langsCount) {
    const resultCard = document.getElementById('user-score-result');
    const scoreVal = document.getElementById('user-score-value');
    const verdict = document.getElementById('user-score-verdict');
    const circle = document.getElementById('user-score-circle');
    const label = circle.querySelector('small');
    const keywordsContainer = document.getElementById('user-score-keywords');

    // Update counts
    document.getElementById('feat-skills-count').textContent = skillsCount;
    document.getElementById('feat-projects-count').textContent = projectsCount;
    document.getElementById('feat-langs-count').textContent = langsCount;

    resultCard.hidden = false;

    let score = 0;
    let color = '#f97373';
    let text = "Profil incomplet";

    if (data.analysisType === 'job_match') {
        // Mode Matching
        if (label) label.textContent = "Compatibilité";
        score = Math.round(data.match_percentage);

        if (score > 75) {
            color = '#22c55e'; // Green
            text = "✨ Excellente Correspondance !";
        } else if (score > 40) {
            color = '#f59e0b'; // Orange
            text = "Correspondance Partielle";
        } else {
            text = "Profil peu adapté";
        }

        // Show Keywords
        if (keywordsContainer) {
            keywordsContainer.hidden = false;
            keywordsContainer.innerHTML = '';

            if (data.matching_terms && data.matching_terms.length > 0) {
                const p = document.createElement('p');
                p.className = 'muted';
                p.style.marginBottom = '0.5rem';
                p.style.fontSize = '0.9rem';
                p.textContent = `Mots-clés communs (${data.matching_terms.length}) :`;
                keywordsContainer.appendChild(p);

                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'tags';
                tagsDiv.style.justifyContent = 'center';

                data.matching_terms.forEach(term => {
                    const span = document.createElement('span');
                    span.className = 'tag';
                    span.textContent = term;
                    span.style.borderColor = color;
                    span.style.background = `${color}15`; // Low opacity
                    tagsDiv.appendChild(span);
                });
                keywordsContainer.appendChild(tagsDiv);
            } else {
                keywordsContainer.innerHTML = '<small class="muted">Aucun mot-clé direct trouvé.</small>';
            }
        }

    } else {
        // Mode Validité (Legacy)
        if (label) label.textContent = "Confiance IA";
        score = Math.round(data.confidence * 100);

        if (keywordsContainer) keywordsContainer.hidden = true;

        if (data.is_valid_prediction) {
            if (score > 80) {
                color = '#22c55e';
                text = "✨ Excellent Profil !";
            } else if (score > 50) {
                color = '#f59e0b';
                text = "Bon début, continuez !";
            } else {
                text = "Profil à enrichir";
            }
        } else {
            if (score > 50) {
                text = "Profil incomplet";
            }
        }
    }

    scoreVal.textContent = `${score}%`;
    verdict.textContent = text;
    verdict.style.color = color;

    circle.style.background = `conic-gradient(${color} ${score}%, rgba(255, 255, 255, 0.1) 0%)`;
}
