# TDD.md — Vroom Vroo Clicker

# Scénarios Given / When / Then

> Chaque scénario correspond à un test à écrire **avant** le code (TDD strict).
> Ordre de développement : suivre les tickets TICKET-01 → TICKET-13.

---

## TICKET-01 — `engine/format.js`

### Formatage des nombres (K / M / MM)

---

**SCENARIO F-01 — Nombre inférieur à 1 000**

```
GIVEN  un nombre entier de 999
WHEN   formatHorses(999) est appelé
THEN   le résultat est la chaîne "999"
```

**SCENARIO F-02 — Nombre égal à 1 000**

```
GIVEN  un nombre égal à 1 000
WHEN   formatHorses(1000) est appelé
THEN   le résultat est la chaîne "1K"
```

**SCENARIO F-03 — Nombre entre 1 000 et 999 999**

```
GIVEN  un nombre de 42 500
WHEN   formatHorses(42500) est appelé
THEN   le résultat est la chaîne "42K"
```

**SCENARIO F-04 — Nombre égal à 1 000 000**

```
GIVEN  un nombre égal à 1 000 000
WHEN   formatHorses(1_000_000) est appelé
THEN   le résultat est la chaîne "1M"
```

**SCENARIO F-05 — Nombre entre 1 000 000 et 999 999 999**

```
GIVEN  un nombre de 750 000 000
WHEN   formatHorses(750_000_000) est appelé
THEN   le résultat est la chaîne "750M"
```

**SCENARIO F-06 — Nombre égal à 1 000 000 000**

```
GIVEN  un nombre égal à 1 000 000 000
WHEN   formatHorses(1_000_000_000) est appelé
THEN   le résultat est la chaîne "1MM"
```

**SCENARIO F-07 — Nombre au-delà du milliard**

```
GIVEN  un nombre de 5 200 000 000
WHEN   formatHorses(5_200_000_000) est appelé
THEN   le résultat est la chaîne "5MM"
```

**SCENARIO F-08 — Cas limite : zéro**

```
GIVEN  un nombre égal à 0
WHEN   formatHorses(0) est appelé
THEN   le résultat est la chaîne "0"
```

**SCENARIO F-09 — Cas limite : nombre négatif**

```
GIVEN  un nombre négatif de -500
WHEN   formatHorses(-500) est appelé
THEN   le résultat est la chaîne "-500"
```

**SCENARIO F-10 — Cas limite : virgule flottante sous 1 000**

```
GIVEN  un nombre décimal de 99.7
WHEN   formatHorses(99.7) est appelé
THEN   le résultat est la chaîne "99" (troncature sans arrondi supérieur)
```

**SCENARIO F-11 — Cas limite : NaN**

```
GIVEN  une valeur NaN
WHEN   formatHorses(NaN) est appelé
THEN   une erreur de type TypeError est levée
```

---

## TICKET-02 — `engine/state.js`

### Initialisation et helpers du GameState

---

**SCENARIO S-01 — Création d'un état initial**

```
GIVEN  aucun paramètre fourni
WHEN   createDefaultState() est appelé
THEN   l'état retourné contient :
         horses = 0
         totalHorsesEarned = 0
         clickPower = 1
         autoclickers = []
         upgrades = []
         activeEvent = null
```

**SCENARIO S-02 — Création d'un état pour un utilisateur**

```
GIVEN  un userId de 42
WHEN   createDefaultState(42) est appelé
THEN   l'état retourné a userId = 42
  ET   toutes les autres valeurs sont celles par défaut
```

**SCENARIO S-03 — Sérialisation de l'état**

```
GIVEN  un GameState valide avec horses = 1500
WHEN   serializeState(state) est appelé
THEN   le résultat est une chaîne JSON valide
  ET   JSON.parse(résultat).horses === 1500
```

**SCENARIO S-04 — Désérialisation de l'état**

```
GIVEN  une chaîne JSON valide représentant un GameState
WHEN   deserializeState(json) est appelé
THEN   l'objet retourné est un GameState complet
  ET   toutes les propriétés correspondent aux valeurs sérialisées
```

**SCENARIO S-05 — Désérialisation d'une chaîne invalide**

