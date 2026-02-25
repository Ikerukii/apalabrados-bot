const fs = require('fs');
let code = fs.readFileSync('solver.js', 'utf8');
if (!code.includes('module.exports')) {
    code += "\nmodule.exports = { Solver, Trie };\n";
    fs.writeFileSync('solver_node.js', code);
}
const { Solver } = require('./solver_node.js');

const letterPoints = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
    'L': 1, 'M': 3, 'N': 1, 'Ñ': 8, 'O': 1, 'P': 3, 'Q': 5, 'R': 1, 'S': 1, 'T': 1,
    'U': 1, 'V': 4, 'X': 8, 'Y': 4, 'Z': 10
};

const boardLayout = [
    [0, 0, 4, 0, 2, 0, 0, 0, 0, 0, 2, 0, 4, 0, 0],
    [0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 2, 0],
    [4, 0, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 0, 4],
    [0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0],
    [2, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 2],
    [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
    [0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0],
    [0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0],
    [0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0],
    [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
    [2, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 2],
    [0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0],
    [4, 0, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 0, 4],
    [0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 2, 0],
    [0, 0, 4, 0, 2, 0, 0, 0, 0, 0, 2, 0, 4, 0, 0]
];

async function run() {
    const s = new Solver(boardLayout, letterPoints);

    // Fake the dictionary for this test to avoid HTTP fetch in node
    s.trie = {
        root: { children: {} },
        insert: function (word) {
            let node = this.root;
            for (let char of word) {
                if (!node.children[char]) node.children[char] = { children: {}, isWord: false };
                node = node.children[char];
            }
            node.isWord = true;
        }
    };
    s.dictionary = new Set();
    s.dictionary.add("PERFECT");
    s.trie.insert("PERFECT");

    // Crear un tablero vacío
    let board = Array(15).fill(null).map(() => Array(15).fill(null));
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            board[r][c] = { letter: '', points: 0, isWildcard: false };
        }
    }

    console.log("Evaluando un pleno formado íntegramente de comodines usando la palabra PERFECT (7 letras) que pasa por la estrella.");

    // Vamos a simular que el solver ha encontrado y colocado "PERFECT" en horizontal sobre el centro
    // La fila 7 es el centro, las celdas van de la 4 a la 10. La 7,7 es DP (Estrella).
    let word = "PERFECT";
    let placedTiles = [];
    for (let i = 0; i < 7; i++) {
        placedTiles.push({ col: 4 + i, char: word[i], isWildcard: true });
    }

    let score = s.calculatePlayScore(7, 4, word, placedTiles, board, 'H');
    console.log(`Evaluado "PERFECT" con comodines puramente. Score: ${score}`);
    if (score === 40) {
        console.log("SUCCESS: Pleno bonus de 40 puntos aplicados perfectamente, letras multiplicadas por 0 sumaron 0.");
    } else {
        console.error("FAIL: Se detectó un valor inesperado en palabras formadas enteramente por *");
    }
}

run();
