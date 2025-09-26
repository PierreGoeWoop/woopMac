// Types pour l'application de tombola

export interface Participant {
  nom: string;
  macsPreselectionnes: Mac[]; // Les Macs qu'il a présélectionnés
}

export interface Mac {
  id: string;
  numeroSerie: string;
  modele: string;
  site: string;
  etat: string;
  prix: string;
  participants: string[]; // Liste des noms des participants
  estDisponible: boolean; // Si le Mac est encore disponible
}

export interface Gagnant {
  nom: string;
  macGagne: Mac;
  dateTimeTirage: Date;
  macsDisponibles: Mac[]; // Les Macs qu'il pouvait choisir
}

export interface CSVRowMac {
  "Colonne 1"?: string;
  "Numéro de série"?: string;
  Modèle?: string;
  Site?: string;
  Etat?: string;
  "Prix €"?: string;
  "Tirage au sort"?: string;
  [key: string]: any; // Pour gérer les colonnes supplémentaires
}
