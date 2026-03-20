# Projet ManageSchedule

Application de gestion d'emploi du temps.

## Installation et Démarrage

1.  **Installation des dépendances**

    `Projet backend et frontend`
    ```bash
    npm install
    ```
2. **Générer Swagger**

    `Projet backend`
    Permet d'accéder à la documentation de l'API http://localhost:3000/docs
    ```bash
    npm run generate
    ``` 

3.  **Initialisation de la Base de Données (Mock Data)**

    `Projet backend`
    Cette commande réinitialise la base de données et charge des données de test (Profs, Élèves, Cours, Créneaux, Inscriptions).
    
    **Attention** : Toutes les données existantes seront supprimées.

    ```bash
    npx ts-node scripts/load-mock-data.ts
    ```

4.  **Lancement en mode développement**

    `Projet frontend`
    ```bash
    npm run dev
    ```

## Données de Test (Mock Data)

Les utilisateurs suivants sont créés par le script load-mock-data.ts :

### Enseignants

- **Login**: prof1 à prof5
- **Mot de passe**: prof
- **Note**: Le prof3 a un profil **privé**.

### Élèves

- **Login**: eleve1 à eleve5
- **Mot de passe**: eleve
- **Note**: eleve4 a un profil **privé**.

# Maintenance
