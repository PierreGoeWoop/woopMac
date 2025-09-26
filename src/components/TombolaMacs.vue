<template>
  <div class="tombola-app">
    <header class="header">
      <h1>🎰 Tombola Revente Macs</h1>
      <p>Application de tirage au sort pour les Macs</p>
    </header>

    <main class="main-content">
      <!-- Section Import CSV -->
      <section class="import-section">
        <h2>📁 Import des Macs et participants</h2>
        <div class="file-upload">
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            @change="handleFileUpload"
            class="file-input"
          />
          <button @click="triggerFileUpload" class="btn btn-primary">
            Importer le fichier CSV
          </button>
        </div>
        <p class="file-info" v-if="fileName">
          Fichier sélectionné: <strong>{{ fileName }}</strong>
        </p>
        <div v-if="macs.length > 0" class="import-summary">
          <p>
            ✅ {{ macs.length }} Macs importés avec
            {{ totalParticipants }} participants uniques
          </p>
        </div>
      </section>

      <!-- Section Participants actifs -->
      <section
        class="participants-section"
        v-if="participantsActifs.length > 0"
      >
        <div class="section-header">
          <h2>👥 Participants actifs ({{ participantsActifs.length }})</h2>
          <div class="filter-controls">
            <label for="nb-participants">Afficher :</label>
            <select
              id="nb-participants"
              v-model="nombreParticipantsAffiches"
              class="filter-select"
            >
              <option value="5">5 participants</option>
              <option value="10">10 participants</option>
              <option value="20">20 participants</option>
              <option value="50">50 participants</option>
              <option :value="participantsActifs.length">
                Tous ({{ participantsActifs.length }})
              </option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="participants-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Macs présélectionnés</th>
                <th>Macs encore disponibles</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="participant in participantsAffiches"
                :key="participant.nom"
              >
                <td>
                  <strong>{{ participant.nom }}</strong>
                </td>
                <td>
                  <div class="macs-list">
                    <span
                      v-for="mac in participant.macsPreselectionnes"
                      :key="mac.id"
                      class="mac-badge"
                      :class="{ 'mac-indisponible': !mac.estDisponible }"
                    >
                      {{ mac.modele }} ({{ mac.prix }}€)
                    </span>
                    <div class="macs-count">
                      {{ participant.macsPreselectionnes.length }} Mac{{
                        participant.macsPreselectionnes.length > 1 ? "s" : ""
                      }}
                      présélectionné{{
                        participant.macsPreselectionnes.length > 1 ? "s" : ""
                      }}
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{{
                    participant.macsPreselectionnes.filter(
                      (m) => m.estDisponible
                    ).length
                  }}</strong>
                  disponible{{
                    participant.macsPreselectionnes.filter(
                      (m) => m.estDisponible
                    ).length > 1
                      ? "s"
                      : ""
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Afficher info si plus de participants que ceux affichés -->
        <div
          v-if="participantsActifs.length > nombreParticipantsAffiches"
          class="more-info"
        >
          ... et
          {{ participantsActifs.length - nombreParticipantsAffiches }} autres
          participants
        </div>
      </section>

      <!-- Section Macs disponibles (vue d'ensemble) -->
      <section class="macs-overview-section" v-if="macsDisponibles.length > 0">
        <div class="section-header">
          <h2>💻 Macs disponibles ({{ macsDisponibles.length }})</h2>
          <div class="filter-controls">
            <label for="nb-macs">Afficher :</label>
            <select
              id="nb-macs"
              v-model="nombreMacsAffiches"
              class="filter-select"
            >
              <option value="6">6 Macs</option>
              <option value="12">12 Macs</option>
              <option value="24">24 Macs</option>
              <option value="50">50 Macs</option>
              <option :value="macsDisponibles.length">
                Tous ({{ macsDisponibles.length }})
              </option>
            </select>
          </div>
        </div>

        <div class="macs-grid">
          <div v-for="mac in macsAffiches" :key="mac.id" class="mac-card">
            <h4>{{ mac.modele }}</h4>
            <p>
              <strong>{{ mac.prix }}€</strong> - {{ mac.etat }}
            </p>
            <p>
              <small>{{ mac.numeroSerie }}</small>
            </p>
            <div class="participants-count-small">
              {{ mac.participants.length }} intéressé{{
                mac.participants.length > 1 ? "s" : ""
              }}
            </div>
            <button
              v-if="mac.participants.length > 0"
              @click="toggleParticipantsMac(mac.id)"
              class="btn btn-small btn-info"
            >
              {{ macDetailsAffiches.has(mac.id) ? "Masquer" : "Voir" }} les
              intéressés
            </button>

            <!-- Liste des participants intéressés -->
            <div
              v-if="macDetailsAffiches.has(mac.id)"
              class="participants-details"
            >
              <h5>Participants intéressés :</h5>
              <ul class="participants-list">
                <li
                  v-for="participant in getParticipantsActifsPourMac(mac)"
                  :key="participant"
                  class="participant-item"
                >
                  {{ participant }}
                </li>
              </ul>
              <p
                v-if="getParticipantsActifsPourMac(mac).length === 0"
                class="no-participants"
              >
                Aucun participant actif pour ce Mac
              </p>
            </div>
          </div>
        </div>

        <!-- Afficher info si plus de Macs que ceux affichés -->
        <div
          v-if="macsDisponibles.length > nombreMacsAffiches"
          class="more-info"
        >
          ... et {{ macsDisponibles.length - nombreMacsAffiches }} autres Macs
          disponibles
        </div>
      </section>

      <!-- Section Tirage Global -->
      <section
        class="tirage-section"
        v-if="participantsActifs.length > 0 && !participantTire"
      >
        <h2>🎲 Tirage au sort des participants</h2>
        <p>Tire au hasard un participant parmi tous ceux encore actifs</p>
        <div class="tirage-stats">
          <p>
            <strong>{{ participantsActifs.length }}</strong> participants actifs
          </p>
          <p>
            <strong>{{ macsDisponibles.length }}</strong> Macs encore
            disponibles
          </p>
        </div>
        <button
          @click="tirerGlobal"
          class="btn btn-success btn-large"
          :disabled="participantsActifs.length === 0"
        >
          🎯 Tirer un participant au sort
        </button>
      </section>

      <!-- Section Choix du Mac par le participant tiré -->
      <section
        class="choix-section"
        v-if="participantTire && macsChoixParticipant.length > 0"
      >
        <h2>🏆 Participant tiré: {{ participantTire.nom }}</h2>
        <p>Choisissez un Mac parmi ceux que vous aviez présélectionnés :</p>
        <div class="choix-macs">
          <div
            v-for="mac in macsChoixParticipant"
            :key="mac.id"
            class="mac-choix-card"
          >
            <h4>{{ mac.modele }}</h4>
            <p>
              <strong>{{ mac.prix }}€</strong>
            </p>
            <p>État: {{ mac.etat }}</p>
            <p>
              <small>Série: {{ mac.numeroSerie }}</small>
            </p>
            <button
              @click="choisirMac(participantTire, mac)"
              class="btn btn-primary"
            >
              ✅ Je choisis ce Mac
            </button>
          </div>
        </div>
      </section>

      <!-- Message si participant tiré n'a plus de Mac disponible -->
      <section
        class="no-choice-section"
        v-if="participantTire && macsChoixParticipant.length === 0"
      >
        <h2>😞 Aucun Mac disponible</h2>
        <p>
          {{ participantTire.nom }}, tous vos Macs présélectionnés ont déjà été
          pris.
        </p>
        <p>Vous êtes éliminé de la tombola.</p>
        <button @click="participantTire = null" class="btn btn-secondary">
          Continuer le tirage
        </button>
      </section>

      <!-- Résultat du dernier gagnant -->
      <section v-if="dernierGagnant" class="dernier-gagnant-section">
        <h3>🏆 Dernier gagnant</h3>
        <div class="gagnant-card">
          <p>
            <strong>{{ dernierGagnant.nom }}</strong>
          </p>
          <p class="mac-gagne">
            Mac choisi:
            <strong>{{ dernierGagnant.macGagne.modele }}</strong> ({{
              dernierGagnant.macGagne.prix
            }}€)
          </p>
          <p class="mac-details">
            État: {{ dernierGagnant.macGagne.etat }} | Série:
            {{ dernierGagnant.macGagne.numeroSerie }}
          </p>
          <p class="choix-info">
            Avait {{ dernierGagnant.macsDisponibles.length }} Mac{{
              dernierGagnant.macsDisponibles.length > 1 ? "s" : ""
            }}
            disponible{{
              dernierGagnant.macsDisponibles.length > 1 ? "s" : ""
            }}
            au moment du tirage
          </p>
        </div>
      </section>

      <!-- Section Historique -->
      <section class="historique-section" v-if="historique.length > 0">
        <h2>📜 Historique des gagnants ({{ historique.length }})</h2>
        <div class="table-container">
          <table class="historique-table">
            <thead>
              <tr>
                <th>Gagnant</th>
                <th>Mac gagné</th>
                <th>Prix</th>
                <th>Date/Heure</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="gagnant in historique"
                :key="`${gagnant.nom}-${gagnant.dateTimeTirage}`"
              >
                <td>
                  <strong>{{ gagnant.nom }}</strong>
                </td>
                <td>
                  <strong>{{ gagnant.macGagne.modele }}</strong
                  ><br />
                  <small>{{ gagnant.macGagne.numeroSerie }}</small
                  ><br />
                  <small>État: {{ gagnant.macGagne.etat }}</small>
                </td>
                <td>
                  <strong>{{ gagnant.macGagne.prix }}€</strong>
                </td>
                <td>{{ formatDate(gagnant.dateTimeTirage) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Message si aucun Mac -->
      <section v-if="macs.length === 0 && !fileName" class="empty-state">
        <p>📥 Importez le fichier CSV des Macs pour commencer</p>
        <p class="format-info">
          Le fichier doit contenir les colonnes: Modèle, Numéro de série, État,
          Prix €, Tirage au sort
        </p>
      </section>

      <!-- Message si tous les Macs ont été tirés -->
      <section
        v-if="macs.length > 0 && macsDisponibles.length === 0"
        class="finished-state"
      >
        <h2>🎉 Tous les Macs ont été attribués !</h2>
        <p>Consultez l'historique pour voir tous les gagnants.</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import Papa from "papaparse";
import type { Mac, Gagnant, Participant, CSVRowMac } from "../types/tombola";

// État réactif
const macs = ref<Mac[]>([]);
const participants = ref<Participant[]>([]);
const historique = ref<Gagnant[]>([]);
const fileInput = ref<HTMLInputElement>();
const fileName = ref<string>("");
const participantTire = ref<Participant | null>(null);
const macsChoixParticipant = ref<Mac[]>([]);

// Filtres d'affichage
const nombreParticipantsAffiches = ref<number>(10);
const nombreMacsAffiches = ref<number>(12);

// Affichage des détails des Macs
const macDetailsAffiches = ref<Set<string>>(new Set());

// Computed properties
const macsDisponibles = computed(() => {
  return macs.value.filter((mac) => mac.estDisponible);
});

const participantsActifs = computed(() => {
  const participantsElimines = historique.value.map((g) => g.nom);
  return participants.value.filter((p) => {
    // Éliminer les participants qui ont déjà gagné
    if (participantsElimines.includes(p.nom)) return false;

    // Ne garder que les participants qui ont au moins un Mac encore disponible
    return p.macsPreselectionnes.some((mac) => mac.estDisponible);
  });
});

const dernierGagnant = computed(() => {
  return historique.value.length > 0
    ? historique.value[historique.value.length - 1]
    : null;
});

const totalParticipants = computed(() => {
  return participants.value.length;
});

// Listes filtrées pour l'affichage
const participantsAffiches = computed(() => {
  return participantsActifs.value.slice(0, nombreParticipantsAffiches.value);
});

const macsAffiches = computed(() => {
  return macsDisponibles.value.slice(0, nombreMacsAffiches.value);
});

// Fonctions
const triggerFileUpload = () => {
  fileInput.value?.click();
};

const toggleParticipantsMac = (macId: string) => {
  if (macDetailsAffiches.value.has(macId)) {
    macDetailsAffiches.value.delete(macId);
  } else {
    macDetailsAffiches.value.add(macId);
  }
};

const getParticipantsActifsPourMac = (mac: Mac): string[] => {
  const participantsElimines = historique.value.map((g) => g.nom);
  return mac.participants.filter((nom) => !participantsElimines.includes(nom));
};

const construireListeParticipants = () => {
  const participantsMap = new Map<string, Mac[]>();

  // Pour chaque Mac, ajouter ses participants à la map
  macs.value.forEach((mac) => {
    mac.participants.forEach((nomParticipant) => {
      if (!participantsMap.has(nomParticipant)) {
        participantsMap.set(nomParticipant, []);
      }
      participantsMap.get(nomParticipant)!.push(mac);
    });
  });

  // Convertir la map en array de participants
  participants.value = Array.from(participantsMap.entries()).map(
    ([nom, macsPreselectionnes]) => ({
      nom,
      macsPreselectionnes,
    })
  );
};

const parseParticipants = (participantsStr: string): string[] => {
  if (!participantsStr || participantsStr.trim() === "") return [];

  // D'abord séparer par les sauts de ligne
  const lignes = participantsStr.split(/\n/);
  const participants: string[] = [];

  lignes.forEach((ligne) => {
    // Pour chaque ligne, séparer par les tirets SEULEMENT s'ils sont précédés d'un espace ou en début de ligne
    // Cela évite de casser les noms comme "Pierre-Yves"
    const partiesLigne = ligne.split(/(?:^|\s)-\s*/);

    partiesLigne.forEach((partie) => {
      const participant = partie.trim().replace(/^-\s*/, "").replace(/,$/, "");
      if (participant.length > 0 && !participant.match(/^[,\s]*$/)) {
        participants.push(participant);
      }
    });
  });

  // Si aucun saut de ligne détecté, essayer une approche différente
  if (participants.length === 0) {
    // Séparer par tiret uniquement si précédé d'un espace ou d'un début de ligne
    return participantsStr
      .split(/(?:^|\s)-\s*/)
      .map((p) => p.trim().replace(/^-\s*/, ""))
      .filter((p) => p.length > 0 && !p.match(/^[,\s]*$/))
      .map((p) => p.replace(/,$/, ""));
  }

  return participants;
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  fileName.value = file.name;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value?.trim() || "",
    delimiter: ",",
    quoteChar: '"',
    complete: (results) => {
      try {
        console.log("🔍 Parsing results:", results);
        console.log("🔍 CSV Headers détectés:", results.meta?.fields);
        console.log("🔍 Nombre de lignes:", results.data.length);

        const csvData = results.data as CSVRowMac[];
        const nouveauxMacs: Mac[] = [];

        csvData.forEach((row, index) => {
          console.log(`🔍 Ligne ${index}:`, row);

          const numeroSerie = row["Numéro de série"]?.toString().trim();
          const modele = row["Modèle"]?.toString().trim();
          const site = row["Site"]?.toString().trim() || "";
          const etat = row["Etat"]?.toString().trim() || "";
          const prix = row["Prix €"]?.toString().trim() || "0";
          const participantsStr =
            row["Tirage au sort"]?.toString().trim() || "";

          if (
            !numeroSerie ||
            !modele ||
            numeroSerie === "" ||
            modele === "" ||
            numeroSerie === "undefined" ||
            modele === "undefined"
          ) {
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
            estDisponible: true,
          });
        });

        macs.value = nouveauxMacs;

        // Construire la liste des participants avec leurs Macs présélectionnés
        construireListeParticipants();

        console.log(`✅ ${nouveauxMacs.length} Macs importés`);
        console.log(`✅ ${participants.value.length} participants uniques`);
      } catch (error) {
        console.error("Erreur lors du parsing du CSV:", error);
        alert("Erreur lors de la lecture du fichier CSV. Vérifiez le format.");
      }
    },
    error: (error) => {
      console.error("Erreur Papa Parse:", error);
      alert("Erreur lors de la lecture du fichier CSV.");
    },
  });
};

const tirerParticipant = () => {
  if (participantsActifs.value.length === 0) return null;

  const indexGagnant = Math.floor(
    Math.random() * participantsActifs.value.length
  );
  const participantGagnant = participantsActifs.value[indexGagnant];

  if (!participantGagnant) return null;

  const macsDisponiblesPourLui = participantGagnant.macsPreselectionnes.filter(
    (mac) => mac.estDisponible
  );

  console.log(`🎯 Participant tiré: ${participantGagnant.nom}`);
  console.log(
    `💻 Macs disponibles pour lui:`,
    macsDisponiblesPourLui.map((m) => m.modele)
  );

  participantTire.value = participantGagnant;
  macsChoixParticipant.value = macsDisponiblesPourLui;

  return participantGagnant;
};

const choisirMac = (participant: Participant, macChoisi: Mac) => {
  const macIndex = macs.value.findIndex((m) => m.id === macChoisi.id);
  if (macIndex !== -1 && macs.value[macIndex]) {
    macs.value[macIndex].estDisponible = false;
  }

  const nouvelleEntree: Gagnant = {
    nom: participant.nom,
    macGagne: { ...macChoisi },
    dateTimeTirage: new Date(),
    macsDisponibles: [...macsChoixParticipant.value],
  };

  historique.value.push(nouvelleEntree);

  participantTire.value = null;
  macsChoixParticipant.value = [];

  console.log(
    `✅ ${participant.nom} a choisi: ${macChoisi.modele} (${macChoisi.prix}€)`
  );
};

const tirerGlobal = () => {
  tirerParticipant();
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};
</script>

<style scoped>
.tombola-app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
}

.header p {
  margin: 10px 0 0 0;
  opacity: 0.9;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
}

section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.4rem;
}

