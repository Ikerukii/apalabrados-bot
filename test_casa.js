const fs = require('fs');
const solverLogic = fs.readFileSync('solver.js', 'utf8');

class TrieNode { constructor() { this.children = {}; this.isWord = false; } }
class Trie {
    constructor() { this.root = new TrieNode(); }
    insert(word) { let node = this.root; for (let char of word) { if (!node.children[char]) node.children[char] = new TrieNode(); node = node.children[char]; } node.isWord = true; }
}

const letterPoints = { 'A': 1, 'C': 3, 'H': 4, 'L': 1, 'O': 1, 'S': 1 };
const boardLayout = Array(15).fill(0).map(() => Array(15).fill(0));
boardLayout[7][7] = 5;

const trie = new Trie();
const dictionary = new Set(['CASA', 'HOLA', 'HOL']);
['CASA', 'HOLA', 'HOL'].forEach(w => trie.insert(w));

const boardState = Array(15).fill(null).map(() => Array(15).fill({ letter: null }));
// CASA at row 11, columns 11, 12, 13, 14
boardState[11][11] = { letter: 'C', points: 3 };
boardState[11][12] = { letter: 'A', points: 1 };
boardState[11][13] = { letter: 'S', points: 1 };
boardState[11][14] = { letter: 'A', points: 1 };

let solverCodeToExecute = solverLogic + `
const solver = new Solver(boardLayout, letterPoints);
solver.trie = trie;
solver.dictionary = dictionary;
solver.isReady = true;

console.log('--- TEST: Board with CASA at 11,11 ---');
let emptyStr = boardState.map(row => row.map(c => c.letter || '_').join('')).join('|');
console.log(emptyStr);
const res = solver.findBestMoves(['H', 'O', 'L', 'A'], boardState);

res.forEach(r => {
    let touchesTile = false;
    for(let i=0; i<r.word.length; i++) {
        let R = r.dir === 'H' ? r.r : r.r + i;
        let C = r.dir === 'H' ? r.c + i : r.c;
        if ((R >= 10 && R <= 12) && (C >= 10 && C <= 15)) {
           touchesTile = true;
        }
    }
    if (!touchesTile) {
        console.log("FLOATING WORD ACCEPTED:", r);
    }
});

console.log("Total moves:", res.length);
`;
eval(solverCodeToExecute);
