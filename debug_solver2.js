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
boardLayout[7][7] = 5; // Star

const letterPoints = { 'M': 3, 'U': 1, 'R': 1, 'C': 3, 'I': 1, 'E': 1, 'L': 1, 'O': 1, 'A': 1, 'H': 4 };

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

// SIMULATE NON-EMPTY BOARD
const boardState = Array(15).fill(null).map(() => Array(15).fill({ letter: null }));

// Let's place "HOLA" in the middle to simulate a game in progress
boardState[7][5] = { letter: 'H', points: 4 };
boardState[7][6] = { letter: 'O', points: 1 };
boardState[7][7] = { letter: 'L', points: 1 };
boardState[7][8] = { letter: 'A', points: 1 };

const solverLogic = fs.readFileSync('solver.js', 'utf8');
eval(solverLogic + "\n\nconst solver = new Solver(boardLayout, letterPoints);\nsolver.trie = trie;\nsolver.dictionary = dictionary;\nsolver.isReady = true;\nconsole.log('Starting findBestMoves with HOLA on board...');\nconst t0 = Date.now();\nconst results = solver.findBestMoves(['M','U','R','C','I','E','L'], boardState);\nconsole.log('Finished in ' + (Date.now()-t0) + 'ms');\nconsole.log('Found ' + results.length + ' moves');\n");
