# project.md — Vroom Vroo Clicker

> Document de référence projet. Toute nouvelle feature ou suite de tests doit se baser sur ce fichier.
> Approche : **TDD strict** — les tests sont écrits avant le code.

---

## 1. Vue d'ensemble

| Champ | Valeur |
|---|---|
| Nom | Vroom Vroo Clicker |
| Type | Idle / Clicker game |
| Ressource principale | **Chevaux** (horse power — HP) |
| Stack | Node.js · Express · EJS · SQLite |
| Tests unitaires | Vitest |
| Tests UI/E2E | Playwright |
| Lint | ESLint (flat config) |
| CI | GitHub Actions |
| Couverture cible | ≥ 90 % |

---

## 2. Architecture

### Principe général

```
┌─────────────────────────────────────────────────┐
│                   Navigateur                    │
│  EJS rendu serveur + JS client (fetch/events)   │
└───────────────────┬─────────────────────────────┘
                    │ HTTP (REST JSON)
┌───────────────────▼─────────────────────────────┐
│              Express (routes)                   │
│  /auth  /game/click  /game/upgrade  /game/state │
└───────────────────┬─────────────────────────────┘
                    │ appels directs
┌───────────────────▼─────────────────────────────┐
│           Game Engine (pure JS/TS)              │
│  engine/click.js  engine/upgrades.js            │
│  engine/events.js  engine/autoclicker.js        │
│  engine/format.js  engine/state.js              │
└───────────────────┬─────────────────────────────┘
                    │ read / write
┌───────────────────▼─────────────────────────────┐
│              SQLite (better-sqlite3)            │
│  tables: users · game_states · upgrades_owned   │
└─────────────────────────────────────────────────┘
```

### Règle clé

Le **Game Engine** ne doit avoir **aucune dépendance** vers Express, EJS ou SQLite.  
Il reçoit un `GameState` pur, retourne un nouveau `GameState` pur.  
→ Permet de tester 100 % de la logique métier sans serveur ni base de données.

---

## 3. Structure des fichiers

```
vroom-vroo-clicker/
├── src/
│   ├── engine/
│   │   ├── state.js          # schéma + helpers GameState
│   │   ├── click.js          # logique du clic
│   │   ├── upgrades.js       # paliers, coûts, effets
│   │   ├── autoclicker.js    # logique autoclickers
│   │   ├── events.js         # événements temporaires (bonus/malus)
│   │   └── format.js         # formatage des nombres (K, M, MM)
│   ├── routes/
│   │   ├── auth.js           # register / login / logout
│   │   ├── game.js           # click, upgrade, state
│   │   └── index.js          # page principale
│   ├── db/
│   │   ├── database.js       # connexion SQLite (better-sqlite3)
│   │   ├── migrations.js     # CREATE TABLE si inexistant
│   │   └── gameStateRepo.js  # CRUD game_states
│   ├── views/
│   │   ├── layout.ejs
│   │   ├── index.ejs
│   │   └── partials/
│   │       ├── hud.ejs
│   │       ├── upgrades.ejs
│   │       └── events.ejs
│   ├── middleware/
│   │   └── auth.js           # vérif session
│   └── app.js                # création app Express (sans listen)
├── server.js                 # point d'entrée (app.listen)
├── tests/
│   ├── unit/
│   │   ├── engine/
│   │   │   ├── click.test.js
│   │   │   ├── upgrades.test.js
│   │   │   ├── autoclicker.test.js
│   │   │   ├── events.test.js
│   │   │   └── format.test.js
│   │   ├── routes/
│   │   │   ├── auth.test.js
│   │   │   └── game.test.js
│   │   └── db/
│   │       └── gameStateRepo.test.js
│   └── e2e/
│       ├── auth.spec.js
│       ├── click.spec.js
│       ├── upgrades.spec.js
│       └── events.spec.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── vitest.config.js
├── playwright.config.js
├── eslint.config.js
└── project.md                # ce fichier
```

---

## 4. Schéma GameState

