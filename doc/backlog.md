# Backlog de refonte UI / gameplay

Ce document regroupe les changements a effectuer pour corriger les bugs visibles et retravailler les systemes deja en place.

## Priorite haute

- [ ] Repenser le systeme d'upgrades pour que les 4 categories visibles correspondent a de vrais paliers evolutifs.
- [ ] Faire evoluer le nom et l'apparence de la piece installee a chaque palier atteint, comme sur la reference image.
- [ ] Rendre chaque categorie d'upgrade progressive, avec plusieurs niveaux qui changent le contenu affiche dans l'interface.
- [ ] Faire en sorte que le cout des upgrades augmente selon le niveau de la categorie.
- [ ] Comparer le solde du joueur au cout des upgrades en temps reel, sans attendre un rafraichissement complet de la page.
- [ ] Corriger le fait que l'achat d'upgrade ne modifie actuellement ni la puissance de clic ni les chevaux par seconde.

## Interface utilisateur

- [ ] Retravailler la barre superieure pour qu'elle affiche clairement les bonnes informations de jeu.
- [ ] Revoir la hierarchy visuelle de la HUD : solde, puissance de clic, production passive et progression doivent etre plus lisibles.
- [ ] Uniformiser l'esthetique de la zone d'upgrades pour qu'elle soit plus propre et plus intuitive.

## Visuels des upgrades

- [ ] Ajouter un placeholder d'image pour chacune des 4 categories d'upgrades.
- [ ] Prevoir un changement d'image selon le palier achete, afin de brancher facilement les futures illustrations.
- [ ] Laisser un systeme simple a renommer plus tard, pour que les images se chargent automatiquement au bon endroit.
- [ ] Ajouter egalement des upgrades permanentes sans niveaux, avec leurs propres placeholders d'image.

## Ajustements fonctionnels a verifier

- [ ] S'assurer que chaque upgrade achete est bien persistant apres rechargement.
- [ ] Verifier que l'affichage de la piece installee correspond toujours au dernier palier atteint.
- [ ] Garder une separation claire entre upgrades a niveaux et upgrades permanentes.
- [ ] Valider que l'interface se met a jour immediatement apres achat ou changement de ressources.

## Definition de termine

- [ ] Les 4 categories affichent une progression lisible de niveau en niveau.
- [ ] Les couts augmentent correctement et sont pris en compte instantanement.
- [ ] La barre du haut affiche les informations essentielles sans confusion.
- [ ] Les placeholders d'images sont en place pour chaque famille d'upgrade.
- [ ] Les upgrades permanentes sont disponibles dans la meme logique generale.