```
GIVEN  une chaîne JSON malformée
WHEN   deserializeState(json) est appelé
THEN   une erreur de type SyntaxError est levée
```

**SCENARIO S-06 — Fusion d'un état partiel avec les valeurs par défaut**

```
GIVEN  un objet partiel { horses: 500 } (venant d'une ancienne sauvegarde)
WHEN   mergeWithDefaults(partialState) est appelé
THEN   l'état retourné a horses = 500
  ET   les propriétés absentes sont comblées par les valeurs par défaut
```

---

## TICKET-03 — `engine/click.js`

### Logique du clic manuel

---

**SCENARIO CL-01 — Clic de base**

```
GIVEN  un état avec horses = 0 et clickPower = 1
  ET   aucun événement actif
WHEN   processClick(state) est appelé
THEN   l'état retourné a horses = 1
  ET   totalHorsesEarned = 1
```

**SCENARIO CL-02 — Clic avec clickPower élevé**

```
GIVEN  un état avec horses = 100 et clickPower = 50
  ET   aucun événement actif
WHEN   processClick(state) est appelé
THEN   l'état retourné a horses = 150
  ET   totalHorsesEarned augmente de 50
```

**SCENARIO CL-03 — Clic avec événement GOLDEN_TURBO actif**

```
GIVEN  un état avec clickPower = 10
  ET   un événement GOLDEN_TURBO actif avec multiplier = 3
  ET   l'événement n'est pas expiré
WHEN   processClick(state) est appelé
THEN   l'état retourné a horses augmentés de 30 (10 × 3)
```

**SCENARIO CL-04 — Clic avec événement GOLDEN_TURBO expiré**

```
GIVEN  un état avec clickPower = 10
  ET   un événement GOLDEN_TURBO dont expiresAt est dans le passé
WHEN   processClick(state) est appelé
THEN   l'état retourné a horses augmentés de 10 (sans multiplicateur)
  ET   activeEvent est null
```

**SCENARIO CL-05 — Clic sans modifier les autoclickers**

```
GIVEN  un état avec 2 autoclickers actifs
WHEN   processClick(state) est appelé
THEN   les autoclickers sont inchangés dans l'état retourné
```

**SCENARIO CL-06 — Clic avec POLICE_CONTROL actif**

```
GIVEN  un état avec un événement POLICE_CONTROL actif (production = 0)
WHEN   processClick(state) est appelé
THEN   horses n'augmente pas
  ET   totalHorsesEarned reste inchangé
```

**SCENARIO CL-07 — Immutabilité de l'état source**

```
GIVEN  un état source avec horses = 0
WHEN   processClick(state) est appelé
THEN   l'objet state original n'est pas muté
  ET   l'objet retourné est un nouvel objet
```

---

## TICKET-04 — `engine/upgrades.js`

### Paliers, coûts et effets des upgrades

---

**SCENARIO U-01 — Achat d'un upgrade valide**

```
GIVEN  un état avec horses = 10 000
  ET   un upgrade Admission Niv 1 disponible au coût de 500
WHEN   buyUpgrade(state, 'admission', 1) est appelé
THEN   l'état retourné a horses = 9 500
  ET   upgrades contient { categoryId: 'admission', tierId: 1 }
```

**SCENARIO U-02 — Fonds insuffisants**

```
GIVEN  un état avec horses = 100
  ET   un upgrade dont le coût est 500
WHEN   buyUpgrade(state, 'admission', 1) est appelé
THEN   une erreur INSUFFICIENT_FUNDS est levée
  ET   l'état n'est pas modifié
```

**SCENARIO U-03 — Upgrade déjà possédé**

```
GIVEN  un état possédant déjà l'upgrade Admission Niv 1
WHEN   buyUpgrade(state, 'admission', 1) est appelé
THEN   une erreur ALREADY_OWNED est levée
  ET   les horses ne sont pas déduits
```

**SCENARIO U-04 — Palier inexistant**

```
GIVEN  un état valide
WHEN   buyUpgrade(state, 'admission', 999) est appelé (palier inexistant)
THEN   une erreur INVALID_TIER est levée
```

**SCENARIO U-05 — Catégorie inexistante**

```
GIVEN  un état valide
WHEN   buyUpgrade(state, 'turbo', 1) est appelé (catégorie inconnue)
THEN   une erreur INVALID_CATEGORY est levée
```