```js
// src/engine/state.js
const DEFAULT_STATE = {
  userId: null,

  // Ressource principale
  horses: 0,             // nombre courant de chevaux
  totalHorsesEarned: 0,  // cumulé depuis le début (pour prestige futur)

  // Clic
  clickPower: 1,         // chevaux gagnés par clic manuel

  // Autoclickers
  autoclickers: [],      // [{ id, level, cps, active }]

  // Upgrades possédées  [{ categoryId, tierId, purchasedAt }]
  upgrades: [],

  // Événement actif (null si aucun)
  activeEvent: null,     // { type, multiplier, expiresAt, requiresAction }

  // Timestamps
  lastSavedAt: null,
  lastTickAt: null,
};
```

---

## 5. Formatage des nombres

| Valeur | Affiché |
|---|---|
| 0 – 999 | `999` |
| 1 000 – 999 999 | `1K` → `999K` |
| 1 000 000 – 999 999 999 | `1M` → `999M` |
| ≥ 1 000 000 000 | `1MM`, `2MM`… |

```js
// src/engine/format.js
export function formatHorses(n) { ... }
```

---

## 6. Catalogue des Upgrades

### Règles communes
- Chaque catégorie a 6 paliers déclenchés aux niveaux : **1, 25, 50, 100, 250, 500**.
- Le coût de chaque palier suit une progression exponentielle définie par catégorie.
- L'achat d'un palier est irréversible et cumulatif.
- Effets : modifier `clickPower` et/ou `cps` (chevaux/sec passifs).

### 6.1 Admission d'air / Filtre

| Niveau | Nom | Effet |
|---|---|---|
| 1 | Filtre en papier usé | clickPower × 1.0 (base) |
| 25 | Conduit sport | clickPower × 1.5 |
| 50 | Entrée d'air sur le capot | clickPower × 2.5 + son spécial |
| 100 | Aspirateur industriel (bricolé) | clickPower × 5 |
| 250 | Turbine (type avion) | clickPower × 15 |
| 500 | Aspirateur de matière noire | clickPower × 50 |

### 6.2 Carburant / Injection

| Niveau | Nom | Effet |
|---|---|---|
| 1 | Sans Plomb 95 (dilué) | cps + 0 (base) |
| 25 | Sans Plomb 98 | cps × 1.5 |
| 50 | Méthanol 85 | cps × 3 |
| 100 | Carburant de fusée | cps × 8 |
| 250 | Plutonium enrichi | cps × 25 |
| 500 | Jus de dinosaure concentré ×200 | cps × 100 |

### 6.3 Échappement

| Niveau | Nom | Effet |
|---|---|---|
| 1 | Pot percé (Twingo) | clickPower + 0 (base) |
| 25 | Ligne complète inox "Full Tube" | clickPower × 2 |
| 50 | Lance-flammes intégré | clickPower × 4 |
| 100 | Orgue / cracheur de feu | clickPower × 10 |
| 250 | Trompette surpuissante | clickPower × 30 |
| 500 | Propulseur de navette spatiale | clickPower × 100 |

### 6.4 Bloc moteur / Cylindres

| Niveau | Nom | Affichage type moteur | Effet |
|---|---|---|---|
| 1 | Moteur de tondeuse (monocylindre) | 1-cyl | cps × 1 |
| 25 | 4 cylindres en ligne | 4-cyl | cps × 3 |
| 50 | Moteur V8 américain | V8 | cps × 7 |
| 100 | V10 (Bugatti) | V10 | cps × 20 |
| 250 | V12 (prend la moitié de la voiture) | V12 | cps × 60 |
| 500 | Réacteur/rotor expérimental | RÉACTEUR | cps × 200 |

---

## 7. Autoclickers

- Achetables avec des chevaux.
- Chaque autoclicker a un **niveau** (1 → N), upgradable séparément.
- Attributs : `id · name · baseCps · level · costBase · costGrowthRate · active`.
- Une pause d'autoclicker peut être déclenchée par un événement malus.
- **Calcul CPS total** = Σ (autoclicker.baseCps × autoclicker.level × multiplicateurCarburant × multiplicateurCylindres).

---

## 8. Système d'événements

### Types

| Type | Catégorie | Effet | Durée |
|---|---|---|---|
| `GOLDEN_TURBO` | Bonus | clickPower × 3 pendant la durée | 30 s |
| `AUTO_CLICK_FRENZY` | Bonus | autoclickers × 2 | 20 s |
| `FUEL_SURGE` | Bonus | cps × 5 | 15 s |
| `ENGINE_FAILURE` | Malus | cps × 0.5 | 20 s |
| `AUTOCLICKER_PAUSE` | Malus | autoclickers suspendus | 15 s |
| `RADAR_ALERT` | Malus interactif | cps × 0.1 jusqu'à clic de l'alerte | max 30 s |
| `POLICE_CONTROL` | Malus interactif | production = 0 jusqu'à résolution | max 45 s |

