# Pellets Conso

Application de suivi de la consommation et du coût des pellets (granulés de bois), sur une base annuelle et pluriannuelle.

Application 100% statique, un **fichier HTML unique et autonome** (CSS et JS intégrés, sans backend). Toutes les données sont stockées localement dans le navigateur (`localStorage`). Fonctionne aussi bien hébergée que copiée/dézippée et ouverte directement (double-clic), y compris depuis un gestionnaire de fichiers mobile.

URL cible une fois déployée : **https://pellets-conso.web.app**

## Fonctionnalités

Interface façon appli mobile (thème sombre, navigation en bas, bouton flottant),
avec 4 sections :

- **Dashboard** : dépenses de la période (par saison de chauffe ou depuis
  toujours), rythme de consommation sur 7 jours, stock restant estimé,
  autonomie estimée, alerte stock bas, graphique des 7 derniers jours et
  consommation mensuelle de la saison.
- **Historique** : achats, brûlages et entretiens dans une liste unique,
  filtrable par type et groupée par mois.
- **Statistiques** : évolution mensuelle de la saison (sacs brûlés ou
  dépenses) et comparaison entre saisons (sacs brûlés vs sacs achetés).
- **Entretiens** : suivi des opérations de maintenance (Annuel, Régulier,
  Vitre, Annexes).

Ajout d'une entrée (achat en sacs ou en palettes, brûlage en kg ou en sacs,
entretien) via un unique bouton **+**. Paramètres (poids par sac, sacs par
palette, seuil d'alerte, devise) et sauvegarde (export / import JSON,
réinitialisation) accessibles via l'icône ⚙️.

La saison de chauffe court de septembre à août (ex. « 2026/2027 »), plus
pertinente qu'une année civile pour ce type de suivi.

## Structure du projet

```
public/
  index.html   (page unique, CSS et JS inclus)
firebase.json
.firebaserc
CHANGELOG.md
```

## Développement local

Aucune dépendance ni build requis : `public/index.html` est un fichier
autonome. Ouvrez-le directement dans un navigateur (double-clic), ou
servez le dossier `public/` :

```bash
npx serve public
# ou
python3 -m http.server --directory public 8080
```

Puis ouvrez `http://localhost:8080` (ou le port indiqué).

## Déploiement sur Firebase Hosting (pellets-conso.web.app)

1. Installer les outils Firebase (une seule fois) :
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Créer le projet Firebase `pellets-conso` (si ce n'est pas déjà fait), depuis la
   [console Firebase](https://console.firebase.google.com/) ou en CLI :
   ```bash
   firebase projects:create pellets-conso
   ```
3. Déployer :
   ```bash
   firebase deploy --only hosting
   ```

L'application sera alors accessible sur `https://pellets-conso.web.app`.

## Données et confidentialité

Aucune donnée n'est envoyée à un serveur : tout est conservé dans le
`localStorage` du navigateur utilisé. Pensez à exporter régulièrement une
sauvegarde JSON depuis l'onglet **Paramètres** (changement de navigateur,
d'appareil, nettoyage du cache, etc.).

## Changelog

Voir [CHANGELOG.md](./CHANGELOG.md).
