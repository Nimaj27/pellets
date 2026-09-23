# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.3.2] - 2026-09-23

### Corrigé
- Le graphique « € Dépenses » des Statistiques (évolution mensuelle de la
  saison) ne comptait que les achats — le coût des entretiens s'y ajoute
  désormais.

## [2.3.1] - 2026-09-23

### Ajouté
- **Sacs consommés (période)** : nouvelle carte sur le Dashboard, juste à
  côté du prix moyen du sac.

### Changé
- **Dépenses (période)** intègre désormais la valeur estimée des sacs
  brûlés sur la période (au prix moyen du sac), en plus des achats et des
  entretiens — pour répondre à « j'ai brûlé 10 sacs, ça m'a coûté
  combien ? » même sans achat sur la période en cours.

## [2.3.0] - 2026-09-22

### Ajouté
- **Modifier une saisie** : cliquer sur une ligne dans l'Historique ou les
  Entretiens rouvre la fenêtre d'ajout pré-remplie, en mode édition
  (le type de saisie n'est alors plus modifiable).

### Corrigé
- Les entrées d'entretien avaient un conflit entre leur classification
  interne (« entretien ») et leur sous-type (Annuel/Régulier/Vitre/
  Annexes), tous deux stockés sous le même nom de champ : le second
  écrasait systématiquement le premier. Cela cassait silencieusement le
  filtre « Entretien » de l'Historique, le bouton de suppression sur ces
  lignes, et la bordure colorée des lignes de brûlage. Tout est corrigé.
- Le formulaire d'achat pouvait rester bloqué (impossible de valider)
  lors de la modification d'une saisie d'un autre type, à cause de
  champs requis restés actifs bien que masqués.

## [2.2.1] - 2026-09-22

### Ajouté
- **Prix moyen du sac** sur le Dashboard : coût moyen basé sur l'historique
  des achats de la période sélectionnée.
- **Coût estimé affiché sur chaque brûlage** dans l'Historique (au prix
  moyen du sac), pour savoir combien coûte chaque sac utilisé.

### Corrigé
- Le prix (achat) est désormais un champ obligatoire, pour éviter de
  saisir un achat à 0 € par oubli (ce qui fausse le prix moyen calculé).

## [2.2.0] - 2026-09-22

### Ajouté
- **Application installable (PWA)** : une fois déployée en HTTPS
  (`pellets-conso.web.app`), le navigateur mobile propose « Installer
  l'application » / « Ajouter à l'écran d'accueil ». L'appli s'ouvre alors
  comme une appli native (icône, plein écran, sans barre d'adresse).
- **Icône** dédiée (192×192, 512×512, apple-touch-icon).
- **Fonctionnement hors-ligne** basique via un service worker (cache de
  la page et de ses ressources).

## [2.1.1] - 2026-09-22

### Corrigé
- Page blanche/sans style quand `index.html` est ouvert directement depuis
  un gestionnaire de fichiers Android (URI `content://`) : les fichiers
  liés en chemin relatif (`css/style.css`, `js/app.js`) ne se chargeaient
  pas dans ce contexte. L'application est désormais un **fichier HTML
  unique et autonome** (CSS et JS intégrés) : elle fonctionne quelle que
  soit la façon dont elle est ouverte (double-clic, gestionnaire de
  fichiers, serveur local, Firebase Hosting).

## [2.1.0] - 2026-09-22

### Ajouté
- **Stock initial** configurable dans les Paramètres (report du stock restant
  d'une saison précédente à l'initialisation).
- **Stock restant** affiché aussi en nombre de sacs, en plus des kg.
- **Coût des entretiens** (ramonage, etc.) : un champ optionnel permet de le
  renseigner, et il s'additionne désormais aux achats dans les « Dépenses ».
- **Saison de chauffe configurable** : le mois de début (par défaut
  septembre) se règle dans les Paramètres, pour s'adapter à chacun.
- **Changelog consultable dans l'application** (bouton dans Paramètres).

### Modifié
- Ajout rapide d'un brûlage : le formulaire pré-remplit désormais 1 sac par
  défaut, pour valider en un geste après avoir rechargé le poêle.

### Corrigé
- Le lien « Changelog » dans les Paramètres ne fonctionnait pas (le fichier
  `CHANGELOG.md` n'était pas servi par l'application) — remplacé par une
  fenêtre affichant le contenu directement.

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