**SCENARIO U-06 — Effet Admission sur clickPower**

```
GIVEN  un état avec clickPower = 1 et horses suffisants
WHEN   buyUpgrade(state, 'admission', 25) est appelé (Conduit sport ×1.5)
THEN   clickPower de l'état retourné est 1.5
```

**SCENARIO U-07 — Effet Carburant sur cps**

```
GIVEN  un état avec cps de base = 10 et horses suffisants
WHEN   buyUpgrade(state, 'fuel', 50) est appelé (Méthanol ×3)
THEN   le cps calculé par getPassiveCps(state) est 30
```

**SCENARIO U-08 — Effet Échappement sur clickPower**

```
GIVEN  un état avec clickPower = 1 et horses suffisants
WHEN   buyUpgrade(state, 'exhaust', 100) est appelé (Orgue ×10)
THEN   clickPower de l'état retourné est 10
```

**SCENARIO U-09 — Effet Bloc moteur sur cps et affichage**

```
GIVEN  un état avec horses suffisants
WHEN   buyUpgrade(state, 'engine', 50) est appelé (V8)
THEN   le cps est multiplié par 7
  ET   state.engineDisplay === 'V8'
```

**SCENARIO U-10 — Cumul de plusieurs upgrades**

```
GIVEN  un état avec upgrades Admission Niv 25 (×1.5) ET Échappement Niv 25 (×2)
WHEN   getClickPower(state) est appelé
THEN   le clickPower retourné est 1 × 1.5 × 2 = 3
```

**SCENARIO U-11 — getPurchaseCost retourne le bon coût**

```
GIVEN  la définition du catalogue d'upgrades
WHEN   getPurchaseCost('fuel', 100) est appelé
THEN   le coût retourné est un nombre positif correspondant au palier Carburant Niv 100
```

**SCENARIO U-12 — Palier 500 (cas limite max)**

```
GIVEN  un état avec des horses très élevés (1MM+)
WHEN   buyUpgrade(state, 'admission', 500) est appelé (Aspirateur de matière noire ×50)
THEN   l'upgrade est acquis
  ET   clickPower inclut le multiplicateur ×50
```

---

## TICKET-05 — `engine/autoclicker.js`

### Achat, upgrade et calcul CPS des autoclickers

---

**SCENARIO AC-01 — Achat d'un autoclicker**

```
GIVEN  un état avec horses = 5 000 et aucun autoclicker
  ET   le coût d'un autoclicker de base est 1 000
WHEN   buyAutoclicker(state, 'basic') est appelé
THEN   autoclickers contient un nouvel autoclicker { id: 'basic', level: 1, active: true }
  ET   horses = 4 000
```

**SCENARIO AC-02 — Achat d'un autoclicker sans fonds**

```
GIVEN  un état avec horses = 500
  ET   le coût d'un autoclicker est 1 000
WHEN   buyAutoclicker(state, 'basic') est appelé
THEN   une erreur INSUFFICIENT_FUNDS est levée
  ET   autoclickers reste vide
```

**SCENARIO AC-03 — Upgrade d'un autoclicker existant**

```
GIVEN  un état avec un autoclicker { id: 'basic', level: 1 } et horses suffisants
WHEN   upgradeAutoclicker(state, 'basic') est appelé
THEN   l'autoclicker a level = 2
  ET   son cps est supérieur au niveau précédent
```

**SCENARIO AC-04 — Upgrade d'un autoclicker inexistant**

```
GIVEN  un état sans aucun autoclicker 'turbo'
WHEN   upgradeAutoclicker(state, 'turbo') est appelé
THEN   une erreur AUTOCLICKER_NOT_FOUND est levée
```

**SCENARIO AC-05 — Calcul du CPS total sans événement**

```
GIVEN  un état avec 2 autoclickers actifs de cps respectifs 5 et 10
  ET   aucun événement actif
WHEN   getTotalCps(state) est appelé
THEN   le résultat est 15
```

**SCENARIO AC-06 — Calcul du CPS avec événement AUTO_CLICK_FRENZY**

```
GIVEN  un état avec autoclickers totalisant 10 cps
  ET   un événement AUTO_CLICK_FRENZY actif avec multiplier = 2
WHEN   getTotalCps(state) est appelé
THEN   le résultat est 20
```