### Règles
- Un seul événement actif à la fois.
- Déclenchement aléatoire par probabilité configurable (`EVENT_PROBABILITY`).
- Les événements interactifs (`requiresAction: true`) nécessitent un appel à `POST /game/event/resolve`.
- À expiration, `activeEvent` repasse à `null` et les effets sont annulés.

---

## 9. Authentification

- **Register** : `POST /auth/register` — pseudo + mot de passe hashé (bcrypt).
- **Login** : `POST /auth/login` — session via `express-session` + cookie signé.
- **Logout** : `POST /auth/logout`.
- Le `userId` de la session est utilisé pour charger/sauvegarder le `GameState` depuis SQLite.
- Toutes les routes `/game/*` sont protégées par le middleware `requireAuth`.

---

## 10. Routes Express

```
GET  /                  → index.ejs (page jeu, nécessite auth)
GET  /auth/register     → formulaire inscription
POST /auth/register     → création compte
GET  /auth/login        → formulaire login
POST /auth/login        → authentification
POST /auth/logout       → déconnexion

GET  /game/state        → JSON : GameState courant
POST /game/click        → JSON : { horses, clickPower, activeEvent }
POST /game/upgrade      → body: { categoryId, tierId } → JSON : nouveau GameState
POST /game/autoclicker/buy   → body: { autoclickerId }
POST /game/autoclicker/upgrade → body: { autoclickerId }
POST /game/event/resolve     → résout l'événement interactif actif
POST /game/tick         → appelé par setInterval client (ou serveur) pour cps passif
```

---

## 11. Base de données SQLite

```sql
-- migrations.js

CREATE TABLE IF NOT EXISTS users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  username  TEXT UNIQUE NOT NULL,
  password  TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_states (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER UNIQUE NOT NULL REFERENCES users(id),
  state_json TEXT NOT NULL,          -- sérialisation JSON du GameState
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

> Toute la logique de progression est stockée dans `state_json`.  
> On évite les jointures complexes pour rester simple et testable.

---

## 12. Stratégie de tests (TDD)

### Ordre de développement

```
1. engine/format.js          → tests formatage nombres
2. engine/state.js           → tests initialisation / helpers
3. engine/click.js           → tests logique de clic
4. engine/upgrades.js        → tests paliers, coûts, effets
5. engine/autoclicker.js     → tests achat, upgrade, cps
6. engine/events.js          → tests déclenchement, expiration, résolution
7. db/gameStateRepo.js       → tests CRUD SQLite (base in-memory pour tests)
8. routes/auth.js            → tests register/login/logout (supertest)
9. routes/game.js            → tests toutes routes jeu (supertest)
10. E2E Playwright           → parcours utilisateurs complets
```

### Règle TDD

```
ROUGE  → écrire le test qui échoue
VERT   → écrire le minimum de code pour le faire passer
BLEU   → refactorer sans casser les tests
```

### Cas à couvrir (obligatoires pour chaque module)

| Catégorie | Exemples |
|---|---|
| **Cas normaux** | clic standard, achat upgrade disponible, login valide |
| **Cas d'erreur** | fonds insuffisants, palier déjà acheté, login inconnu, event déjà actif |
| **Cas limites** | 0 chevaux, valeurs très grandes (1MM+), expiration d'événement à t+0, autoclicker niveau max |

---

## 13. Tests unitaires — Vitest

### vitest.config.js

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
      exclude: ['tests/**', 'src/views/**', 'server.js'],
    },
  },
});
```

### Exemples de cas de tests attendus

