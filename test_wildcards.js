const { Solver } = require('./solver.js');

async function testWildcards() {
    const s = new Solver();
    await s.init();

    // Crear tablero vacío
    let board = Array(15).fill(null).map(() => Array(15).fill(null));
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            board[r][c] = { letter: '', points: 0, isWildcard: false };
        }
    }

    // Atril con 7 asteriscos
    let rack = ['*', '*', '*', '*', '*', '*', '*'];

    const moves = await s.findBestMoves(rack, board);
    if (moves.length > 0) {
        console.log("Top move:", moves[0]);
        if (moves[0].score === 40) {
            console.log("SUCCESS: Pleno bonus de 40 puntos y las letras valieron 0 adecuadamente.");
        } else {
            console.error("FAIL: La puntuación fue " + moves[0].score + " en lugar de 40.");
        }
    } else {
        console.log("No valid moves found. (Este test requiere acceso al diccionario local)");
    }
}
testWildcards();
