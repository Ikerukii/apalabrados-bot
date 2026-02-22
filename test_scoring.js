// solver.js
// Algoritmo Trie para buscar la mejor jugada de Apalabrados

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

class Solver {
    constructor(boardLayout, letterPoints) {
        this.boardLayout = boardLayout;
        this.letterPoints = letterPoints;
        this.trie = new Trie();
        this.dictionary = new Set();
        this.isReady = false;
        this.PLENO_BONUS = 40;
    }

    async init() {
        try {
            const response = await fetch('diccionario.txt');
            if (!response.ok) throw new Error('Network response was not ok');
            const text = await response.text();

            const words = text.split('\n')
                .map(w => w.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
                .filter(w => w.length >= 2 && /^[A-ZÑ]+$/.test(w));

            for (let word of words) {
                this.dictionary.add(word);
                this.trie.insert(word);
            }

            this.isReady = true;
            console.log(`Diccionario cargado con ${this.dictionary.size} palabras.`);
        } catch (error) {
            console.error('Error cargando el diccionario:', error);
        }
    }

    findBestMoves(rackLetters, boardState) {
        if (!this.isReady) return [{ word: "CARGANDO...", score: 0, r: 0, c: 0, dir: 'H' }];

        let validLetters = rackLetters.filter(l => l !== '');
        if (validLetters.length === 0) return [];

        const isBoardEmpty = this.isBoardEmpty(boardState);
        const results = [];

        // Horizontal searches
        this.searchAllLines(validLetters, boardState, 'H', isBoardEmpty, results);

        // Vertical searches (transpose board)
        this.searchAllLines(validLetters, this.transposeBoard(boardState), 'V', isBoardEmpty, results);

        // Deduplicate and filter exact same placements
        const uniqueResults = [];
        const seen = new Set();
        for (let r of results) {
            let key = `${r.word}-${r.r}-${r.c}-${r.dir}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(r);
            }
        }

        uniqueResults.sort((a, b) => b.score - a.score);
        return uniqueResults.slice(0, 15);
    }

    isBoardEmpty(boardState) {
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (boardState[r][c].letter) return false;
            }
        }
        return true;
    }

    transposeBoard(board) {
        const transposed = Array(15).fill(null).map(() => Array(15).fill(null));
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                transposed[r][c] = board[c][r];
            }
        }
        return transposed;
    }

    searchAllLines(rack, board, dir, isBoardEmpty, results) {
        // Compute cross checks for all cells in this orientation
        const crossChecks = this.computeCrossChecks(board, dir);

        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                // If there's a letter right before us, we obviously can't START a word here.
                if (col > 0 && board[row][col - 1].letter) continue;

                // We start extending from (row, col)
                this.extendRight(row, col, col, this.trie.root, rack, board, dir, isBoardEmpty, crossChecks, "", [], results);
            }
        }
    }

    extendRight(row, startCol, currCol, node, rack, board, dir, isBoardEmpty, crossChecks, currentWord, placedTiles, results) {
        if (currCol === 15) {
            this.recordPlay(row, startCol, currentWord, placedTiles, board, dir, isBoardEmpty, results);
            return;
        }

        const cell = board[row][currCol];

        if (cell.letter) {
            // Must use the existing letter on the board
            const char = cell.letter;
            if (node.children[char]) {
                this.extendRight(row, startCol, currCol + 1, node.children[char], rack, board, dir, isBoardEmpty, crossChecks, currentWord + char, placedTiles, results);
            }
        } else {
            // Empty cell. We can end the word here if valid.
            if (node.isWord && placedTiles.length > 0) {
                this.recordPlay(row, startCol, currentWord, placedTiles, board, dir, isBoardEmpty, results);
            }

            // Valid letters for this empty cell based on perpendicular words
            const validSet = crossChecks[row][currCol];
            if (!validSet) return; // Cannot place any letter here trivially to form valid cross word.

            // Try playing a letter from the rack
            const uniqueRack = [...new Set(rack)];
            let hasWildcard = rack.includes('*');

            for (let char of Object.keys(node.children)) {
                if (!validSet.has(char)) continue; // Must form valid cross word

                // Check if we have this letter or a wildcard
                let usedWildcard = false;
                let rackCopy = [...rack];
                let idx = rackCopy.indexOf(char);

                if (idx !== -1) {
                    rackCopy.splice(idx, 1);
                } else if (hasWildcard) {
                    rackCopy.splice(rackCopy.indexOf('*'), 1);
                    usedWildcard = true;
                } else {
                    continue; // We don't have the tile
                }

                placedTiles.push({ col: currCol, char: char, isWildcard: usedWildcard });
                this.extendRight(row, startCol, currCol + 1, node.children[char], rackCopy, board, dir, isBoardEmpty, crossChecks, currentWord + char, placedTiles, results);
                placedTiles.pop();
            }
        }
    }

    recordPlay(row, startCol, word, placedTiles, board, dir, isBoardEmpty, results) {
        if (placedTiles.length === 0) return;

        // Valid placements must either touch the center (if empty board) or touch an existing tile (anchor)
        let isValid = false;

        if (isBoardEmpty) {
            // Must cover center (7,7)
            for (let pt of placedTiles) {
                let r = dir === 'H' ? row : pt.col;
                let c = dir === 'H' ? pt.col : row;
                if (r === 7 && c === 7) isValid = true;
            }
        } else {
            // Must have placed at least one tile adjacent to an existing tile, OR connected to an existing letter in `word`
            if (placedTiles.length < word.length) {
                isValid = true; // We connected to existing letters in the line
            } else {
                for (let pt of placedTiles) {
                    let r = dir === 'H' ? row : pt.col;
                    let c = dir === 'H' ? pt.col : row;
                    if (this.hasAdjacentTile(board, r, pt.col, dir)) {
                        isValid = true;
                        break;
                    }
                }
            }
        }

        if (isValid) {
            const score = this.calculatePlayScore(row, startCol, word, placedTiles, board, dir);
            results.push({
                word: word,
                score: score,
                r: dir === 'H' ? row : startCol,
                c: dir === 'H' ? startCol : row,
                dir: dir,
                placedLength: placedTiles.length
            });
        }
    }

    hasAdjacentTile(board, r, c, dir) {
        // Since board is always oriented such that we are moving horizontally (col++), 
        // the "row" is constant, and "col" varies. Perpendicular is varying "row".
        if (r > 0 && board[r - 1][c].letter) return true;
        if (r < 14 && board[r + 1][c].letter) return true;
        if (c > 0 && board[r][c - 1].letter) return true;
        if (c < 14 && board[r][c + 1].letter) return true;
        return false;
    }

    computeCrossChecks(board, dir) {
        // For every empty cell, compute which letters from A-Z are allowed such that
        // the perpendicular word formed is in the dictionary.
        // Returns a 2D array of Sets.
        const checks = Array(15).fill(null).map(() => Array(15).fill(null));
        const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (board[r][c].letter) continue;

                // Find top/bottom connecting letters (perpendicular to current direction)
                // Note: since board might be transposed, 'r' is always perpendicular to 'c'.
                let topWord = "";
                let i = r - 1;
                while (i >= 0 && board[i][c].letter) {
                    topWord = board[i][c].letter + topWord;
                    i--;
                }

                let bottomWord = "";
                let j = r + 1;
                while (j < 15 && board[j][c].letter) {
                    bottomWord += board[j][c].letter;
                    j++;
                }

                if (topWord === "" && bottomWord === "") {
                    // No perpendicular letters, any letter is valid
                    checks[r][c] = new Set(alphabet.split(''));
                } else {
                    const validForCell = new Set();
                    for (let char of alphabet) {
                        const testWord = topWord + char + bottomWord;
                        if (this.dictionary.has(testWord)) {
                            validForCell.add(char);
                        }
                    }
                    checks[r][c] = validForCell;
                }
            }
        }
        return checks;
    }

    calculatePlayScore(row, startCol, word, placedTiles, board, dir) {
        let mainWordScore = 0;
        let mainWordMultiplier = 1;
        let totalScore = 0;
        let placedDict = {};
        for (let p of placedTiles) placedDict[p.col] = p;

        for (let i = 0; i < word.length; i++) {
            let c = startCol + i;
            let char = word[i];

            let isNewlyPlaced = placedDict[c] !== undefined;
            let letterVal = placedDict[c]?.isWildcard ? 0 : (this.letterPoints[char] || 0);

            if (!isNewlyPlaced) {
                // Pre-existing tile: use its actual points on the board, so opponent wildcards (0) stay 0
                let origR = dir === 'H' ? row : c;
                let origC = dir === 'H' ? c : row;
                let existingPoints = board[origR][origC].points;
                mainWordScore += existingPoints;
            } else {
                // Newly placed tile gets multipliers
                // Note: we need to translate (row, c) back to original board coords if transposed
                let origR = dir === 'H' ? row : c;
                let origC = dir === 'H' ? c : row;

                let cellType = this.boardLayout[origR][origC];
                let letterMult = 1;

                if (cellType === 1) letterMult = 2; // DL
                if (cellType === 2) letterMult = 3; // TL
                if (cellType === 3 || cellType === 5) mainWordMultiplier *= 2; // DP or Star
                if (cellType === 4) mainWordMultiplier *= 3; // TP

                let charScore = (letterVal * letterMult);
                mainWordScore += charScore;

                // Also calculate perpendicular word score if exists
                let topWord = "", bottomWord = "";
                let topScore = 0, bottomScore = 0;

                let tr = row - 1;
                while (tr >= 0 && board[tr][c].letter) {
                    topWord = board[tr][c].letter + topWord;
                    let origR = dir === 'H' ? tr : c;
                    let origC = dir === 'H' ? c : tr;
                    topScore += board[origR][origC].points;
                    tr--;
                }

                let br = row + 1;
                while (br < 15 && board[br][c].letter) {
                    bottomWord += board[br][c].letter;
                    let origR = dir === 'H' ? br : c;
                    let origC = dir === 'H' ? c : br;
                    bottomScore += board[origR][origC].points;
                    br++;
                }

                if (topWord.length > 0 || bottomWord.length > 0) {
                    // The perpendicular word uses this newly placed letter's tile value (with multiplier) 
                    // and the new word multiplier.
                    let crossWordScore = topScore + charScore + bottomScore;
                    crossWordScore *= (cellType === 3 || cellType === 4 || cellType === 5) ? (cellType === 4 ? 3 : 2) : 1;
                    totalScore += crossWordScore;
                }
            }
        }

        totalScore += (mainWordScore * mainWordMultiplier);

        if (placedTiles.length === 7) {
            totalScore += this.PLENO_BONUS;
        }

        return totalScore;
    }
}

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

const letterPoints = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4,
    'G': 2, 'H': 4, 'I': 1, 'J': 8, 'L': 1, 'M': 3,
    'N': 1, 'Ñ': 8, 'O': 1, 'P': 3, 'Q': 5, 'R': 1,
    'S': 1, 'T': 1, 'U': 1, 'V': 4, 'X': 8, 'Y': 4,
    'Z': 10
};

const trie = new Trie();
const dictionary = new Set(['CASIA', 'SOL', 'ALO', 'LAS']);
['CASIA', 'SOL', 'ALO', 'LAS'].forEach(w => trie.insert(w));

const solver = new Solver(boardLayout, letterPoints);
solver.trie = trie;
solver.dictionary = dictionary;
solver.isReady = true;

console.log('--- TEST 1: Board Empty ---');
console.log('Testing CASIA on empty board from rack A,S,C,I,A. Should cross 7,7');
const boardState1 = Array(15).fill(null).map(() => Array(15).fill(null).map(() => ({ letter: null, points: 0 })));
const res1 = solver.findBestMoves(['A', 'S', 'C', 'I', 'A', 'X', 'Y'], boardState1);
let casiaPlacements = res1.filter(r => r.word === 'CASIA');
let crossesCenter = casiaPlacements.some(r => {
    let covers = false;
    for (let i = 0; i < r.placedLength; i++) {
        let R = r.dir === 'H' ? r.r : r.r + i;
        let C = r.dir === 'H' ? r.c + i : r.c;
        if (R === 7 && C === 7) covers = true;
    }
    return covers;
});
console.log(crossesCenter ? "PASS: First word must touch 7,7" : "FAIL: Does not touch center.");

console.log('\n--- TEST 2: Scoring secondary words with anchors ---');
// Let's place SOL on the board horizontally at 7,7 (S) 7,8 (O) 7,9 (L)
const boardState2 = Array(15).fill(null).map(() => Array(15).fill(null).map(() => ({ letter: null, points: 0 })));
boardState2[7][7] = { letter: 'S', points: 1 };
boardState2[7][8] = { letter: 'O', points: 1 };
boardState2[7][9] = { letter: 'L', points: 1 };

console.log('Adding "AL" vertically above O (so ALO is formed vertically starting at 5,8).');
// A = row 5 col 8. L = row 6 col 8. O is already at 7,8.
let testPlacedTiles = [
    { col: 5, char: 'A' }, // Placed at 5,8 vertically. Dir = V, so 'row' is varying and 'col' means the column 8. Wait, in V, 'row' passed to function is the constant col.
    // In solver, if dir=V, row configures the startCol, and col configures current varying row.
    { col: 6, char: 'L' }
];

// Score calculation:
// ALO vertical: A=1, L=1, O=1. Multiplier: none on 5,8 or 6,8? Wait. 
// layout[5][8]: [5] is [0, 3, 0, 0, 0, 2...]. Index 8 is 0. Normal tile.
// layout[6][8]: [6] is [0, 0, 2...]. Index 8 is 0. Normal.
// Wait! "ALO" crosses "SOL". 
// A(1) + L(1) + O(1 from board) = 3 for ALO.
// Perpendicular words: 
// A placed at 5,8 has no horizontal connections.
// L placed at 6,8 has no horizontal connections.
// Total score should be 3.
let score = solver.calculatePlayScore(8, 5, "ALO", testPlacedTiles, boardState2, 'V');
console.log('Score for ALO over O: ' + score);

console.log('\n--- TEST 3: Scoring with multiplier and opponent wildcard ---');
boardState2[7][9] = { letter: 'L', points: 0 }; // Opponent played a wildcard L
// We play ALAS starting at 7,9 horizontally using the existing L (points 0)
// 7,9 = L (0 pts)
// 7,10 = A
// 7,11 = S (TL cell) layout[7][11] is 3
// Let's check layout[7][11]...
console.log('layout[7][11] = ' + boardLayout[7][11]); // It's a DP (3)! Wait, boardLayout[7] is [0,0,0,3,0,0,0,5,0,0,0,3,0,0,0]. Index 11 is 3 (DP).

testPlacedTiles = [
    { col: 10, char: 'A' }, // Placed at 7,10 horizontally
    { col: 11, char: 'S' }  // Placed at 7,11 horizontally (DP)
];
// Score: L (0) + A (1) + S (1 * 1) = 2. 
// DP is on S. So word mult = 2. Total = 4.
let score2 = solver.calculatePlayScore(7, 9, "LAS", testPlacedTiles, boardState2, 'H');
console.log('Score for LAS using existing wildcard L and landing on DP: ' + score2);