```js
// tests/unit/engine/format.test.js
describe('formatHorses', () => {
  it('affiche un entier sous 1000 tel quel',     () => expect(formatHorses(999)).toBe('999'));
  it('affiche 1000 en 1K',                        () => expect(formatHorses(1000)).toBe('1K'));
  it('affiche 1 500 000 en 1M',                   () => expect(formatHorses(1_500_000)).toBe('1M'));
  it('affiche 2 000 000 000 en 2MM',              () => expect(formatHorses(2_000_000_000)).toBe('2MM'));
  it('gère 0',                                    () => expect(formatHorses(0)).toBe('0'));
  it('gère les négatifs (cas limite)',             () => expect(formatHorses(-500)).toBe('-500'));
});

// tests/unit/engine/click.test.js
describe('processClick', () => {
  it('ajoute clickPower au total de chevaux');
  it('applique le multiplicateur d\'un événement GOLDEN_TURBO actif');
  it('n\'applique pas le multiplicateur si l\'événement est expiré');
  it('incrémente totalHorsesEarned');
  it('ne modifie pas les autoclickers');
});

// tests/unit/engine/upgrades.test.js
describe('buyUpgrade', () => {
  it('déduit le coût en chevaux');
  it('ajoute l\'upgrade à l\'état');
  it('lance une erreur si fonds insuffisants');
  it('lance une erreur si palier déjà possédé');
  it('met à jour clickPower selon la catégorie Admission');
  it('met à jour cps selon la catégorie Carburant');
  it('met à jour le type de moteur affiché à chaque palier Bloc moteur');
});

// tests/unit/engine/events.test.js
describe('triggerEvent', () => {
  it('ne déclenche pas si un événement est déjà actif');
  it('positionne expiresAt correctement selon la durée');
  it('isEventActive retourne false après expiration');
  it('resolveEvent efface l\'événement interactif');
  it('RADAR_ALERT réduit le cps à 10%');
});
```

---

## 14. Tests E2E — Playwright

### playwright.config.js

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: { NODE_ENV: 'test', DATABASE_URL: ':memory:' },
  },
});
```

### Scénarios E2E à couvrir

```
auth.spec.js
  ✓ inscription avec pseudo et mot de passe valides
  ✓ connexion et redirection vers le jeu
  ✓ tentative de connexion avec mauvais mot de passe → message d'erreur
  ✓ accès à / sans être connecté → redirection /auth/login

click.spec.js
  ✓ clic sur le bouton principal → compteur de chevaux s'incrémente
  ✓ affichage correct : 999 → 1K → 1M → 1MM
  ✓ clickPower reflété dans l'UI (indicateur puissance)

upgrades.spec.js
  ✓ bouton upgrade grisé si fonds insuffisants
  ✓ achat d'un upgrade Admission → clickPower mis à jour dans l'UI
  ✓ palier affiché dans l'UI Bloc moteur change après achat

events.spec.js
  ✓ apparition d'une bannière GOLDEN_TURBO avec compteur
  ✓ disparition automatique à expiration
  ✓ RADAR_ALERT affiche un bouton → clic résout l'événement
  ✓ POLICE_CONTROL bloque la production → résolution la relance
```

---

## 15. Linter — ESLint

### eslint.config.js (flat config)

```js
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
      'eqeqeq': 'error',
      'curly': 'error',
    },
  },
  { ignores: ['node_modules/', 'coverage/'] },
];
```

---

## 16. CI GitHub Actions

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  pipeline:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Unit tests + coverage
        run: npm run test:unit -- --coverage

      - name: Check coverage thresholds
        run: npm run test:unit -- --coverage --reporter=verbose

      - name: Build (assets/vérification)
        run: npm run build --if-present

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: E2E tests
        run: npm run test:e2e
        env:
          NODE_ENV: test
          SESSION_SECRET: ci-secret-not-for-prod
          DATABASE_URL: ':memory:'

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 17. Scripts package.json

```json
{
  "scripts": {
    "start":        "node server.js",
    "dev":          "node --watch server.js",
    "lint":         "eslint src/ tests/",
    "lint:fix":     "eslint src/ tests/ --fix",
    "test:unit":    "vitest run",
    "test:watch":   "vitest",
    "test:e2e":     "playwright test",
    "test:all":     "npm run test:unit && npm run test:e2e",
    "coverage":     "vitest run --coverage"
  }
}
```

---

## 18. Dépendances

```json
{
  "dependencies": {
    "express":          "^4.x",
    "ejs":              "^3.x",
    "better-sqlite3":   "^9.x",
    "express-session":  "^1.x",
    "bcrypt":           "^5.x"
  },
  "devDependencies": {
    "vitest":                "^2.x",
    "@vitest/coverage-v8":   "^2.x",
    "supertest":             "^7.x",
    "@playwright/test":      "^1.x",
    "eslint":                "^9.x",
    "@eslint/js":            "^9.x",
    "globals":               "^15.x"
  }
}
```

---

## 19. Variables d'environnement

```env
# .env (ne jamais committer)
NODE_ENV=development
PORT=3000
SESSION_SECRET=change_me_in_production
DATABASE_URL=./data/vroom.db
```

```env
# .env.test
NODE_ENV=test
DATABASE_URL=:memory:
SESSION_SECRET=test-secret
```

---

## 20. Roadmap de développement (TDD strict — test avant feature)

> **Règle absolue** : on n'écrit pas une ligne de code feature tant que le test correspondant
> n'existe pas et n'est pas en état **ROUGE** (failing). Chaque ticket suit le cycle :
> `ROUGE → VERT → REFACTOR`.
>
> Références des scénarios : voir `TDD.md`.

---

### TICKET-01 — Formatage des nombres

```
ÉTAPE 1 — TEST    Écrire tests/unit/engine/format.test.js
                  Scénarios : F-01 → F-11 (TDD.md)
                  → vitest run : 11 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/engine/format.js
                  → vitest run : 11 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture ≥ 90%
