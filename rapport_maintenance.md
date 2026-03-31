# Rapport de Maintenance — Projet ManageSchedule (Backend)

**Matière :** Maintenance Applicative — BUT Informatique 3ème année  
**Date :** 20 mars 2026  

---

## 1. Description de l'analyse de l'existant

### 1.1 Présentation du projet

**ManageSchedule** est une API REST de gestion d'emplois du temps, développée avec la stack suivante :

| Technologie | Rôle |
|---|---|
| **Node.js / Express** | Serveur HTTP |
| **TypeScript** | Typage statique |
| **TSOA** | Génération automatique des routes & Swagger |
| **Sequelize** | ORM (SQLite) |
| **JWT / bcrypt** | Authentification & hashage |
| **Joi** (déclaré mais non utilisé) | Validation de données |

### 1.2 Architecture

```
src/
├── app.ts                  # Point d'entrée
├── config/database.ts      # Configuration Sequelize
├── controllers/            # 5 contrôleurs (auth, course, enrollment, scheduleSlot, user)
├── services/               # 5 services métier
├── models/                 # 4 modèles + associations
├── dto/                    # Data Transfer Objects
├── mapper/                 # Mappers model → DTO
├── middlewares/             # Auth, rôles, gestion d'erreurs
└── routes/index.ts         # Routes auto-générées par TSOA
```

L'architecture suit un pattern **Controller → Service → Model** classique avec des DTOs et Mappers pour séparer la couche de transport de la couche persistance.

### 1.3 Points forts

- **Architecture en couches** bien structurée (Controller / Service / Model / DTO / Mapper)
- **Système de permissions RBAC** avec vérification granulaire par ressource et action ([roleMiddleware.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/middlewares/roleMiddleware.ts))
- **Gestion des conflits d'horaires** complète et robuste dans [scheduleSlot.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/scheduleSlot.service.ts)
- **Protection des profils privés** avec logique d'accès conditionnelle
- **TSOA** pour la génération automatique de la documentation Swagger
- **Hashage des mots de passe** avec bcrypt

### 1.4 Points faibles identifiés

- **Aucun test unitaire ni d'intégration** (`"test": "echo \"Error: no test specified\" && exit 1"`)
- **Aucune validation des entrées** (Joi est déclaré en dépendance mais jamais utilisé)
- **Incohérences de nommage** entre les modèles (`createAt` vs `createdAt`)
- **Mélange de langues** dans les messages d'erreur (français / anglais)
- **Configuration ignorée** : le [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) n'est pas chargé (pas de `dotenv`)
- **Failles de sécurité** : le fichier [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) est versionné avec un secret JWT en clair

---

## 2. Qualification des anomalies

Le tableau ci-dessous recense toutes les anomalies identifiées, classées par sévérité.