**SCENARIO AC-07 — CPS avec autoclickers en pause (AUTOCLICKER_PAUSE)**

```
GIVEN  un état avec autoclickers totalisant 10 cps
  ET   un événement AUTOCLICKER_PAUSE actif
WHEN   getTotalCps(state) est appelé
THEN   le résultat est 0
```

**SCENARIO AC-08 — Tick passif**

```
GIVEN  un état avec cps total = 5 et lastTickAt = now - 1000ms
WHEN   applyTick(state, now) est appelé
THEN   horses augmente d'environ 5 (1 seconde × 5 cps)
  ET   lastTickAt est mis à jour à now
```

**SCENARIO AC-09 — Tick sans autoclickers**

```
GIVEN  un état sans autoclicker et lastTickAt = now - 2000ms
WHEN   applyTick(state, now) est appelé
THEN   horses reste inchangé
```

**SCENARIO AC-10 — Coût d'upgrade croissant**

```
GIVEN  un autoclicker au niveau 1 avec costBase = 1 000 et costGrowthRate = 1.15
WHEN   getUpgradeCost(autoclicker) est appelé
THEN   le coût retourné est supérieur à 1 000
  ET   il suit la formule costBase × costGrowthRate^level
```

---

## TICKET-06 — `engine/events.js`

### Déclenchement, expiration et résolution des événements

---

**SCENARIO EV-01 — Déclenchement d'un événement**

```
GIVEN  un état sans événement actif
  ET   une probabilité de déclenchement de 100% (forcé en test)
WHEN   tryTriggerEvent(state, 'GOLDEN_TURBO') est appelé
THEN   activeEvent est { type: 'GOLDEN_TURBO', multiplier: 3, requiresAction: false }
  ET   expiresAt est dans 30 secondes
```

**SCENARIO EV-02 — Pas de déclenchement si événement déjà actif**

```
GIVEN  un état avec un événement GOLDEN_TURBO actif non expiré
WHEN   tryTriggerEvent(state, 'FUEL_SURGE') est appelé
THEN   activeEvent reste GOLDEN_TURBO
  ET   aucun nouvel événement n'est positionné
```

**SCENARIO EV-03 — Vérification d'un événement actif non expiré**

```
GIVEN  un état avec activeEvent.expiresAt = now + 10 000ms
WHEN   isEventActive(state, now) est appelé
THEN   le résultat est true
```

**SCENARIO EV-04 — Vérification d'un événement expiré**

```
GIVEN  un état avec activeEvent.expiresAt = now - 1ms
WHEN   isEventActive(state, now) est appelé
THEN   le résultat est false
```

**SCENARIO EV-05 — Nettoyage d'un événement expiré**

```
GIVEN  un état avec activeEvent.expiresAt dans le passé
WHEN   clearExpiredEvent(state, now) est appelé
THEN   activeEvent est null dans l'état retourné
```

**SCENARIO EV-06 — Résolution d'un événement interactif RADAR_ALERT**

```
GIVEN  un état avec activeEvent = { type: 'RADAR_ALERT', requiresAction: true }
WHEN   resolveEvent(state) est appelé
THEN   activeEvent est null
  ET   le cps reprend sa valeur normale
```

**SCENARIO EV-07 — Résolution impossible sans événement actif**

```
GIVEN  un état avec activeEvent = null
WHEN   resolveEvent(state) est appelé
THEN   une erreur NO_ACTIVE_EVENT est levée
```

**SCENARIO EV-08 — Résolution d'un événement non-interactif**

```
GIVEN  un état avec activeEvent = { type: 'GOLDEN_TURBO', requiresAction: false }
WHEN   resolveEvent(state) est appelé
THEN   une erreur EVENT_NOT_RESOLVABLE est levée
  ET   l'événement reste actif
```

**SCENARIO EV-09 — Effet RADAR_ALERT sur le CPS**

```
GIVEN  un état avec cps total = 100
  ET   un événement RADAR_ALERT actif (multiplier = 0.1)
WHEN   getTotalCps(state) est appelé depuis autoclicker.js
THEN   le résultat est 10
```

**SCENARIO EV-10 — Effet ENGINE_FAILURE sur le CPS**

