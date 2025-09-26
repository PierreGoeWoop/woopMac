// État global de l'application
let state = {
    macs: [],
    participants: [],
    historique: [],
    participantTire: null,
    macsChoixParticipant: [],
    macDetailsAffiches: new Set(),
    nombreParticipantsAffiches: 10,
    nombreMacsAffiches: 12
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateUI();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Import de fichier
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    
    // Filtres d'affichage
    document.getElementById('nb-participants').addEventListener('change', function(e) {
        state.nombreParticipantsAffiches = e.target.value === 'all' ? Infinity : parseInt(e.target.value);
        updateParticipantsDisplay();
    });
    
    document.getElementById('nb-macs').addEventListener('change', function(e) {
        state.nombreMacsAffiches = e.target.value === 'all' ? Infinity : parseInt(e.target.value);
        updateMacsDisplay();
    });
}

// Déclencher la sélection de fichier
function triggerFileUpload() {
    document.getElementById('fileInput').click();
}

// Gestion de l'upload de fichier
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('fileNameText').textContent = file.name;
    document.getElementById('fileName').style.display = 'block';

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => value?.trim() || "",
        delimiter: ",",
        quoteChar: '"',
        complete: function(results) {
            try {
                console.log('🔍 Parsing results:', results);
                console.log('🔍 CSV Headers détectés:', results.meta?.fields);
                console.log('🔍 Nombre de lignes:', results.data.length);

                const csvData = results.data;
                const nouveauxMacs = [];

                csvData.forEach((row, index) => {
                    console.log(`🔍 Ligne ${index}:`, row);

                    const numeroSerie = row["Numéro de série"]?.toString().trim();
                    const modele = row["Modèle"]?.toString().trim();
                    const site = row["Site"]?.toString().trim() || "";
                    const etat = row["Etat"]?.toString().trim() || "";
                    const prix = row["Prix €"]?.toString().trim() || "0";
                    const participantsStr = row["Tirage au sort"]?.toString().trim() || "";

                    if (!numeroSerie || !modele || numeroSerie === "" || modele === "" || 
                        numeroSerie === "undefined" || modele === "undefined") {
                        console.log(`⚠️ Ligne ${index} ignorée - données manquantes`);
                        return;
                    }

                    const participants = parseParticipants(participantsStr);

                    nouveauxMacs.push({
                        id: `${numeroSerie}-${index}`,
                        numeroSerie,
                        modele,
                        site,
                        etat,
                        prix,
                        participants,
                        estDisponible: true
                    });
                });

                state.macs = nouveauxMacs;
                construireListeParticipants();
                updateUI();

                console.log(`✅ ${nouveauxMacs.length} Macs importés`);
                console.log(`✅ ${state.participants.length} participants uniques`);
            } catch (error) {
                console.error('Erreur lors du parsing du CSV:', error);
                alert('Erreur lors de la lecture du fichier CSV. Vérifiez le format.');
            }
        },
        error: function(error) {
            console.error('Erreur Papa Parse:', error);
            alert('Erreur lors de la lecture du fichier CSV.');
        }
    });
}

// Parser la liste des participants depuis le CSV
function parseParticipants(participantsStr) {
    if (!participantsStr || participantsStr.trim() === "") return [];

    // D'abord séparer par les sauts de ligne
    const lignes = participantsStr.split(/\n/);
    const participants = [];

    lignes.forEach(ligne => {
        // Pour chaque ligne, séparer par les tirets SEULEMENT s'ils sont précédés d'un espace ou en début de ligne
        // Cela évite de casser les noms comme "Pierre-Yves"
        const partiesLigne = ligne.split(/(?:^|\s)-\s*/);

        partiesLigne.forEach(partie => {
            const participant = partie.trim().replace(/^-\s*/, '').replace(/,$/, '');
            if (participant.length > 0 && !participant.match(/^[,\s]*$/)) {
                participants.push(participant);
            }
        });
    });

    // Si aucun saut de ligne détecté, essayer une approche différente
    if (participants.length === 0) {
        return participantsStr
            .split(/(?:^|\s)-\s*/)
            .map(p => p.trim().replace(/^-\s*/, ''))
            .filter(p => p.length > 0 && !p.match(/^[,\s]*$/))
            .map(p => p.replace(/,$/, ''));
    }

    return participants;
}

