---
name: Feature request
about: Suggest an idea for this project
title: ""
labels: enhancement
assignees: ""
---

**Title:** Système d'upgrades motorisés, événements et automatisation (extrait du schéma)

---

**Description :**  
Pack de mécaniques de progression inspiré du schéma visuel fourni : système d'upgrades par catégories (admission d'air, carburant, échappement, bloc moteur), autoclickers/automatisation, événements temporaires (bonus/malus) et indicateurs UI. Chaque catégorie comprend des paliers (Niv 1 → Niv 500) avec des effets croissants sur la production et la puissance au clic.

**Problème résolu :**  
Manque de profondeur et de variété dans la progression du joueur. Ce système apporte des paliers clairs, des choix tactiques (investir dans poids, carburant ou puissance), et des événements aléatoires qui dynamisent le gameplay.

---

**Solution proposée :**

- Implémenter 4 grandes familles d'upgrades avec paliers : Admission d'air, Carburant/Injection, Échappement, Bloc moteur/Cylindres. Chaque palier modifie la puissance par clic et/ou la production passive.
- Ajouter des autoclickers achetables et upgradables (efficacité, coût, pauses), permettant d'automatiser la production.
- Ajouter un système d'événements/"triggers" (ex. "Golden Turbo") qui accordent des bonus temporaires (multiplicateurs, autoclick bonus) ou des malus (réduction de production, pause d'autoclickers). Inclure des alertes interactives (ex. "Alerte Radar") requérant une action du joueur.
- Fournir UI/indicateurs : durée des bonus/malus, puissance par clic, type/nbre de cylindres, voyants (ex. voyant moteur), et interactions spéciales (contrôle de police).

---

**Exemples ou maquettes :**  
Le schéma d'origine (image jointe) décrit les paliers et idées complémentaires — voir la section "Features extraites de l'image" plus bas dans ce fichier pour la transcription complète.

---

**Priorité :** Haute

---

**Informations supplémentaires :**

- Possibilité de décomposer en tickets par famille d'upgrades (Admission, Carburant, Échappement, Bloc moteur), puis un ticket pour autoclickers et un pour le système d'événements.
- Option : fournir un export JSON/CSV listant chaque upgrade (id, nom, palier, effet, valeur) pour import facile dans le jeu.
- Prochaine étape recommandée : définir coûts/valeurs pour chaque palier et créer les assets UI correspondants.

---

- **Upgrades (systèmes)** : catégories d'améliorations débloquées par niveau.
  - Admission d'air / Filtre :
    - Niv 1 : Filtre en papier usé
    - Niv 25 : Conduit sport (bruit)
    - Niv 50 : Entrée d'air sur le capot (compressor)
    - Niv 100 : Aspirateur industriel (bricolé)
    - Niv 250 : Turbine (type avion)
    - Niv 500 : Aspirateur de matière noire (spatial)

  - Carburant / Injection :
    - Niv 1 : Sans Plomb 95 (dilué)
    - Niv 25 : Sans Plomb 98
    - Niv 50 : Méthanol 85
    - Niv 100 : Carburant de fusée
    - Niv 250 : Plutonium enrichi
    - Niv 500 : Jus de dinosaure concentré x200

  - Échappement (gain de puissance) :
    - Niv 1 : Pot percé (Twingo)
    - Niv 25 : Ligne complète inox "Full Tube"
    - Niv 50 : Lance‑flammes intégré
    - Niv 100 : Orgue/ensemble cracheur de feu
    - Niv 250 : Trompette surpuissante
    - Niv 500 : Propulseur de navette spatiale

  - Bloc moteur / Cylindres :
    - Niv 1 : Moteur de tondeuse (monocylindre)
    - Niv 25 : 4 cylindres en ligne
    - Niv 50 : Moteur V8 américain
    - Niv 100 : V10 (ex. Bugatti)
    - Niv 250 : V12 (énorme, prend la moitié de la voiture)
    - Niv 500 : Réacteur/rotor expérimental

- **Autoclickers / Automatisation** : achetables pour générer des clics automatiquement; moddable par efficacité, coût et pauses. Améliorations qui augmentent l'efficacité des autoclickers.

- **Événements & Triggers** :
  - "Trigger Golden Turbo" : événement déclencheur pour bonus temporaires.
  - Bonus aléatoires : auto‑click bonus, multiplicateur de clics (ex. x3), bonus de durée.
  - Malus aléatoires : réductions de production (-50%...), pause des autoclickers, autres pénalités temporaires.
  - Alerte Radar (idée) : événement négatif aléatoire réduisant la production si le joueur ne clique pas sur une icône pour "freiner".

- **UI / Indicateurs** :
  - Affichage durée des bonus/malus
  - Indicateur de puissance de clic (puissance par clic)
  - Affichage du nombre de cylindres / type de moteur
  - Voyant moteur et contrôles (ex. présence d'un "voyant moteur")
  - Contrôle de police : événement/interaction

- **Mécaniques économiques** :
  - Réductions de coût (ex. baisse du prix de l'essence via upgrades)
  - Multiplicateurs de clics liés à la réduction de poids ou autres stats

- **Idées additionnelles** :
  - Autopilote / pilote automatique
  - Modes spéciaux / skins d'amélioration
  - Effets visuels et direction artistique pour chaque palier