```
GIVEN  un état avec cps total = 100
  ET   un événement ENGINE_FAILURE actif (multiplier = 0.5)
WHEN   getTotalCps(state) est appelé
THEN   le résultat est 50
```

**SCENARIO EV-11 — Effet POLICE_CONTROL bloque production et clics**

```
GIVEN  un état avec un événement POLICE_CONTROL actif
WHEN   processClick(state) est appelé
  ET   getTotalCps(state) est appelé
THEN   les deux retournent 0 chevaux gagnés
```

**SCENARIO EV-12 — FUEL_SURGE multiplie le CPS**

```
GIVEN  un état avec cps total = 20
  ET   un événement FUEL_SURGE actif (multiplier = 5)
WHEN   getTotalCps(state) est appelé
THEN   le résultat est 100
```

---

## TICKET-07 & 08 — `db/migrations.js` + `db/gameStateRepo.js`

### Base de données SQLite (tests avec DB in-memory)

---

**SCENARIO DB-01 — Création des tables**

```
GIVEN  une base SQLite vierge in-memory
WHEN   runMigrations(db) est appelé
THEN   les tables users et game_states existent
  ET   aucune erreur n'est levée
```

**SCENARIO DB-02 — Idempotence des migrations**

```
GIVEN  une base SQLite avec les tables déjà créées
WHEN   runMigrations(db) est appelé une seconde fois
THEN   aucune erreur n'est levée
  ET   les tables existent toujours
```

**SCENARIO DB-03 — Sauvegarde d'un GameState**

```
GIVEN  un userId = 1 et un GameState valide
WHEN   saveGameState(db, 1, state) est appelé
THEN   un enregistrement est inséré dans game_states
  ET   state_json contient la sérialisation correcte
```

**SCENARIO DB-04 — Chargement d'un GameState existant**

```
GIVEN  un GameState sauvegardé pour userId = 1
WHEN   loadGameState(db, 1) est appelé
THEN   le GameState retourné correspond à l'état sauvegardé
```

**SCENARIO DB-05 — Chargement pour un userId inexistant**

```
GIVEN  aucun enregistrement pour userId = 999
WHEN   loadGameState(db, 999) est appelé
THEN   le résultat est null
```

**SCENARIO DB-06 — Mise à jour d'un GameState existant**

```
GIVEN  un GameState sauvegardé avec horses = 100
  ET   le même userId
WHEN   saveGameState(db, 1, { ...state, horses: 500 }) est appelé
THEN   loadGameState(db, 1) retourne horses = 500
  ET   il n'y a toujours qu'un seul enregistrement pour userId = 1
```

**SCENARIO DB-07 — Suppression d'un GameState**

```
GIVEN  un GameState sauvegardé pour userId = 1
WHEN   deleteGameState(db, 1) est appelé
THEN   loadGameState(db, 1) retourne null
```

**SCENARIO DB-08 — state_json corrompu**

```
GIVEN  un enregistrement game_states avec state_json = "{ invalid json"
WHEN   loadGameState(db, 1) est appelé
THEN   une erreur CORRUPTED_STATE est levée
  ET   le message d'erreur indique userId = 1
```

---

## TICKET-09 — `routes/auth.js`

### Authentification (tests avec supertest)

---

**SCENARIO AUTH-01 — Inscription réussie**

```
GIVEN  aucun compte avec le pseudo "pilote42"
WHEN   POST /auth/register { username: "pilote42", password: "Secure!99" }
THEN   réponse 201 ou redirection 302 vers /
  ET   un enregistrement est créé dans users
  ET   le mot de passe stocké est hashé (≠ "Secure!99")
```

**SCENARIO AUTH-02 — Inscription avec pseudo déjà pris**

```
GIVEN  un compte "pilote42" existant
WHEN   POST /auth/register { username: "pilote42", password: "autre" }
THEN   réponse 409 ou redirection avec message d'erreur USERNAME_TAKEN
  ET   aucun nouvel enregistrement n'est créé
```

**SCENARIO AUTH-03 — Inscription avec champs manquants**

```
GIVEN  aucun compte existant
WHEN   POST /auth/register { username: "" }  (password absent)
THEN   réponse 400
  ET   message d'erreur MISSING_FIELDS
```

