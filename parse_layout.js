const fs = require('fs');

const input = `
A,--,--,TP,--,TL,--,--,--,--,--,TL,--,TP,--,--
B,--,TL,--,--,--,DP,--,--,--,DP,--,--,--,TL,--
C,TP,--,DL,--,--,--,TL,--,TL,--,--,--,DL,--,TP
D,--,--,--,TL,--,--,--,DP,--,--,--,TL,--,--,--
E,TL,--,--,--,--,--,DL,--,DL,--,--,--,--,--,TL
F,--,DP,--,--,--,TL,--,--,--,TL,--,--,--,DP,--
G,--,--,TL,--,DL,--,--,--,--,--,DL,--,TL,--,--
H,--,--,--,DP,--,--,--,★,--,--,--,DP,--,--,--
I,--,--,TL,--,DL,--,--,--,--,--,DL,--,TL,--,--
J,--,DP,--,--,--,TL,--,--,--,TL,--,--,--,DP,--
K,TL,--,--,--,--,--,DL,--,DL,--,--,--,--,--,TL
L,--,--,--,TL,--,--,--,DP,--,--,--,TL,--,--,--
M,TP,--,DL,--,--,--,TL,--,TL,--,--,--,DL,--,TP
N,--,TL,--,--,--,DP,--,--,--,DP,--,--,--,TL,--
O,--,--,TP,--,TL,--,--,--,--,--,TL,--,TP,--,--
`.trim().split('\n');

const layout = [];
for (let line of input) {
    const cols = line.split(',');
    cols.shift(); // Remove row letter
    const row = cols.map(c => {
        if (c === '--') return 0;
        if (c === 'DL') return 1;
        if (c === 'TL') return 2;
        if (c === 'DP') return 3;
        if (c === 'TP') return 4;
        if (c === '★' || c === '*') return 5;
        return 0; // fallback
    });
    layout.push(row);
}

const formatted = `[\n` + layout.map(r => `        [${r.join(', ')}]`).join(',\n') + `\n    ]`;
console.log(formatted);
