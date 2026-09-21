# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.0.0] - 2026-09-21

### Changé (refonte complète, inspirée de l'appli Granulo)
- **Nouveau thème visuel sombre** avec halos flous en fond, cartes arrondies,
  façon appli mobile.
- **Navigation repensée** : barre de navigation fixe en bas d'écran avec
  4 sections (Dashboard, Historique, Statistiques, Entretiens) et un bouton
  flottant « + » pour ajouter une entrée (brûlage, achat ou entretien) via
  une fenêtre modale unique.
- **Historique unifié** : achats, brûlages et entretiens dans une seule liste
  filtrable (Tous / Achat / Brûlage / Entretien), groupée par mois et
  repliable, avec un sous-filtre par type d'entretien.
- **Nouvel onglet Entretiens** : suivi des opérations de maintenance
  (Annuel, Régulier, Vitre, Annexes).
- **Calcul par saison de chauffe** (septembre → août) au lieu de l'année
  civile, sur le Dashboard et les Statistiques.
- **Statistiques enrichies** : graphique mensuel de la saison (sacs brûlés ou
  dépenses, au choix) et comparaison entre saisons (sacs brûlés vs sacs
  achetés).
- **Dashboard** : dépenses de la période, rythme de consommation sur 7 jours,
  graphique des 7 derniers jours, stock restant, autonomie estimée et alerte
  stock bas — tout est conservé de la v1.1.
- Paramètres et sauvegarde (export/import/réinitialisation) déplacés dans
  une fenêtre accessible via l'icône ⚙️ du Dashboard.
- Toujours 100 % local (localStorage) ; les données existantes sont migrées
  automatiquement, aucune perte.

## [1.1.0] - 2026-09-20

### Ajouté
- **Autonomie estimée** sur le tableau de bord : nombre de jours de stock restant,
  calculé à partir du rythme de consommation des 30 derniers jours.
- **Alerte stock bas** : bandeau et mise en évidence de la carte « Stock restant »
  quand le stock passe sous un seuil configurable (Paramètres).
- **Achats par palette** : possibilité de saisir un achat en nombre de palettes
  (en plus des sacs à l'unité), avec un réglage « Sacs par palette » dans les
  Paramètres. Le prix peut être renseigné par sac ou par palette selon l'unité choisie.
- Migration automatique des achats existants vers le nouveau format (rétrocompatible).

## [1.0.1] - 2026-09-20

### Corrigé
- Champ « Quantité » de la consommation : suppression des flèches d'incrémentation
  du champ numérique (qui avançaient de 0,1 en 0,1 et rendaient la saisie pénible).
  La saisie se fait désormais librement au clavier, sans pas imposé.

## [1.0.0] - 2026-09-20

### Ajouté
- Première version de l'application Pellets Conso.
- Suivi des achats de pellets (sacs, poids par sac, prix par sac, note).
- Suivi de la consommation (en kg ou en sacs, avec note).
- Tableau de bord avec sélecteur d'année :
  - Total consommé sur la période
  - Coût total des achats sur la période
  - Prix moyen au kg
  - Valeur estimée du consommé
  - Stock restant estimé (tout historique confondu)
- Graphique de consommation mensuelle pour l'année sélectionnée.
- Graphique de comparaison pluriannuelle (consommation vs coût des achats).
- Paramètres : poids par sac par défaut, symbole monétaire.
- Export / import des données en JSON (sauvegarde locale).
- Réinitialisation des données.
- Stockage 100% local (localStorage), aucune donnée envoyée à un serveur.
- Configuration Firebase Hosting pour un déploiement sur `pellets-conso.web.app`.