**SCENARIO AUTH-04 — Connexion réussie**

```
GIVEN  un compte { username: "pilote42", password: "Secure!99" }
WHEN   POST /auth/login { username: "pilote42", password: "Secure!99" }
THEN   réponse 302 vers /
  ET   un cookie de session est positionné
```

**SCENARIO AUTH-05 — Connexion avec mauvais mot de passe**

```
GIVEN  un compte "pilote42" existant
WHEN   POST /auth/login { username: "pilote42", password: "mauvais" }
THEN   réponse 401 ou redirection avec message INVALID_CREDENTIALS
  ET   aucun cookie de session n'est créé
```

**SCENARIO AUTH-06 — Connexion avec pseudo inconnu**

```
GIVEN  aucun compte avec le pseudo "fantome"
WHEN   POST /auth/login { username: "fantome", password: "n'importe" }
THEN   réponse 401
  ET   message INVALID_CREDENTIALS (même message que mot de passe faux, par sécurité)
```

**SCENARIO AUTH-07 — Déconnexion**

```
GIVEN  un utilisateur connecté avec un cookie de session valide
WHEN   POST /auth/logout
THEN   réponse 302 vers /auth/login
  ET   le cookie de session est invalidé
```

**SCENARIO AUTH-08 — Accès à / sans session**

```
GIVEN  aucune session active
WHEN   GET /
THEN   réponse 302 vers /auth/login
```

---

## TICKET-10 — `routes/game.js`

### Routes du jeu (tests avec supertest)

---

**SCENARIO G-01 — Récupération du state**

```
GIVEN  un utilisateur connecté avec un GameState sauvegardé
WHEN   GET /game/state
THEN   réponse 200 JSON
  ET   le corps contient { horses, clickPower, upgrades, activeEvent }
```

**SCENARIO G-02 — GET /game/state sans session**

```
GIVEN  aucune session active
WHEN   GET /game/state
THEN   réponse 401
```

**SCENARIO G-03 — Clic normal**

```
GIVEN  un utilisateur connecté avec horses = 0 et clickPower = 1
WHEN   POST /game/click
THEN   réponse 200 JSON { horses: 1, clickPower: 1 }
  ET   le GameState est persisté en base
```

**SCENARIO G-04 — Clic rapide successif (idempotence)**

```
GIVEN  un utilisateur connecté
WHEN   POST /game/click est appelé 5 fois en séquence
THEN   horses augmente exactement de 5 × clickPower
  ET   aucune course critique ne corrompt l'état
```

**SCENARIO G-05 — Achat d'un upgrade valide**

```
GIVEN  un utilisateur avec horses = 10 000
WHEN   POST /game/upgrade { categoryId: "admission", tierId: 1 }
THEN   réponse 200 JSON avec l'état mis à jour
  ET   horses est réduit du coût de l'upgrade
  ET   upgrades contient le nouvel upgrade
```

**SCENARIO G-06 — Achat d'un upgrade sans fonds**

```
GIVEN  un utilisateur avec horses = 10
WHEN   POST /game/upgrade { categoryId: "admission", tierId: 25 } (coût > 10)
THEN   réponse 400 { error: "INSUFFICIENT_FUNDS" }
  ET   l'état en base n'est pas modifié
```

**SCENARIO G-07 — Achat d'un autoclicker**

```
GIVEN  un utilisateur avec horses suffisants
WHEN   POST /game/autoclicker/buy { autoclickerId: "basic" }
THEN   réponse 200 JSON
  ET   autoclickers contient le nouvel autoclicker
```

**SCENARIO G-08 — Upgrade d'un autoclicker**

```
GIVEN  un utilisateur avec un autoclicker 'basic' niveau 1 et horses suffisants
WHEN   POST /game/autoclicker/upgrade { autoclickerId: "basic" }
THEN   réponse 200
  ET   autoclicker.level = 2
```

**SCENARIO G-09 — Résolution d'un événement interactif**

```
GIVEN  un utilisateur avec activeEvent = { type: "RADAR_ALERT", requiresAction: true }
WHEN   POST /game/event/resolve
THEN   réponse 200
  ET   activeEvent = null dans l'état retourné
```