```

---

### TICKET-02 — Schéma et helpers GameState

```
ÉTAPE 1 — TEST    Écrire tests/unit/engine/state.test.js
                  Scénarios : S-01 → S-06 (TDD.md)
                  → vitest run : 6 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/engine/state.js
                  → vitest run : 17 tests VERT ✓ (cumul TICKET-01)

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture
```

---

### TICKET-03 — Logique du clic

```
ÉTAPE 1 — TEST    Écrire tests/unit/engine/click.test.js
                  Scénarios : CL-01 → CL-07 (TDD.md)
                  → vitest run : 7 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/engine/click.js
                  (dépend de state.js — TICKET-02 doit être VERT)
                  → vitest run : 24 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture
```

---

### TICKET-04 — Upgrades (4 catégories, paliers, coûts, effets)

```
ÉTAPE 1 — TEST    Écrire tests/unit/engine/upgrades.test.js
                  Scénarios : U-01 → U-12 (TDD.md)
                  → vitest run : 12 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/engine/upgrades.js
                  (catalogue des 4 familles + calcul clickPower / cps)
                  → vitest run : 36 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture
```

---

### TICKET-05 — Autoclickers

```
ÉTAPE 1 — TEST    Écrire tests/unit/engine/autoclicker.test.js
                  Scénarios : AC-01 → AC-10 (TDD.md)
                  → vitest run : 10 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/engine/autoclicker.js
                  (achat, upgrade, getTotalCps, applyTick)
                  → vitest run : 46 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture
```

---

### TICKET-06 — Système d'événements

```
ÉTAPE 1 — TEST    Écrire tests/unit/engine/events.test.js
                  Scénarios : EV-01 → EV-12 (TDD.md)
                  → vitest run : 12 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/engine/events.js
                  (triggerEvent, isEventActive, clearExpiredEvent, resolveEvent)
                  → vitest run : 58 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture
```

---

### TICKET-07 — Migrations SQLite

```
ÉTAPE 1 — TEST    Écrire tests/unit/db/migrations.test.js
                  Scénarios : DB-01 → DB-02 (TDD.md)
                  (utiliser better-sqlite3 en mode :memory:)
                  → vitest run : 2 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/db/migrations.js
                  → vitest run : 60 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture
```

---

### TICKET-08 — Repository GameState (CRUD)

```
ÉTAPE 1 — TEST    Écrire tests/unit/db/gameStateRepo.test.js
                  Scénarios : DB-03 → DB-08 (TDD.md)
                  (DB in-memory, migrations jouées en beforeEach)
                  → vitest run : 6 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/db/gameStateRepo.js
                  (saveGameState, loadGameState, deleteGameState)
                  → vitest run : 66 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture
```

---

### TICKET-09 — Routes d'authentification

```
ÉTAPE 1 — TEST    Écrire tests/unit/routes/auth.test.js
                  Scénarios : AUTH-01 → AUTH-08 (TDD.md)
                  (supertest + app Express sans server.listen, DB in-memory)
                  → vitest run : 8 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/routes/auth.js + src/middleware/auth.js
                  Implémenter src/app.js (création Express sans listen)
                  → vitest run : 74 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture
