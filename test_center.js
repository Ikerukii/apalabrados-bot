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

// SETUP BOARD (EMPTY)
const boardState = Array(15).fill(null).map(() => Array(15).fill({ letter: null }));

let solverCodeToExecute = solverLogic + `
const solver = new Solver(boardLayout, letterPoints);
solver.trie = trie;
solver.dictionary = dictionary;
solver.isReady = true;

console.log('--- TEST: Empty board ---');
console.log('Testing word "ALO" from rack A, L, O.');
const res = solver.findBestMoves(['A', 'L', 'O'], boardState);

let doesNotTouchCenterCount = 0;
res.forEach(r => {
    let touchesCenter = false;
    for(let i=0; i<r.word.length; i++) {
        let R = r.dir === 'H' ? r.r : r.r + i;
        let C = r.dir === 'H' ? r.c + i : r.c;
        if(R === 7 && C === 7) touchesCenter = true;
    }
    if (!touchesCenter) {
        doesNotTouchCenterCount++;
        console.log("NOT CENTER WORD:", r);
    }
});

console.log("Total moves:", res.length);
console.log("Moves not touching center:", doesNotTouchCenterCount);
`;

eval(solverCodeToExecute);
