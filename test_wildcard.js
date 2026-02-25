const { Solver, Trie } = require('./solver');

async function run() {
    const s = new Solver();
    await s.init();
    
    // Crear un tablero vacío
    let board = Array(15).fill(null).map(() => Array(15).fill(null));
    for (let r=0; r<15; r++) {
        for (let c=0; c<15; c++) {
            board[r][c] = { letter: '', points: 0, isWildcard: false };
        }
    }
    
    console.log("Evaluando un atril con 7 comodines ('*'):");
    let rack = ['*', '*', '*', '*', '*', '*', '*'];
    
    const moves = await s.findBestMoves(rack, board);
    if(moves.length > 0) {
        console.log("Top move:", moves[0]);
        // Validar si el puntaje corresponde EXCLUSIVAMENTE al bono de pleno (+40 pts)
        // O si las letras de comodín sumaron valor erróneamente de cruce.
    } else {
        console.log("No valid moves found (this shouldn't happen if dictionary is valid)");
    }
}
run();