// Construire la liste des participants avec leurs Macs présélectionnés
function construireListeParticipants() {
    const participantsMap = new Map();

    state.macs.forEach(mac => {
        mac.participants.forEach(nomParticipant => {
            if (!participantsMap.has(nomParticipant)) {
                participantsMap.set(nomParticipant, []);
            }
            participantsMap.get(nomParticipant).push(mac);
        });
    });

    state.participants = Array.from(participantsMap.entries()).map(([nom, macsPreselectionnes]) => ({
        nom,
        macsPreselectionnes
    }));
}

// Obtenir les participants actifs (non éliminés et avec Macs disponibles)
function getParticipantsActifs() {
    const participantsElimines = state.historique.map(g => g.nom);
    return state.participants.filter(p => {
        if (participantsElimines.includes(p.nom)) return false;
        return p.macsPreselectionnes.some(mac => mac.estDisponible);
    });
}

// Obtenir les Macs disponibles
function getMacsDisponibles() {
    return state.macs.filter(mac => mac.estDisponible);
}

// Obtenir les participants actifs pour un Mac donné
function getParticipantsActifsPourMac(mac) {
    const participantsElimines = state.historique.map(g => g.nom);
    return mac.participants.filter(nom => !participantsElimines.includes(nom));
}

// Basculer l'affichage des détails d'un Mac
function toggleParticipantsMac(macId) {
    if (state.macDetailsAffiches.has(macId)) {
        state.macDetailsAffiches.delete(macId);
    } else {
        state.macDetailsAffiches.add(macId);
    }
    updateMacsDisplay();
}

// Tirer un participant au sort
function tirerGlobal() {
    const participantsActifs = getParticipantsActifs();
    if (participantsActifs.length === 0) return;

    const indexGagnant = Math.floor(Math.random() * participantsActifs.length);
    const participantGagnant = participantsActifs[indexGagnant];

    if (!participantGagnant) return;

    const macsDisponiblesPourLui = participantGagnant.macsPreselectionnes.filter(mac => mac.estDisponible);

    console.log(`🎯 Participant tiré: ${participantGagnant.nom}`);
    console.log(`💻 Macs disponibles pour lui:`, macsDisponiblesPourLui.map(m => m.modele));

    state.participantTire = participantGagnant;
    state.macsChoixParticipant = macsDisponiblesPourLui;

    updateUI();
}

// Choisir un Mac (appelé depuis les boutons de choix)
function choisirMac(macId) {
    const macChoisi = state.macsChoixParticipant.find(m => m.id === macId);
    if (!macChoisi || !state.participantTire) return;

    // Marquer le Mac comme indisponible
    const macIndex = state.macs.findIndex(m => m.id === macChoisi.id);
    if (macIndex !== -1) {
        state.macs[macIndex].estDisponible = false;
    }

    // Ajouter à l'historique
    const nouvelleEntree = {
        nom: state.participantTire.nom,
        macGagne: { ...macChoisi },
        dateTimeTirage: new Date(),
        macsDisponibles: [...state.macsChoixParticipant]
    };

    state.historique.push(nouvelleEntree);

    // Réinitialiser l'état du tirage
    state.participantTire = null;
    state.macsChoixParticipant = [];

    console.log(`✅ ${nouvelleEntree.nom} a choisi: ${macChoisi.modele} (${macChoisi.prix}€)`);

    updateUI();
}

// Continuer le tirage après un participant sans choix
function continuerTirage() {
    state.participantTire = null;
    state.macsChoixParticipant = [];
    updateUI();
}

// Formater une date
function formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date);
}

// Mise à jour complète de l'interface utilisateur
function updateUI() {
    updateImportSummary();
    updateParticipantsDisplay();
    updateMacsDisplay();
    updateTirageSection();
    updateChoixSection();
    updateHistoriqueSection();
    updateVisibilite();
}

// Mise à jour du résumé d'import
function updateImportSummary() {
    const importSummary = document.getElementById('importSummary');
    const importSummaryText = document.getElementById('importSummaryText');
    
    if (state.macs.length > 0) {
        importSummaryText.textContent = `✅ ${state.macs.length} Macs importés avec ${state.participants.length} participants uniques`;
        importSummary.style.display = 'block';
    } else {
        importSummary.style.display = 'none';
    }
}

