# Pellets Conso

Application de suivi de la consommation et du coût des pellets (granulés de bois), sur une base annuelle et pluriannuelle.

Application 100% statique (HTML / CSS / JavaScript), sans backend. Toutes les données sont stockées localement dans le navigateur (`localStorage`).

URL cible une fois déployée : **https://pellets-conso.web.app**

## Fonctionnalités

- **Achats** : date, nombre de sacs, poids par sac, prix par sac, note.
- **Consommation** : date, quantité (kg ou sacs), note.
- **Tableau de bord** (filtrable par année ou sur tout l'historique) :
  - Total consommé sur la période
  - Coût total des achats sur la période
  - Prix moyen au kg (basé sur les achats)
  - Valeur estimée de ce qui a été consommé
  - Stock restant estimé (achats cumulés − consommation cumulée)
  - Graphique de consommation mensuelle
  - Graphique de comparaison pluriannuelle (consommation vs coût)
- **Paramètres** : poids par sac par défaut, symbole monétaire.
- **Sauvegarde** : export / import des données en JSON, réinitialisation.

## Structure du projet

```
public/
  index.html
  css/style.css
  js/app.js
firebase.json
.firebaserc
CHANGELOG.md
```

## Développement local

Aucune dépendance ni build requis. Servez simplement le dossier `public/` :

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
