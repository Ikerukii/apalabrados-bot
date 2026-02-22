const fs = require('fs');
const solverLogic = fs.readFileSync('solver.js', 'utf8');

class TrieNode { constructor() { this.children = {}; this.isWord = false; } }
class Trie {
    constructor() { this.root = new TrieNode(); }
    insert(word) { let node = this.root; for (let char of word) { if (!node.children[char]) node.children[char] = new TrieNode(); node = node.children[char]; } node.isWord = true; }
}

const letterPoints = { 'A': 1, 'L': 1, 'O': 1 };
const boardLayout = Array(15).fill(0).map(() => Array(15).fill(0));
boardLayout[7][7] = 5;

const trie = new Trie();
const dictionary = new Set(['ALO', 'LA', 'AL']);
['ALO', 'LA', 'AL'].forEach(w => trie.insert(w));

const boardState = Array(15).fill(null).map(() => Array(15).fill({ letter: null }));
// L at 7,7
boardState[7][7] = { letter: 'L', points: 1 };
// A disconnected O somewhere else
boardState[2][2] = { letter: 'O', points: 1 };

let solverCodeToExecute = solverLogic + `
const solver = new Solver(boardLayout, letterPoints);
solver.trie = trie;
solver.dictionary = dictionary;
solver.isReady = true;

console.log('--- TEST: Board with disconnected blocks (L at 7,7 and O at 2,2) ---');
console.log('Testing word "ALO" from rack A, L, O.');
const res = solver.findBestMoves(['A', 'L', 'O'], boardState);

let floatingCount = 0;
res.forEach(r => {
    // Check if the word touches any existing tile
    let touchesTile = false;
    for(let i=0; i<r.word.length; i++) {
        let R = r.dir === 'H' ? r.r : r.r + i;
        let C = r.dir === 'H' ? r.c + i : r.c;
        if ((Math.abs(R - 7) <= 1 && Math.abs(C - 7) <= 1 && (R===7 || C===7)) || 
            (Math.abs(R - 2) <= 1 && Math.abs(C - 2) <= 1 && (R===2 || C===2))) {
           touchesTile = true;
        }
    }
    if (!touchesTile) {
        floatingCount++;
        console.log("FLOATING WORD ACCEPTED:", r);
    }
});

console.log("Total moves:", res.length);
console.log("Floating moves:", floatingCount);
`;
eval(solverCodeToExecute);