// Mise à jour de l'affichage des participants
function updateParticipantsDisplay() {
    const participantsActifs = getParticipantsActifs();
    const participantsTitle = document.getElementById('participantsTitle');
    const participantsTableBody = document.getElementById('participantsTableBody');
    const moreParticipantsInfo = document.getElementById('moreParticipantsInfo');
    
    participantsTitle.textContent = `👥 Participants actifs (${participantsActifs.length})`;
    
    // Mettre à jour les options du select
    const selectParticipants = document.getElementById('nb-participants');
    const optionTous = selectParticipants.querySelector('option[value="all"]');
    optionTous.textContent = `Tous (${participantsActifs.length})`;
    
    // Afficher les participants
    const participantsAffiches = participantsActifs.slice(0, state.nombreParticipantsAffiches);
    participantsTableBody.innerHTML = '';
    
    participantsAffiches.forEach(participant => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${participant.nom}</strong></td>
            <td>
                <div class="macs-list">
                    ${participant.macsPreselectionnes.map(mac => 
                        `<span class="mac-badge ${!mac.estDisponible ? 'mac-indisponible' : ''}">${mac.modele} (${mac.prix}€)</span>`
                    ).join('')}
                    <div class="macs-count">
                        ${participant.macsPreselectionnes.length} Mac${participant.macsPreselectionnes.length > 1 ? 's' : ''} présélectionné${participant.macsPreselectionnes.length > 1 ? 's' : ''}
                    </div>
                </div>
            </td>
            <td>
                <strong>${participant.macsPreselectionnes.filter(m => m.estDisponible).length}</strong> 
                disponible${participant.macsPreselectionnes.filter(m => m.estDisponible).length > 1 ? 's' : ''}
            </td>
        `;
        participantsTableBody.appendChild(tr);
    });
    
    // Info sur les participants non affichés
    if (participantsActifs.length > state.nombreParticipantsAffiches) {
        moreParticipantsInfo.textContent = `... et ${participantsActifs.length - state.nombreParticipantsAffiches} autres participants`;
        moreParticipantsInfo.style.display = 'block';
    } else {
        moreParticipantsInfo.style.display = 'none';
    }
}

// Mise à jour de l'affichage des Macs
function updateMacsDisplay() {
    const macsDisponibles = getMacsDisponibles();
    const macsTitle = document.getElementById('macsTitle');
    const macsGrid = document.getElementById('macsGrid');
    const moreMacsInfo = document.getElementById('moreMacsInfo');
    
    macsTitle.textContent = `💻 Macs disponibles (${macsDisponibles.length})`;
    
    // Mettre à jour les options du select
    const selectMacs = document.getElementById('nb-macs');
    const optionTous = selectMacs.querySelector('option[value="all"]');
    optionTous.textContent = `Tous (${macsDisponibles.length})`;
    
    // Afficher les Macs
    const macsAffiches = macsDisponibles.slice(0, state.nombreMacsAffiches);
    macsGrid.innerHTML = '';
    
    macsAffiches.forEach(mac => {
        const macCard = document.createElement('div');
        macCard.className = 'mac-card';
        
        const participantsActifsPourMac = getParticipantsActifsPourMac(mac);
        const afficherDetails = state.macDetailsAffiches.has(mac.id);
        
        macCard.innerHTML = `
            <h4>${mac.modele}</h4>
            <p><strong>${mac.prix}€</strong> - ${mac.etat}</p>
            <p><small>${mac.numeroSerie}</small></p>
            <div class="participants-count-small">
                ${mac.participants.length} intéressé${mac.participants.length > 1 ? 's' : ''}
            </div>
            ${mac.participants.length > 0 ? `
                <button onclick="toggleParticipantsMac('${mac.id}')" class="btn btn-small btn-info">
                    ${afficherDetails ? 'Masquer' : 'Voir'} les intéressés
                </button>
            ` : ''}
            ${afficherDetails ? `
                <div class="participants-details">
                    <h5>Participants intéressés :</h5>
                    ${participantsActifsPourMac.length > 0 ? `
                        <ul class="participants-list">
                            ${participantsActifsPourMac.map(nom => `<li class="participant-item">${nom}</li>`).join('')}
                        </ul>
                    ` : '<p class="no-participants">Aucun participant actif pour ce Mac</p>'}
                </div>
            ` : ''}
        `;
        
        macsGrid.appendChild(macCard);
    });
    
    // Info sur les Macs non affichés
    if (macsDisponibles.length > state.nombreMacsAffiches) {
        moreMacsInfo.textContent = `... et ${macsDisponibles.length - state.nombreMacsAffiches} autres Macs disponibles`;
        moreMacsInfo.style.display = 'block';
    } else {
        moreMacsInfo.style.display = 'none';
    }
}

// Mise à jour de la section de tirage
function updateTirageSection() {
    const participantsActifs = getParticipantsActifs();
    const macsDisponibles = getMacsDisponibles();
    
    document.getElementById('participantsActifsCount').textContent = participantsActifs.length;
    document.getElementById('macsDisponiblesCount').textContent = macsDisponibles.length;
    
    const tirageButton = document.getElementById('tirageButton');
    tirageButton.disabled = participantsActifs.length === 0;
}

// Mise à jour de la section de choix
function updateChoixSection() {
    const participantTireNom = document.getElementById('participantTireNom');
    const choixMacs = document.getElementById('choixMacs');
    const noChoiceMessage = document.getElementById('noChoiceMessage');
    
    if (state.participantTire) {
        participantTireNom.textContent = `🏆 Participant tiré: ${state.participantTire.nom}`;
        
        if (state.macsChoixParticipant.length > 0) {
            choixMacs.innerHTML = state.macsChoixParticipant.map(mac => `
                <div class="mac-choix-card">
                    <h4>${mac.modele}</h4>
                    <p><strong>${mac.prix}€</strong></p>
                    <p>État: ${mac.etat}</p>
                    <p><small>Série: ${mac.numeroSerie}</small></p>
                    <button onclick="choisirMac('${mac.id}')" class="btn btn-primary">
                        ✅ Je choisis ce Mac
                    </button>
                </div>
            `).join('');
        } else {
            noChoiceMessage.textContent = `${state.participantTire.nom}, tous vos Macs présélectionnés ont déjà été pris.`;
        }
    }
}

// Mise à jour de la section historique
function updateHistoriqueSection() {
    const historiqueTitle = document.getElementById('historiqueTitle');
    const historiqueTableBody = document.getElementById('historiqueTableBody');
    
    historiqueTitle.textContent = `📜 Historique des gagnants (${state.historique.length})`;
    
    historiqueTableBody.innerHTML = state.historique.map(gagnant => `
        <tr>
            <td><strong>${gagnant.nom}</strong></td>
            <td>
                <strong>${gagnant.macGagne.modele}</strong><br>
                <small>${gagnant.macGagne.numeroSerie}</small><br>
                <small>État: ${gagnant.macGagne.etat}</small>
            </td>
            <td><strong>${gagnant.macGagne.prix}€</strong></td>
            <td>${formatDate(gagnant.dateTimeTirage)}</td>
        </tr>
    `).join('');
    
    // Mise à jour du dernier gagnant
    if (state.historique.length > 0) {
        const dernierGagnant = state.historique[state.historique.length - 1];
        const dernierGagnantCard = document.getElementById('dernierGagnantCard');
        dernierGagnantCard.innerHTML = `
            <p><strong>${dernierGagnant.nom}</strong></p>
            <p class="mac-gagne">Mac choisi: <strong>${dernierGagnant.macGagne.modele}</strong> (${dernierGagnant.macGagne.prix}€)</p>
            <p class="mac-details">État: ${dernierGagnant.macGagne.etat} | Série: ${dernierGagnant.macGagne.numeroSerie}</p>
            <p class="choix-info">Avait ${dernierGagnant.macsDisponibles.length} Mac${dernierGagnant.macsDisponibles.length > 1 ? 's' : ''} disponible${dernierGagnant.macsDisponibles.length > 1 ? 's' : ''} au moment du tirage</p>
        `;
    }
}

// Mise à jour de la visibilité des sections
function updateVisibilite() {
    const participantsActifs = getParticipantsActifs();
    const macsDisponibles = getMacsDisponibles();
    
    // Sections principales
    document.getElementById('participantsSection').style.display = participantsActifs.length > 0 ? 'block' : 'none';
    document.getElementById('macsSection').style.display = macsDisponibles.length > 0 ? 'block' : 'none';
    document.getElementById('tirageSection').style.display = participantsActifs.length > 0 && !state.participantTire ? 'block' : 'none';
    
    // Sections de choix
    document.getElementById('choixSection').style.display = state.participantTire && state.macsChoixParticipant.length > 0 ? 'block' : 'none';
    document.getElementById('noChoiceSection').style.display = state.participantTire && state.macsChoixParticipant.length === 0 ? 'block' : 'none';
    
    // Sections de résultats
    document.getElementById('dernierGagnantSection').style.display = state.historique.length > 0 ? 'block' : 'none';
    document.getElementById('historiqueSection').style.display = state.historique.length > 0 ? 'block' : 'none';
    
    // États vides et finis
    document.getElementById('emptyState').style.display = state.macs.length === 0 ? 'block' : 'none';
    document.getElementById('finishedState').style.display = state.macs.length > 0 && macsDisponibles.length === 0 ? 'block' : 'none';
}