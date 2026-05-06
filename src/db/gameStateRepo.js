function createCorruptedStateError(userId) {
  const error = new Error(`Corrupted game state for userId=${userId}`);
  error.code = "CORRUPTED_STATE";
  return error;
}

function saveGameState(db, userId, state) {
  const stateJson = JSON.stringify(state);

  db.prepare(
    `
      INSERT INTO game_states (user_id, state_json, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id)
      DO UPDATE SET
        state_json = excluded.state_json,
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run(userId, stateJson);
}

function loadGameState(db, userId) {
  const row = db
    .prepare("SELECT state_json FROM game_states WHERE user_id = ?")
    .get(userId);

  if (!row) {
    return null;
  }

  try {
    return JSON.parse(row.state_json);
  } catch {
    throw createCorruptedStateError(userId);
  }
}

function deleteGameState(db, userId) {
  db.prepare("DELETE FROM game_states WHERE user_id = ?").run(userId);
}

module.exports = {
  deleteGameState,
  loadGameState,
  saveGameState,
};
