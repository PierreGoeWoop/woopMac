# 🎰 Tombola Revente Macs

Application Vue.js pour gérer un tirage au sort de Macs avec système de présélection des participants.

## ✨ Fonctionnalités

- 📁 **Import CSV** : Importation des Macs et participants depuis un fichier CSV
- 👥 **Gestion des participants** : Affichage des participants actifs avec leurs Macs présélectionnés
- 💻 **Affichage des Macs** : Vue d'ensemble des Macs disponibles avec détails des intéressés
- 🎲 **Tirage au sort** : Système de tirage équitable entre tous les participants actifs
- 🏆 **Choix du gagnant** : Le participant tiré choisit parmi ses Macs présélectionnés encore disponibles
- 📜 **Historique** : Suivi complet de tous les gagnants et leurs choix
- 🔍 **Filtres d'affichage** : Limitation du nombre d'éléments affichés pour une meilleure lisibilité

## 🚀 Développement

### Prérequis
- Node.js 22.12+ (actuellement testé avec 22.5.1 mais avec warnings)
- npm

### Installation
```bash
npm install
```

### Démarrage en mode développement
```bash
npm run dev
```

### Build de production
```bash
npm run build
```

## 📦 Déploiement sur GitHub Pages

### Configuration automatique

1. **Poussez votre code sur GitHub** dans une repository nommée `mac-woop` (ou modifiez la valeur `base` dans `vite.config.ts`)

2. **Activez GitHub Pages** dans les paramètres de votre repository :
   - Allez dans Settings > Pages
   - Source : "Deploy from a branch"
   - Branch : `gh-pages`

3. **Le déploiement se fait automatiquement** à chaque push sur la branche `main` grâce au workflow GitHub Actions

### Déploiement manuel
```bash
npm run deploy
```

### URL d'accès
Une fois déployé, l'application sera accessible à :
`https://[votre-username].github.io/mac-woop/`

## 📋 Format du fichier CSV

Le fichier CSV doit contenir les colonnes suivantes :
- **Modèle** : Nom du modèle de Mac
- **Numéro de série** : Identifiant unique du Mac
- **État** : État du Mac (Bon, Moyen, etc.)
- **Prix €** : Prix du Mac
- **Tirage au sort** : Liste des participants intéressés (séparés par des tirets)

## 🛠️ Technologies utilisées

- **Vue 3** avec Composition API
- **TypeScript** pour la sécurité des types
- **Vite** comme bundler
- **Papa Parse** pour l'analyse des fichiers CSV
- **GitHub Pages** pour l'hébergement
- **GitHub Actions** pour le déploiement automatique