/* Section headers avec filtres */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-controls label {
  font-weight: 500;
  color: #555;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* Info "plus d'éléments" */
.more-info {
  text-align: center;
  color: #666;
  font-style: italic;
  margin-top: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

/* Import Section */
.file-upload {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.file-input {
  display: none;
}

.file-info {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.import-summary {
  background: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 6px;
  margin-top: 15px;
}

/* Boutons */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  text-align: center;
  display: inline-block;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.9rem;
}

.btn-large {
  padding: 16px 32px;
  font-size: 1.1rem;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

/* Tableaux */
.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: top;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

tbody tr:hover {
  background-color: #f8f9fa;
}

/* Participants et Macs */
.macs-list {
  max-width: 400px;
}

.mac-badge {
  display: inline-block;
  background: #e8f5e8;
  color: #2d5a2d;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin: 2px;
  border: 1px solid #c3e6c3;
}

.mac-badge.mac-indisponible {
  background: #ffebee;
  color: #c62828;
  border-color: #ffcdd2;
  text-decoration: line-through;
  opacity: 0.7;
}

.macs-count {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

/* Grille des Macs */
.macs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.mac-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.mac-card h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1rem;
}

.mac-card p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.participants-count-small {
  font-size: 0.8rem;
  color: #666;
  margin-top: 8px;
}

/* Détails des participants par Mac */
.btn-info {
  background: #17a2b8;
  color: white;
}

.participants-details {
  margin-top: 15px;
  padding: 15px;
  background: #f1f3f4;
  border-radius: 6px;
  border-left: 4px solid #17a2b8;
}

.participants-details h5 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
}

.participants-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.participant-item {
  padding: 6px 10px;
  margin: 3px 0;
  background: #e8f5e8;
  border-radius: 4px;
  border-left: 3px solid #27ae60;
  font-size: 0.85rem;
  color: #2d5a2d;
}

.no-participants {
  color: #666;
  font-style: italic;
  margin: 10px 0 0 0;
  font-size: 0.85rem;
}

/* Section tirage */
.tirage-section {
  text-align: center;
}

.tirage-stats {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  display: flex;
  justify-content: space-around;
  gap: 20px;
}

.tirage-stats p {
  margin: 0;
  font-size: 1.1rem;
}

/* Section choix */
.choix-section {
  background: #fff3cd;
  border-color: #ffeaa7;
}

.choix-section h2 {
  color: #856404;
}

.choix-macs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.mac-choix-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #ffc107;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.mac-choix-card h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.mac-choix-card p {
  margin: 5px 0;
}

.mac-choix-card button {
  margin-top: 15px;
  width: 100%;
}

/* Section aucun choix */
.no-choice-section {
  background: #f8d7da;
  border-color: #f5c6cb;
  text-align: center;
}

.no-choice-section h2 {
  color: #721c24;
}

/* Section dernier gagnant */
.dernier-gagnant-section {
  background: #d4edda;
  border-color: #c3e6cb;
}

.dernier-gagnant-section h3 {
  margin-top: 0;
  color: #155724;
}

.gagnant-card {
  text-align: left;
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.gagnant-card p {
  margin: 8px 0;
}

.mac-gagne {
  color: #27ae60;
  font-size: 1.1rem;
}

.mac-details {
  color: #666;
  font-size: 0.9rem;
}

.choix-info {
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
}

/* États vides */
.empty-state,
.finished-state {
  text-align: center;
  color: #666;
  padding: 40px;
}

.format-info {
  font-size: 0.9rem;
  color: #888;
  margin-top: 10px;
}

.finished-state {
  background: #d4edda;
  color: #155724;
}

.finished-state h2 {
  color: #155724;
}

/* Responsive */
@media (max-width: 768px) {
  .tombola-app {
    padding: 15px;
  }

  .header h1 {
    font-size: 2rem;
  }

  section {
    padding: 20px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-controls {
    justify-content: center;
  }

  .file-upload {
    flex-direction: column;
    align-items: stretch;
  }

  table {
    font-size: 0.9rem;
  }

  th,
  td {
    padding: 8px;
  }

  .macs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
