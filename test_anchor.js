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

const letterPoints = { 'A': 1, 'L': 1, 'O': 1 };
const boardLayout = Array(15).fill(0).map(() => Array(15).fill(0));
boardLayout[7][7] = 5;

// Re-read solver logic dynamically to get latest version
const solverLogic = fs.readFileSync('solver.js', 'utf8');

const trie = new Trie();
const dictionary = new Set(['ALO', 'LA', 'AL']);
trie.insert('ALO');
trie.insert('LA');
trie.insert('AL');

// SETUP BOARD with ONE letter at 7,7 ('L')
const boardState = Array(15).fill(null).map(() => Array(15).fill({ letter: null }));
boardState[7][7] = { letter: 'L', points: 1 };

let solverCodeToExecute = solverLogic + `
const solver = new Solver(boardLayout, letterPoints);
solver.trie = trie;
solver.dictionary = dictionary;
solver.isReady = true;

console.log('--- TEST: Board with L at 7,7 ---');
console.log('Testing word "ALO" from rack A, O. Are there any floating words?');
console.log('Starting solver...');
const res = solver.findBestMoves(['A', 'O'], boardState);
console.log('Solver finished.');

let validCount = 0;
let floatingCount = 0;
res.forEach(r => {
    // Check if the word touches 7,7
    let touchesA = false;
    for(let i=0; i<r.word.length; i++) {
        let R = r.dir === 'H' ? r.r : r.r + i;
        let C = r.dir === 'H' ? r.c + i : r.c;
        if(R === 7 && C === 7) touchesA = true;
        // Or if it's adjacent to 7,7
        if ((Math.abs(R - 7) === 1 && C === 7) || (R === 7 && Math.abs(C - 7) === 1)) {
           touchesA = true;
        }
    }
    if (touchesA) {
        validCount++;
    } else {
        floatingCount++;
        console.log("FLOATING WORD:", r);
    }
});

console.log("Total moves:", res.length);
console.log("Valid moves:", validCount);
console.log("Floating moves:", floatingCount);
`;

eval(solverCodeToExecute);