| # | Type | Fichier(s) | Description | Sévérité |
|---|---|---|---|---|
| **B1** | 🐛 Bug | [course.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/course.service.ts#L46) | `await` manquant sur `course.destroy()` dans [deleteCourse](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/course.service.ts#43-49) — la suppression n'est pas garantie | **Critique** |
| **B2** | 🐛 Bug | [database.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/config/database.ts) | La variable d'environnement `DB_STORAGE` du [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) est ignorée (chemin codé en dur [./db.sqlite](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/db.sqlite)) | **Majeur** |
| **B3** | 🐛 Bug | [auth.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts#L9) | `JWT_EXPIRES_IN` codé en dur à `'24h'` au lieu de lire `JWT_EXPIRE` du [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) (`7d`) | **Majeur** |
| **B4** | 🐛 Bug | [app.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/app.ts#L12) | `dotenv` n'est ni installé ni importé → `process.env.*` retourne `undefined` pour toutes les variables | **Critique** |
| **B5** | 🐛 Bug | [course.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/course.service.ts#L61) | [updateCourse](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/course.controller.ts#47-60) : `if (name)` et `if (description)` échouent silencieusement si on passe une chaîne vide `""` (falsy value) — devrait être `!== undefined` | **Moyen** |
| **B6** | 🐛 Bug | [user.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/user.controller.ts#L78) | Un enseignant (`teacher`) peut modifier le profil de **n'importe quel** utilisateur, pas seulement ses élèves | **Majeur** |
| **B7** | 🐛 Bug | [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) + [.gitignore](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.gitignore) | Le [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) contient un secret JWT en clair ET n'est **pas ignoré par git** ([.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) est dans le [.gitignore](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.gitignore) mais le fichier est déjà commité) | **Critique (Sécurité)** |
| **B8** | ⚠️ Anomalie | [enrollment.model.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/models/enrollment.model.ts) vs [scheduleSlot.model.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/models/scheduleSlot.model.ts) | Nommage incohérent : `createAt`/`updateAt` (Enrollment) vs `createdAt`/`modifiedAt` (ScheduleSlot) | **Moyen** |
| **B9** | ⚠️ Anomalie | Tous les contrôleurs et services | Mélange de langues : messages en français dans certains services, en anglais dans d'autres | **Mineur** |
| **B10** | ⚠️ Anomalie | [user.model.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/models/user.model.ts#L11) | `isPrivate` est un `number` (0/1) dans le modèle mais un `boolean` dans les DTOs → conversions manuelles `=== 1` partout | **Moyen** |
| **B11** | 🐛 Bug | [enrollment.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/enrollment.controller.ts#L34) | [createEnrollment](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/enrollment.controller.ts#33-56) attend `createAt` et `updateAt` du client → le client peut falsifier les dates de création | **Majeur** |
| **B12** | ⚠️ Anomalie | [scheduleSlot.mapper.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/mapper/scheduleSlot.mapper.ts#L10) | Appel à `.toISOString()` sur `startTime`/`endTime` qui peuvent être des `string` selon la source SQLite → crash potentiel | **Moyen** |
| **B13** | ⚠️ Anomalie | [package.json](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/package.json#L35) | `joi` est déclaré comme dépendance mais n'est importé nulle part → dead dependency | **Mineur** |
| **B14** | ⚠️ Anomalie | [app.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/app.ts#L16-L19) | `CORS` configuré avec `origin: true` → accepte toutes les origines, ignore la variable `CORS_ORIGIN` du [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) | **Moyen** |

---

## 3. Description détaillée des bugs principaux et corrections proposées

### 3.1 B1 — `await` manquant sur `course.destroy()` ⭐ Difficulté : Facile

**Localisation :** [course.service.ts:46](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/course.service.ts#L46)

**Problème :** La méthode `destroy()` de Sequelize est asynchrone et retourne une `Promise`. Sans `await`, la suppression est lancée en "fire-and-forget" — l'appelant reçoit une réponse de succès avant que la suppression ne soit terminée, et si elle échoue, l'erreur ne sera jamais capturée.

**Code actuel :**
```typescript
public async deleteCourse(id: number): Promise<void> {
    const course = await Course.findByPk(id);
    if (course) {
      course.destroy(); // ❌ await manquant
    }
}
```

**Correction proposée :**
```diff
-      course.destroy();
+      await course.destroy();
```

---

### 3.2 B4 — `dotenv` non installé ni importé ⭐ Difficulté : Facile

**Localisation :** [app.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/app.ts), [package.json](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/package.json)

**Problème :** Le fichier [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) est présent avec des variables configurées (`PORT`, `DB_STORAGE`, `JWT_SECRET`, etc.), mais le package `dotenv` n'est pas installé et n'est pas importé dans [app.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/app.ts). Par conséquent, **aucune variable d'environnement du [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) n'est chargée**. Cela impacte en cascade :
- `PORT` → fallback sur `8000` (pas `3000` comme dans [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env))
- `JWT_SECRET` → fallback sur la valeur codée en dur dans [auth.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts)
- `DB_STORAGE` → ignoré (chemin codé en dur)
- `CORS_ORIGIN` → ignoré (`origin: true`)

**Correction proposée :**
```bash
npm install dotenv
```
```diff
// app.ts (ligne 1)
+import 'dotenv/config';
 import express, { Application, Request, Response } from "express";
```

---

### 3.3 B2 + B3 — Variables d'environnement ignorées dans la configuration ⭐ Difficulté : Facile

**Localisation :** [database.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/config/database.ts), [auth.service.ts:9](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts#L9)

**Problème base de données :** Le chemin SQLite est codé en dur `"./db.sqlite"` au lieu de lire `process.env.DB_STORAGE`.

**Correction :**
```diff
 const sequelize = new Sequelize({
   dialect: "sqlite",
   define: { timestamps: false },
-  storage: "./db.sqlite",
+  storage: process.env.DB_STORAGE || "./db.sqlite",
 });
```

**Problème JWT :** L'expiration du token est codée en dur à `'24h'` au lieu de lire `JWT_EXPIRE` du [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) (`7d`).

**Correction :**
```diff
-  private readonly JWT_EXPIRES_IN = '24h';
+  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRE || '24h';
```

---

### 3.4 B5 — Vérification falsy dans [updateCourse](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/course.controller.ts#47-60) ⭐ Difficulté : Facile

**Localisation :** [course.service.ts:61-62](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/course.service.ts#L61-L62)

**Problème :** Les conditions `if (name)` et `if (description)` utilisent une vérification *truthy*. Si le client envoie une chaîne vide `""`, celle-ci est *falsy* en JavaScript et le champ ne sera pas mis à jour, alors que c'est possiblement le comportement voulu par l'utilisateur.

```diff
-      if (name) course.name = name;
-      if (description) course.description = description;
+      if (name !== undefined) course.name = name;
+      if (description !== undefined) course.description = description;
```

---

### 3.5 B6 — Faille d'autorisation dans [updateUser](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/user.service.ts#31-45) ⭐ Difficulté : Moyen

**Localisation :** [user.controller.ts:78](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/user.controller.ts#L78)

**Problème :** Un enseignant peut modifier le profil de **n'importe quel utilisateur** (y compris un autre enseignant), car la condition est :
```typescript
if (request.user.userId !== id && request.user.role !== 'teacher')
```
Cela signifie : "bloquer si ce n'est pas l'utilisateur lui-même **ET** pas un teacher". Un `teacher` peut donc modifier n'importe qui.

**Correction proposée :**
```diff
-    if (request.user.userId !== id && request.user.role !== 'teacher') {
+    if (request.user.userId !== id) {
       let error: CustomError = new Error("Vous ne pouvez modifier que votre propre profil");
       error.status = 403;
       throw error;
     }
```

---

### 3.6 B11 — Dates `createAt`/`updateAt` fournies par le client ⭐ Difficulté : Moyen

**Localisation :** [enrollment.controller.ts:34-54](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/enrollment.controller.ts#L34-L54)

**Problème :** Le DTO [EnrollmentDTO](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/dto/enrollment.dto.ts#1-9) attend `createAt` et `updateAt` du client. C'est une mauvaise pratique car :
1. Le client peut falsifier les dates
2. Les champs `createAt`/`updateAt` devraient être gérés automatiquement côté serveur

**Correction proposée :** Utiliser Sequelize `timestamps: true` ou générer les dates côté serveur :
```diff
-    const { studentId, courseId, enrollmentAt, createAt, updateAt } = requestBody;
-    return enrollmentService.createEnrollment(studentId, courseId, enrollmentAt, createAt, updateAt);
+    const { studentId, courseId } = requestBody;
+    const now = new Date();
+    return enrollmentService.createEnrollment(studentId, courseId, now, now, now);
```

---

### 3.7 B14 — CORS trop permissif ⭐ Difficulté : Facile

**Localisation :** [app.ts:16-19](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/app.ts#L16-L19)

**Problème :** `origin: true` accepte **toutes** les origines, rendant la variable `CORS_ORIGIN` inutile.

```diff
 app.use(cors({
-  origin: true,
+  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
   credentials: true
 }));
```

---

## 4. Propositions d'évolution

| # | Évolution | Difficulté | Priorité |
|---|---|---|---|
| E1 | Ajouter des **tests unitaires** avec Jest pour les services | Moyen | Haute |
| E2 | Implémenter la **validation des entrées** avec Joi (déjà installé) | Moyen | Haute |
| E3 | Ajouter un mécanisme de **pagination** sur les endpoints `GET /` | Facile | Moyenne |
| E4 | Uniformiser les **messages d'erreur** en français | Facile | Basse |
| E5 | Renommer `createAt`/`updateAt` en `createdAt`/`updatedAt` (migration) | Moyen | Moyenne |
| E6 | Ajouter du **rate limiting** sur les endpoints d'authentification | Facile | Haute |
| E7 | Logger les accès avec un **système de logging** structuré (Winston) | Moyen | Moyenne |
| E8 | Utiliser `DataTypes.BOOLEAN` pour `isPrivate` au lieu de `INTEGER` | Facile | Basse |

---

## 5. Tests effectués

> [!IMPORTANT]
> Le projet ne comporte **aucun test automatisé**. L'analyse a été réalisée entièrement par **revue de code statique**.

### Tests de vérification réalisés

| Test | Méthode | Résultat |
|---|---|---|
| Vérification de l'absence de `dotenv` | Recherche dans [package.json](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/package.json) et imports | ✅ Confirmé : absent |
| Vérification du `await` manquant | Lecture de `course.service.ts:46` | ✅ Confirmé : `course.destroy()` sans `await` |
| Vérification faille autorisation | Lecture de `user.controller.ts:78` | ✅ Confirmé : teacher peut modifier tout utilisateur |
| Vérification CORS permissif | Lecture de `app.ts:17` | ✅ Confirmé : `origin: true` |
| Vérification [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) commité | Présence du fichier [.env](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.env) dans le repo | ✅ Confirmé : fichier présent malgré [.gitignore](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/.gitignore) |
| Vérification Joi non utilisé | `grep` de `joi` dans `src/` | ✅ Confirmé : aucune importation |
| Vérification incohérence nommage | Comparaison [enrollment.model.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/models/enrollment.model.ts) / [scheduleSlot.model.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/models/scheduleSlot.model.ts) | ✅ Confirmé : `createAt` vs `createdAt` |

---

## 6. Difficultés rencontrées

1. **Absence de documentation technique** : le [README.md](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/README.md) décrit l'installation mais pas l'architecture ni les conventions du code.
2. **Routes auto-générées** : le fichier [src/routes/index.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/routes/index.ts) (60 000 caractères) est auto-généré par TSOA, rendant difficile la compréhension du routage sans lire le code source TSOA.
3. **Imports dynamiques** : certains services utilisent des `import()` dynamiques pour éviter des dépendances circulaires, ce qui complexifie la lecture du code et masque des dépendances.
4. **Absence de tests** : l'impossibilité de lancer des tests automatisés a rendu la validation des hypothèses de bugs plus complexe (vérification uniquement par analyse statique).

---

## 7. Améliorations possibles

### Court terme (sprint de 1-2 semaines)
- Installer `dotenv` et corriger tous les bugs B1 à B7
- Ajouter la validation Joi sur les endpoints critiques ([register](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts#12-53), [login](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts#54-85), [createCourse](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/course.controller.ts#34-38))
- Écrire des tests unitaires pour [auth.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts) et [course.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/course.service.ts)

### Moyen terme (1 mois)
- Migration de la base pour renommer `createAt`/`updateAt` → `createdAt`/`updatedAt`
- Passer `isPrivate` de `INTEGER` à `BOOLEAN`
- Ajouter rate limiting et logging structuré
- Implémenter la pagination

### Long terme
- Ajouter un rôle **admin** distinct du teacher
- Mettre en place un pipeline **CI/CD** avec exécution automatique des tests
- Conteneuriser l'application avec **Docker**
- Séparer la configuration par environnement (`development`, `staging`, `production`)

---

## 8. Analyse et Refactoring — Code Smells

### 8.1 Code Smell 1 : Code Dupliqué — Pattern de lancement d'erreurs HTTP

**Type de Code Smell :** Code dupliqué (Duplicated Code)  
**Technique de refactoring :** Extract Method (Martin Fowler)

#### Problème identifié

Le même bloc de 3 lignes est répété **50+ fois** à travers tous les services et contrôleurs :

```typescript
const error: CustomError = new Error('Message');
error.status = 404;
throw error;
```

Ce pattern viole le principe **DRY** (Don't Repeat Yourself). Si le format des erreurs devait évoluer (ajout de logging, de codes d'erreur structurés, d'un stack trace personnalisé), il faudrait modifier chaque occurrence individuellement, soit plus de 50 endroits répartis sur 9 fichiers.

#### Pourquoi c'est un problème

1. **Maintenabilité** : toute modification du format d'erreur nécessite 50+ changements
2. **Risque d'incohérence** : certaines occurrences utilisent `let`, d'autres `const`, certaines typent avec `CustomError`, d'autres avec `any`
3. **Lisibilité** : 3 lignes de boilerplate pour une action sémantiquement simple

#### Refactoring appliqué

Ajout d'une fonction utilitaire `createHttpError()` dans [errorHandler.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/middlewares/errorHandler.ts) :

```typescript
export function createHttpError(status: number, message: string): never {
  const error: CustomError = new Error(message);
  error.status = status;
  throw error;
}
```

Le type de retour `never` informe TypeScript que cette fonction ne retourne jamais (elle lance toujours une exception), permettant au compilateur de comprendre le flux de contrôle.

**Avant (3 lignes) :**
```typescript
const error: CustomError = new Error('Utilisateur non trouvé');
error.status = 404;
throw error;
```

**Après (1 ligne) :**
```typescript
createHttpError(404, 'Utilisateur non trouvé');
```

#### Fichiers modifiés

| Fichier | Occurrences remplacées |
|---|---|
| [auth.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts) | 7 |
| [enrollment.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/enrollment.service.ts) | 6 |
| [scheduleSlot.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/scheduleSlot.service.ts) | 5 |
| [course.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/course.service.ts) | 1 |
| [user.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/user.controller.ts) | 9 |
| [enrollment.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/enrollment.controller.ts) | 6 |
| [scheduleSlot.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/scheduleSlot.controller.ts) | 12 |
| [course.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/course.controller.ts) | 2 |
| [auth.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/auth.controller.ts) | 2 |
| **Total** | **~50 occurrences** |

**Impact :** environ **100 lignes de code supprimées** (réduction de 3 lignes → 1 ligne × 50 occurrences).

---

### 8.2 Code Smell 2 : Code Dupliqué — Mapping User → DTO inline

**Type de Code Smell :** Code dupliqué (Duplicated Code)  
**Technique de refactoring :** Replace Inline Code with Function Call (Martin Fowler)

#### Problème identifié

Le mapping d'un modèle `User` vers un objet DTO est écrit **manuellement 4 fois** dans [auth.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts) et **1 fois** dans [auth.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/auth.controller.ts) :

```typescript
// Bloc dupliqué (présent 4-5 fois)
{
  id: user.id,
  login: user.login,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  isPrivate: user.isPrivate === 1
}
```

Alors qu'un `UserMapper.toDto()` existe déjà dans [user.mapper.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/mapper/user.mapper.ts) et fait **exactement la même chose**.

#### Pourquoi c'est un problème

1. **Incohérence potentielle** : si le format du DTO change (ex: ajout d'un champ `email`), il faut modifier 5 endroits au lieu d'un seul
2. **Violation du SRP** : le service d'authentification ne devrait pas connaître les détails du mapping User → DTO
3. **Mapper inutilisé** : le `UserMapper` existe mais n'est pas exploité partout, ce qui rend le code trompeur

#### Refactoring appliqué

Remplacement des 5 blocs inline par un appel à `UserMapper.toDto(user)` :

**Avant (7 lignes) :**
```typescript
return {
  id: user.id,
  login: user.login,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  isPrivate: user.isPrivate === 1
};
```

**Après (1 ligne) :**
```typescript
return UserMapper.toDto(user);
```

#### Fichiers modifiés

| Fichier | Changement |
|---|---|
| [auth.service.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/services/auth.service.ts) | 3 blocs inline → `UserMapper.toDto()` |
| [auth.controller.ts](file:///Users/romainbouton/Documents/Cours/BUT3/Maintenance/manageschedulebackend/src/controllers/auth.controller.ts) | 1 bloc inline → `UserMapper.toDto()` |

---

### 8.3 Vérification du refactoring

| Vérification | Résultat |
|---|---|
| Compilation TypeScript (`tsc --noEmit`) | ✅ Aucune erreur |
| Cohérence des imports `createHttpError` | ✅ Importé dans tous les fichiers modifiés |
| Cohérence des imports `UserMapper` | ✅ Importé dans `auth.service.ts` et `auth.controller.ts` |
| Comportement fonctionnel préservé | ✅ Les erreurs HTTP sont lancées avec les mêmes codes et messages |

