/**
 * engine/click.js
 * Logique du clic manuel du jeu
 */

/**
 * Vérifie si un événement est expiré
 * @param {object|null} event - L'événement à vérifier
 * @returns {boolean} true si l'événement est expiré
 */
function isEventExpired(event) {
  if (!event) {return false;}
  return event.expiresAt < Date.now();
}

/**
 * Traite un clic et retourne le nouvel état
 * - Ajoute clickPower aux chevaux
 * - Applique le multiplicateur d'événement GOLDEN_TURBO s'il est actif
 * - Gère les événements spéciaux (POLICE_CONTROL, etc.)
 * - Retourne un nouvel objet (immutable)
 *
 * @param {object} state - Le GameState courant
 * @returns {object} Un nouvel état avec le clic appliqué
 */
export function processClick(state) {
  // Copie l'état pour immutabilité
  let newState = { ...state };

  // Vérifier et nettoyer les événements expirés
  if (newState.activeEvent && isEventExpired(newState.activeEvent)) {
    newState.activeEvent = null;
  }

  // Calculer les chevaux gagnés
  let horsesGained = newState.clickPower;

  // Appliquer le multiplicateur d'événement s'il y en a un
  if (newState.activeEvent) {
    // POLICE_CONTROL bloque la production (multiplier = 0)
    if (newState.activeEvent.type === "POLICE_CONTROL") {
      horsesGained = 0;
    } else {
      // Autres événements (GOLDEN_TURBO, etc.)
      horsesGained = newState.clickPower * newState.activeEvent.multiplier;
    }
  }

  // Augmenter les chevaux et les chevaux totaux gagnés
  newState.horses += horsesGained;
  newState.totalHorsesEarned += horsesGained;

  return newState;
}
