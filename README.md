# Vroom Vroom Cliker

Projet Idle Game Clicker en Node.js, Express & EJS

## Stack technique

- Node.js
- Express
- EJS
- TDD : Vitest (unit), Playwright (E2E/UI)
- Linter : ESLint
- CI : GitHub Actions (install → lint → test:unit → build\* → test:e2e)

## Démarrage

```bash
npm install
npm run dev
```

## Scripts disponibles

- `npm run start` : démarre le serveur Express
- `npm run dev` : démarre le serveur avec nodemon
- `npm run lint` : lance ESLint sur le code
- `npm run test:unit` : lance les tests unitaires (Vitest)
- `npm run test:e2e` : lance les tests E2E (Playwright)
- `npm run build` : placeholder (aucune étape de build nécessaire)

## Structure du projet

- `src/` : code source Express
- `src/views/` : templates EJS
- `src/routes/` : routes Express
- `tests/unit/` : tests unitaires
- `tests/e2e/` : tests E2E

---

Initialisation prête pour le développement en TDD et l'intégration continue.
