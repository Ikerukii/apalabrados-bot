const fs = require('fs');
let code = fs.readFileSync('solver.js', 'utf8');
code += "\nmodule.exports = Solver;\n";
fs.writeFileSync('solver_node.js', code);
const Solver = require('./solver_node.js');

const letterPoints = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
    'L': 1, 'M': 3, 'N': 1, 'Ñ': 8, 'O': 1, 'P': 3, 'Q': 5, 'R': 1, 'S': 1, 'T': 1,
    'U': 1, 'V': 4, 'X': 8, 'Y': 4, 'Z': 10
};

const solver = new Solver(null, letterPoints);
const board = Array(15).fill(null).map(() => Array(15).fill(null).map(() => ({ letter: null, points: 0 })));

// Place D(2) at Row 2, Col 14
board[2][14] = { letter: 'D', points: 2 };
board[3][14] = { letter: 'A', points: 1 };
board[4][14] = { letter: 'H', points: 4 };
board[5][14] = { letter: 'I', points: 1 };
board[6][14] = { letter: 'R', points: 1 };

let boardT = solver.transposeBoard(board);

let placedTilesV = [
    { col: 3, isWildcard: false }, // A
    { col: 4, isWildcard: false }, // H
    { col: 5, isWildcard: false }, // I
    { col: 6, isWildcard: false }  // R
];

// Calculate score for "DAHIR" vertical at Col 14, starting Row 2
let scoreV = solver.calculatePlayScore(14, 2, "DAHIR", placedTilesV, boardT, 'V');
console.log("DAHIR Vertical score:", scoreV);