**SCENARIO G-10 — Résolution sans événement actif**

```
GIVEN  un utilisateur avec activeEvent = null
WHEN   POST /game/event/resolve
THEN   réponse 400 { error: "NO_ACTIVE_EVENT" }
```

**SCENARIO G-11 — Tick passif**

```
GIVEN  un utilisateur avec 1 autoclicker générant 10 cps
  ET   lastTickAt = now - 1 000ms
WHEN   POST /game/tick { now }
THEN   réponse 200
  ET   horses augmenté d'environ 10
```

**SCENARIO G-12 — Body malformé**

```
GIVEN  un utilisateur connecté
WHEN   POST /game/upgrade avec un body non-JSON
THEN   réponse 400
```

---

## TICKET-12 — Tests E2E Playwright

### Parcours utilisateur complets (navigateur headless)

---

### Authentification

**SCENARIO E2E-AUTH-01 — Inscription complète**

```
GIVEN  l'application est démarrée en mode test
  ET   la base est vierge
WHEN   l'utilisateur navigue vers /auth/register
  ET   saisit le pseudo "pilote_e2e" et un mot de passe
  ET   soumet le formulaire
THEN   il est redirigé vers la page de jeu /
  ET   son pseudo est affiché dans le HUD
```

**SCENARIO E2E-AUTH-02 — Connexion et persistance de session**

```
GIVEN  un compte "pilote_e2e" existant
WHEN   l'utilisateur se connecte via /auth/login
THEN   il accède à la page du jeu
  ET   un cookie de session est présent dans le navigateur
```

**SCENARIO E2E-AUTH-03 — Formulaire de connexion en erreur**

```
GIVEN  la page /auth/login est affichée
WHEN   l'utilisateur saisit un mauvais mot de passe et soumet
THEN   un message d'erreur est visible dans la page
  ET   l'URL reste /auth/login
```

**SCENARIO E2E-AUTH-04 — Accès direct au jeu sans compte**

```
GIVEN  aucune session active
WHEN   l'utilisateur tente de naviguer directement vers /
THEN   il est redirigé vers /auth/login
```

---

### Mécanique de clic

**SCENARIO E2E-CL-01 — Clic sur le bouton principal**

```
GIVEN  l'utilisateur est connecté et sur la page de jeu
  ET   horses = 0
WHEN   l'utilisateur clique 3 fois sur le bouton principal
THEN   le compteur de chevaux affiche 3
```

**SCENARIO E2E-CL-02 — Passage au format K**

```
GIVEN  l'utilisateur est connecté
  ET   un seed de test positionne horses = 999
WHEN   l'utilisateur clique une fois (clickPower = 1)
THEN   le compteur affiche "1K"
```

**SCENARIO E2E-CL-03 — Passage au format M**

```
GIVEN  un seed positionne horses = 999 999
WHEN   l'utilisateur clique une fois
THEN   le compteur affiche "1M"
```

**SCENARIO E2E-CL-04 — Indicateur de puissance par clic**

```
GIVEN  l'utilisateur vient d'acheter l'upgrade Admission Niv 25 (×1.5)
WHEN   il observe le HUD
THEN   l'indicateur "Puissance par clic" affiche 1.5
```

---

### Upgrades

**SCENARIO E2E-UP-01 — Bouton upgrade grisé sans fonds**

```
GIVEN  l'utilisateur est connecté avec horses = 0
WHEN   il consulte la liste des upgrades
THEN   tous les boutons d'achat sont désactivés (attribut disabled ou classe grisée)
```

**SCENARIO E2E-UP-02 — Achat d'un upgrade Admission**

```
GIVEN  un seed positionne horses = 50 000
WHEN   l'utilisateur achète l'upgrade Admission Niv 1
THEN   le solde de chevaux diminue du coût affiché
  ET   l'upgrade apparaît comme "possédé" dans l'UI
  ET   l'indicateur clickPower est mis à jour
```

**SCENARIO E2E-UP-03 — Affichage type de moteur**

```
GIVEN  un seed positionne horses suffisants
WHEN   l'utilisateur achète l'upgrade Bloc moteur Niv 25 (4 cylindres en ligne)
THEN   le HUD affiche "4-cyl"
WHEN   il achète ensuite le Niv 50 (V8)
THEN   le HUD affiche "V8"
```

