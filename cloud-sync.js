// cloud-sync.js
// Usa el SDK "compat" inyectado globalmente en index.html por los CDN de Firebase v8.

// 1. Anula por completo el guardado del estado del tablero
window.saveBoardToCloud = async () => { };

window.loadBoardFromCloud = async () => null;

// 2. Guarda únicamente la palabra jugada
window.logPlayToCloud = async (uid, move) => move?.word && firebase.firestore().collection("history").add({ word: move.word.toUpperCase() });
