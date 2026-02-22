const fs = require('fs');

class TrieNode {
    constructor() {
        this.children = {};
        this.isWord = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }
    insert(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
        }
        node.isWord = true;
    }
}

const boardLayout = Array(15).fill(0).map(() => Array(15).fill(0));
boardLayout[7][7] = 5;

const letterPoints = { 'C': 3, 'A': 1, 'S': 1, 'I': 1 };
const text = fs.readFileSync('diccionario.txt', 'utf8');
const words = text.split('\n')
    .map(w => w.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    .filter(w => w.length >= 2 && /^[A-ZÑ]+$/.test(w));

const trie = new Trie();
const dictionary = new Set();
for (let word of words) {
    dictionary.add(word);
    trie.insert(word);
}

// Emuler estado después de Aplicar 'CASIA'
const boardState = Array(15).fill(null).map(() => Array(15).fill({ letter: null }));

// MOCK: Aplicar CASIA en fila 8, col 4 a 8 (índices 7, 3-7)
boardState[7][3] = { letter: 'C', points: 3 };
boardState[7][4] = { letter: 'A', points: 1 };
boardState[7][5] = { letter: 'S', points: 1 };
boardState[7][6] = { letter: 'I', points: 1 };
boardState[7][7] = { letter: 'A', points: 1 };

const solverLogic = fs.readFileSync('solver.js', 'utf8');
eval(solverLogic + "\n\nconst solver = new Solver(boardLayout, letterPoints);\nsolver.trie = trie;\nsolver.dictionary = dictionary;\nsolver.isReady = true;\nconsole.log('Starting findBestMoves with CASIA on board... rack: [A, B, C]');\nconst t0 = Date.now();\nconst results = solver.findBestMoves(['A','B','C'], boardState);\nconsole.log('Finished in ' + (Date.now()-t0) + 'ms');\nconsole.log('Found ' + results.length + ' moves');\n");