```

---

### TICKET-10 — Routes du jeu

```
ÉTAPE 1 — TEST    Écrire tests/unit/routes/game.test.js
                  Scénarios : G-01 → G-12 (TDD.md)
                  (supertest, session simulée, DB in-memory)
                  → vitest run : 12 tests ROUGE ✗

ÉTAPE 2 — FEATURE Implémenter src/routes/game.js
                  (brancher engine + repo sur les routes)
                  → vitest run : 86 tests VERT ✓

ÉTAPE 3 — REFACTOR Nettoyer, vérifier couverture ≥ 90% — OBJECTIF ATTEINT
```

---

### TICKET-11 — Vues EJS

```
ÉTAPE 1 — TEST    Écrire les scénarios E2E Playwright pour les vues
                  (les scénarios E2E servent de spec pour les vues)
                  Fichiers : tests/e2e/auth.spec.js · click.spec.js
                             upgrades.spec.js · events.spec.js
                  → playwright test : tous les scénarios ROUGE ✗
                  (les routes répondent mais les vues n'existent pas encore)

ÉTAPE 2 — FEATURE Implémenter src/views/ (layout.ejs, index.ejs, partials/)
                  Implémenter server.js (app.listen)
                  → playwright test : scénarios E2E progressivement VERT ✓

ÉTAPE 3 — REFACTOR Ajuster le rendu, accessibilité, sélecteurs Playwright stables
```

---

### TICKET-12 — Validation E2E complète

```
ÉTAPE 1 — VÉRIF   Tous les scénarios E2E-AUTH, E2E-CL, E2E-UP,
                  E2E-EV, E2E-PERSIST doivent être VERT ✓
                  Scénarios : E2E-AUTH-01→04, E2E-CL-01→04,
                              E2E-UP-01→04, E2E-EV-01→05,
                              E2E-PERSIST-01→02 (TDD.md)

ÉTAPE 2 — FIX     Corriger les régressions jusqu'à 100% E2E VERT ✓

ÉTAPE 3 — RAPPORT Vérifier le rapport de couverture Vitest ≥ 90%
                  Vérifier le rapport Playwright (0 flaky tests)
```

---

### TICKET-13 — CI GitHub Actions

```
ÉTAPE 1 — TEST    Vérifier manuellement la séquence complète en local :
                  npm run lint
                  npm run test:unit -- --coverage
                  npm run test:e2e

ÉTAPE 2 — FEATURE Écrire .github/workflows/ci.yml
                  Pipeline : install → lint → tests unitaires → build → E2E

ÉTAPE 3 — VÉRIF   Ouvrir une Pull Request de test
                  → pipeline CI passe entièrement au VERT ✓
                  → artifacts coverage + playwright-report uploadés
```

---

### TICKET-14 — Polish (hors couverture de tests)

```
- Sons et effets visuels par palier d'upgrade
- Animations du compteur de chevaux
- Skins / modes spéciaux
- Autopilote / pilote automatique
- Réductions de coût via upgrades économiques
```

---

### Vue d'ensemble de la progression des tests

```
Après TICKET-01 :   11 tests VERT
Après TICKET-02 :   17 tests VERT
Après TICKET-03 :   24 tests VERT
Après TICKET-04 :   36 tests VERT
Après TICKET-05 :   46 tests VERT
Après TICKET-06 :   58 tests VERT
Après TICKET-07 :   60 tests VERT
Après TICKET-08 :   66 tests VERT
Après TICKET-09 :   74 tests VERT
Après TICKET-10 :   86 tests VERT  ← couverture ≥ 90% atteinte
Après TICKET-11/12: 86 tests + 16 scénarios E2E VERT ✓
```

---

## 21. Conventions de code

- **Modules ES** (`import/export`) partout, `"type": "module"` dans `package.json`.
- Fonctions du game engine : **pures** (pas d'effets de bord), retournent toujours un nouveau `GameState`.
- Nommage : `camelCase` pour variables/fonctions, `UPPER_SNAKE_CASE` pour constantes de config.
- Chaque fichier de test miroir son fichier source : `src/engine/click.js` → `tests/unit/engine/click.test.js`.
- Commits : format **Conventional Commits** (`feat:`, `test:`, `fix:`, `chore:`).

---

*Dernière mise à jour : mai 2026*