**SCENARIO E2E-UP-04 — Upgrade ne peut pas être acheté deux fois**

```
GIVEN  l'utilisateur possède déjà l'upgrade Admission Niv 1
WHEN   il tente de cliquer à nouveau sur ce bouton
THEN   le bouton est absent ou désactivé
  ET   les horses ne changent pas
```

---

### Événements

**SCENARIO E2E-EV-01 — Apparition d'une bannière GOLDEN_TURBO**

```
GIVEN  l'utilisateur est connecté
  ET   un seed déclenche l'événement GOLDEN_TURBO immédiatement
WHEN   la page de jeu est affichée
THEN   une bannière "GOLDEN TURBO" est visible
  ET   un compte à rebours est affiché
```

**SCENARIO E2E-EV-02 — Disparition automatique d'un événement**

```
GIVEN  un événement GOLDEN_TURBO actif avec durée = 2s (forcé en test)
WHEN   2 secondes s'écoulent
THEN   la bannière disparaît automatiquement
  ET   aucun multiplicateur n'est plus appliqué
```

**SCENARIO E2E-EV-03 — RADAR_ALERT requiert une action**

```
GIVEN  un seed déclenche l'événement RADAR_ALERT
WHEN   la page de jeu est affichée
THEN   un bouton/icône "Freiner" est visible et cliquable
WHEN   l'utilisateur clique sur "Freiner"
THEN   l'alerte disparaît
  ET   la production reprend normalement
```

**SCENARIO E2E-EV-04 — RADAR_ALERT sans action réduit la production**

```
GIVEN  un événement RADAR_ALERT actif
  ET   cps de base = 100
WHEN   l'utilisateur attend sans cliquer sur l'alerte
THEN   le gain passif de chevaux est réduit à 10% (≈ 10/s)
```

**SCENARIO E2E-EV-05 — POLICE_CONTROL bloque tout**

```
GIVEN  un seed déclenche l'événement POLICE_CONTROL
WHEN   l'utilisateur clique sur le bouton principal
  ET   attend le tick passif
THEN   les horses n'augmentent pas
  ET   une bannière "Contrôle de police" est visible avec un bouton de résolution
WHEN   l'utilisateur résout l'événement
THEN   la production reprend
```

---

### Persistance

**SCENARIO E2E-PERSIST-01 — Sauvegarde et rechargement**

```
GIVEN  l'utilisateur est connecté et a horses = 5 000
WHEN   il recharge la page (F5)
THEN   horses affiche toujours 5 000
  ET   les upgrades possédées sont toujours présentes
```

**SCENARIO E2E-PERSIST-02 — Déconnexion / reconnexion**

```
GIVEN  l'utilisateur a horses = 12 000 et possède 2 upgrades
WHEN   il se déconnecte puis se reconnecte
THEN   horses = 12 000
  ET   les 2 upgrades sont toujours possédées
```

---

## Récapitulatif des scénarios

| Module                    | Nb scénarios |
| ------------------------- | ------------ |
| `engine/format.js`        | 11           |
| `engine/state.js`         | 6            |
| `engine/click.js`         | 7            |
| `engine/upgrades.js`      | 12           |
| `engine/autoclicker.js`   | 10           |
| `engine/events.js`        | 12           |
| `db/` (migrations + repo) | 8            |
| `routes/auth.js`          | 8            |
| `routes/game.js`          | 12           |
| **E2E Playwright**        | 16           |
| **TOTAL**                 | **102**      |

---

## Conventions de rédaction des tests

```js
// Structure type pour chaque scénario
describe("[Module] — [Comportement testé]", () => {
  // GIVEN : setup dans beforeEach ou en ligne
  beforeEach(() => {
    /* état initial */
  });

  it("[SCENARIO XX] — description du cas", () => {
    // GIVEN
    const state = createDefaultState();

    // WHEN
    const result = fonctionTestee(state, ...args);

    // THEN
    expect(result.xxx).toBe(valeurAttendue);
  });
});
```

> **Règle** : un scénario = un seul `expect` principal.  
> Les `expect` secondaires (assertions de non-mutation, etc.) sont autorisés mais pas prioritaires.

---

_Dernière mise à jour : mai 2026_
