# VELORA — RestoManager

Application web de gestion gastronomique développée avec **React JS**, **Vite**, **React Router** et **Bootstrap 5**.

## Fonctionnalités principales

- **Accueil (`/`)** : Présentation de la maison VELORA, aperçu du menu dégustation, indicateurs en direct et accès rapide par catégorie.
- **Menu (`/menu`)** : Affichage dynamique des plats, recherche instantanée, filtrage par catégorie, édition complète et suppression avec confirmation.
- **Ajouter (`/ajouter`)** : Formulaire contrôlé avec validation, import/compression d’image locale ou choix de visuel, aperçu en direct et redirection automatique.
- **Commandes (`/commandes`)** : Création et modification de commandes, calcul automatique des montants, gestion des statuts et mise à jour synchronisée des stocks.
- **Statistiques (`/statistiques`)** : Tableau de bord temps réel (chiffre d’affaires livré, panier moyen, palmarès des ventes, répartition par catégorie, valorisation des stocks) et réinitialisation démo.
- **Persistance** : Sauvegarde automatique dans `localStorage` via `useEffect` avec synchronisation multi-onglets.

## Structure du projet

```text
src/
├── components/   # Navbar, DishCard, SearchBar, OrderCard, StatCard, ConfirmModal
├── pages/        # Home, Menu, Ajouter, Commandes, Statistiques
├── data/         # initialData.js (plats, commandes et clients initiaux)
├── utils/        # storage.js (localStorage), validation.js (contrôles & sécurité)
├── App.jsx       # État global partagé (Lifting State Up) et routage
├── main.jsx      # Point d'entrée React + Bootstrap + BrowserRouter
└── index.css     # Charte graphique et styles responsive