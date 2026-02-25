document.addEventListener('DOMContentLoaded', () => {
    console.log("V2 LOADED - " + new Date().toLocaleTimeString());
    // alert("Bot Actualizado: Pulsa Aceptar y refresca una última vez.");
    const boardElement = document.getElementById('board');
    const boardSize = 15;
    let selectedCell = null;
    let boardState = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)); // To track tiles on board
    let solver = null;

    // Puntos de letras en español (Apalabrados aproximado)
    const letterPoints = {
        'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
        'L': 1, 'M': 3, 'N': 1, 'Ñ': 8, 'O': 1, 'P': 3, 'Q': 5, 'R': 1, 'S': 1, 'T': 1,
        'U': 1, 'V': 4, 'X': 8, 'Y': 4, 'Z': 10
    };

    // Matriz de Apalabrados (Aworded) aproximada: 1=DL, 2=TL, 3=DP, 4=TP, 5=Estrella(DP)
    // Se ha ajustado basándose en 12 DL, 28 TL, 12 DP, 8 TP (patrón común apalabrados frente a scrabble)
    // TP: esquinas y centro de los lados. 
    // TL: Abundantes en diagonales medias.
    const boardLayout = [
        [0, 0, 4, 0, 0, 2, 0, 0, 0, 2, 0, 0, 4, 0, 0],
        [0, 2, 0, 1, 0, 0, 3, 0, 3, 0, 0, 1, 0, 2, 0],
        [4, 0, 3, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3, 0, 4],
        [0, 1, 0, 2, 0, 1, 0, 0, 0, 1, 0, 2, 0, 1, 0],
        [0, 0, 1, 0, 3, 0, 1, 0, 1, 0, 3, 0, 1, 0, 0],
        [2, 0, 0, 1, 0, 2, 0, 0, 0, 2, 0, 1, 0, 0, 2],
        [0, 3, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 3, 0],
        [0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 3, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 3, 0],
        [2, 0, 0, 1, 0, 2, 0, 0, 0, 2, 0, 1, 0, 0, 2],
        [0, 0, 1, 0, 3, 0, 1, 0, 1, 0, 3, 0, 1, 0, 0],
        [0, 1, 0, 2, 0, 1, 0, 0, 0, 1, 0, 2, 0, 1, 0],
        [4, 0, 3, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3, 0, 4],
        [0, 2, 0, 1, 0, 0, 3, 0, 3, 0, 0, 1, 0, 2, 0],
        [0, 0, 4, 0, 0, 2, 0, 0, 0, 2, 0, 0, 4, 0, 0]
    ];

    function createBoard() {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;

                const type = boardLayout[row][col];
                if (type === 1) cell.classList.add('dl');
                else if (type === 2) cell.classList.add('tl');
                else if (type === 3) cell.classList.add('dp');
                else if (type === 4) cell.classList.add('tp');
                else if (type === 5) {
                    cell.classList.add('dp');
                    cell.classList.add('star');
                }

                cell.addEventListener('click', () => selectCell(cell));
                boardElement.appendChild(cell);

                // Inicializamos el estado del tablero internamente
                boardState[row][col] = { letter: null, points: 0, cellType: type, element: cell };
            }
        }
    }

    // --- PERSISTENCIA CON localStorage ---
    const SAVE_KEY = 'apalabrados_board_save';

    function saveBoardState() {
        // Guardamos solo los datos clave: fila, columna, letra, puntos y si es comodín
        const data = [];
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const cell = boardState[r][c];
                if (cell && cell.letter) {
                    data.push({
                        r, c,
                        letter: cell.letter,
                        points: cell.points,
                        isWildcard: cell.element.classList.contains('is-wildcard')
                    });
                }
            }
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    // Hook para que firebase-auth nos configure el UID (para historial, etc)
    window.currentFirebaseUid = null;
    window.setFirebaseUser = (uid) => {
        window.currentFirebaseUid = uid;
    };

    function restoreBoardState() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return;
            const data = JSON.parse(saved);
            data.forEach(({ r, c, letter, isWildcard }) => {
                const cell = boardState[r][c].element;
                placeLetter(cell, letter, isWildcard);
            });
        } catch (e) {
            console.warn('No se pudo restaurar el tablero guardado:', e);
            localStorage.removeItem(SAVE_KEY); // Por si los datos estaban corruptos
        }
    }

    // 'h' = horizontal (derecha), 'v' = vertical (abajo)
    let inputDirection = 'h';

    function updateDirectionIndicator(cell) {
        if (!cell) return;
        // Pon un atributo para que el CSS muestre una flecha con ::after
        cell.dataset.dir = inputDirection;
    }

    function selectCell(cell) {
        if (selectedCell) {
            selectedCell.classList.remove('selected');
            delete selectedCell.dataset.dir;
        }
        if (selectedCell === cell) {
            // Clic en la misma celda => toggle de dirección
            inputDirection = inputDirection === 'h' ? 'v' : 'h';
        }
        selectedCell = cell;
        selectedCell.classList.add('selected');
        updateDirectionIndicator(selectedCell);

        // Forzar teclado en móviles
        const hiddenInput = document.getElementById('hidden-keyboard-input');
        if (hiddenInput) hiddenInput.focus();
    }

    function moveSelection(dRow, dCol) {
        if (!selectedCell) return;
        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);
        const newRow = Math.max(0, Math.min(boardSize - 1, row + dRow));
        const newCol = Math.max(0, Math.min(boardSize - 1, col + dCol));
        const nextCell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
        if (nextCell) {
            if (selectedCell) {
                selectedCell.classList.remove('selected');
                delete selectedCell.dataset.dir;
            }
            selectedCell = nextCell;
            selectedCell.classList.add('selected');
            updateDirectionIndicator(selectedCell);
        }
    }

    function moveToNextCell() {
        if (inputDirection === 'h') moveSelection(0, 1);
        else moveSelection(1, 0);
    }

    function moveToPrevCell() {
        if (inputDirection === 'h') moveSelection(0, -1);
        else moveSelection(-1, 0);
    }

    function getPoints(char) {
        const upper = char.toUpperCase();
        return letterPoints[upper] !== undefined ? letterPoints[upper] : '';
    }

    function placeLetter(cell, char, isWildcard = false, animate = false) {
        if (char === ' ') {
            removeLetter(cell);
            return;
        }
        cell.classList.add('has-letter');
        if (isWildcard) cell.classList.add('is-wildcard');
        else cell.classList.remove('is-wildcard');

        if (animate) {
            cell.classList.add('fx-drop-in');
            setTimeout(() => cell.classList.remove('fx-drop-in'), 500);
        }

        const points = isWildcard ? 0 : getPoints(char);
        cell.innerHTML = `
            <span class="letter">${char.toUpperCase()}</span>
            ${points !== '' ? `<span class="points">${points}</span>` : ''}
        `;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        boardState[row][col].letter = char.toUpperCase();
        boardState[row][col].points = points !== '' ? parseInt(points) : 0;
        saveBoardState();
    }

    function removeLetter(cell) {
        cell.classList.remove('has-letter');
        cell.innerHTML = '';

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        boardState[row][col].letter = null;
        boardState[row][col].points = 0;

        // Si era estrella, restaurar el texto
        if (boardLayout[row][col] === 5) {
            cell.classList.add('star');
        }
        saveBoardState();
    }

    // Teclado principal
    document.addEventListener('keydown', (e) => {
        // Ignora el evento principal si estamos escribiendo en el atril
        if (document.activeElement.classList.contains('rack-input')) return;

        if (!selectedCell) return;

        if (/^[a-zA-ZñÑ]$/.test(e.key)) {
            e.preventDefault();
            const isWildcard = e.shiftKey;
            placeLetter(selectedCell, e.key, isWildcard);
            moveToNextCell();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            const row = parseInt(selectedCell.dataset.row);
            const col = parseInt(selectedCell.dataset.col);
            if (boardState[row][col].letter) {
                // Si la celda actual tiene letra, la borra sin moverse
                removeLetter(selectedCell);
            } else {
                // Si está vacía, retrocede y borra la anterior
                moveToPrevCell();
                if (selectedCell) removeLetter(selectedCell);
            }
        } else if (e.key === ' ') {
            e.preventDefault();
            moveToNextCell(); // Espacio salta una celda
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Tab cambia la dirección sin mover la selección
            inputDirection = inputDirection === 'h' ? 'v' : 'h';
            updateDirectionIndicator(selectedCell);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            inputDirection = 'h';
            moveSelection(0, 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            inputDirection = 'h';
            moveSelection(0, -1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            inputDirection = 'v';
            moveSelection(1, 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            inputDirection = 'v';
            moveSelection(-1, 0);
        } else if (e.key === 'Escape') {
            // Escape deselecciona
            if (selectedCell) {
                selectedCell.classList.remove('selected');
                delete selectedCell.dataset.dir;
                selectedCell = null;
                const hiddenInput = document.getElementById('hidden-keyboard-input');
                if (hiddenInput) hiddenInput.blur();
            }
        }
    });

    // --- CAPTURA DE TECLADO MÓVIL (Vía Input Oculto) ---
    const hiddenInput = document.getElementById('hidden-keyboard-input');
    if (hiddenInput) {
        hiddenInput.addEventListener('input', (e) => {
            if (!selectedCell) {
                hiddenInput.value = '';
                return;
            }
            const val = hiddenInput.value;
            if (val.length > 0) {
                const char = val[val.length - 1];
                if (/^[a-zA-ZñÑ]$/.test(char)) {
                    placeLetter(selectedCell, char, false);
                    moveToNextCell();
                }
            }
            hiddenInput.value = '';
        });

        hiddenInput.addEventListener('keydown', (e) => {
            if (!selectedCell) return;
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                const row = parseInt(selectedCell.dataset.row);
                const col = parseInt(selectedCell.dataset.col);
                if (boardState[row][col].letter) {
                    removeLetter(selectedCell);
                } else {
                    moveToPrevCell();
                    if (selectedCell) removeLetter(selectedCell);
                }
            }
        });
    }

    // --- LÓGICA DEL ATRIL Y SOLVER ---
    const rackInputs = document.querySelectorAll('.rack-input');

    // Auto-focus al siguiente input del atril
    rackInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase();
            if (/^[A-ZÑ*]$/.test(val)) {
                e.target.value = val;
                if (index < rackInputs.length - 1) {
                    rackInputs[index + 1].focus();
                }
            } else {
                e.target.value = '';
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                rackInputs[index - 1].focus();
            }
        });
    });

    const solveBtn = document.getElementById('solve-btn');
    const resultsPanel = document.getElementById('results-panel');
    const resultsList = document.getElementById('results-list');

    solveBtn.addEventListener('click', () => {
        if (!solver || !solver.isReady) {
            alert("El diccionario se está cargando, por favor espera un momento.");
            return;
        }

        // ── Límite de usos gratuitos ──────────────────────────────────
        if (window.UsageTracker && !window.UsageTracker.checkAndConsume()) return;

        const rackLetters = Array.from(rackInputs).map(input => input.value.toUpperCase());

        if (rackLetters.every(l => l === '')) {
            alert("Introduce al menos una letra en el atril.");
            return;
        }

        solveBtn.disabled = true;
        solveBtn.innerHTML = "Calculando...";

        // Simular retardo para que la UI no se bloquee de inmediato si es muy duro (se pasará a Worker en producción)
        setTimeout(() => {
            const moves = solver.findBestMoves(rackLetters, boardState);
            displayResults(moves);

            solveBtn.disabled = false;
            solveBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Calcular Mejor Jugada`;
        }, 50);
    });

    const clearBtn = document.getElementById('clear-board-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (!confirm('¿Estás seguro de que quieres vaciar todo el tablero?')) return;

            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    const cellObj = boardState[row][col];
                    cellObj.letter = null;
                    cellObj.points = 0;

                    const cellEl = cellObj.element;
                    cellEl.classList.remove('has-letter', 'is-wildcard', 'preview');
                    cellEl.style.filter = "";
                    cellEl.innerHTML = '';

                    if (boardLayout[row][col] === 5) {
                        cellEl.classList.add('star');
                    }
                }
            }

            rackInputs.forEach(input => input.value = '');
            resultsPanel.classList.add('hidden');
            resultsList.innerHTML = '';
            currentPreviewMove = null;
            localStorage.removeItem(SAVE_KEY);
        });
    }

    // --- OCR Integración ---
    const importBtn = document.getElementById('import-board-btn');
    const importInput = document.getElementById('import-board-input');

    // Función bridge para que el OCR pueda inyectar letras en el tablero
    // Ruso que las letras importadas no tengan puntos "propios" porque ya están en el tablero
    const injectLetterFromOCR = (row, col, char) => {
        const cellObj = boardState[row][col];
        if (cellObj.letter) return; // Si ya hay algo, no lo sobrescribimos

        cellObj.letter = char;
        cellObj.points = letterPoints[char] || 0; // Calculamos los puntos
        const cellEl = cellObj.element;

        const letterSpan = document.createElement('span');
        letterSpan.classList.add('letter');
        letterSpan.textContent = char;

        const pointsSpan = document.createElement('span');
        pointsSpan.classList.add('points');
        pointsSpan.textContent = cellObj.points;

        cellEl.appendChild(letterSpan);
        cellEl.appendChild(pointsSpan);
        cellEl.classList.add('has-letter');
    };

    let ocr = null;
    if (window.BoardOCR) {
        ocr = new window.BoardOCR(boardState, injectLetterFromOCR);
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });

        importInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                if (ocr) ocr.processImage(e.target.files[0]);
                // Vaciar input para permitir subir el mismo archivo dos veces seguidas si se quiere
                importInput.value = '';
            }
        });
    }
    // -----------------------

    let currentPreviewMove = null;

    function displayResults(moves) {
        resultsList.innerHTML = '';
        currentPreviewMove = null; // Clear any pending move

        if (moves.length === 0) {
            resultsList.innerHTML = '<li class="result-item"><span class="result-word">No se encontraron jugadas</span></li>';
        } else {
            moves.forEach((move, index) => {
                const li = document.createElement('li');
                li.classList.add('result-item');
                li.innerHTML = `
                    <div style="display:flex; flex-direction:column; flex: 1;">
                        <span class="result-word">${move.word}</span>
                        <span style="font-size:0.8rem; color:#64748b;">Fila ${move.r + 1}, Col ${move.c + 1} (${move.dir === 'H' ? 'Horizontal' : 'Vertical'})</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                        <span class="result-score">${move.score} pts</span>
                        <button class="apply-btn hidden" data-index="${index}">Aplicar</button>
                        ${move.score >= 40 ? `<button class="whatsapp-share-btn hidden" onclick="event.stopPropagation(); window.open('https://wa.me/?text=' + encodeURIComponent('¡Apalabrados reventado! 🤯 Me acabo de sacar una jugada de ${move.score} puntazos (${move.word}). Encuentra palabras de reverso trucadas aquí: https://apalabrados-bot.up.railway.app'), '_blank')">WhatsApp</button>` : ''}
                    </div>
                `;

                // Highlight en el tablero al hacer click
                li.addEventListener('click', (e) => {
                    // Si se hizo click en el botón de aplicar
                    if (e.target.classList.contains('apply-btn')) {
                        applyMove(move);
                        return;
                    }

                    document.querySelectorAll('.result-item').forEach(el => {
                        el.classList.remove('highlighted');
                        el.querySelector('.apply-btn')?.classList.add('hidden');
                        el.querySelector('.whatsapp-share-btn')?.classList.add('hidden');
                    });

                    li.classList.add('highlighted');
                    li.querySelector('.apply-btn')?.classList.remove('hidden');
                    li.querySelector('.whatsapp-share-btn')?.classList.remove('hidden');

                    currentPreviewMove = move;
                    previewMove(move);
                });

                resultsList.appendChild(li);
            });
        }
        resultsPanel.classList.remove('hidden');

        // Auto-scroll a resultados si es mobile o si están fuera de vista
        setTimeout(() => {
            resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    function previewMove(move) {
        // Limpiar preview anterior
        document.querySelectorAll('.cell.preview').forEach(cell => {
            cell.classList.remove('has-letter', 'preview');
            cell.style.filter = "";
            cell.innerHTML = '';

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (boardLayout[row][col] === 5 && !boardState[row][col].letter) {
                cell.classList.add('star');
            }
        });

        // Mostrar nuevo preview sin modificar boardState
        for (let i = 0; i < move.word.length; i++) {
            let r = move.dir === 'H' ? move.r : move.r + i;
            let c = move.dir === 'H' ? move.c + i : move.c;

            if (r >= 15 || c >= 15) continue;

            const cell = boardState[r][c].element;
            if (!boardState[r][c].letter) {
                cell.classList.add('has-letter', 'preview');
                const char = move.word[i];
                const points = getPoints(char);
                cell.innerHTML = `
                    <span class="letter">${char.toUpperCase()}</span>
                    ${points ? `<span class="points">${points}</span>` : ''}
                `;
                cell.style.filter = "hue-rotate(90deg) opacity(0.85)";
            }
        }
    }

    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function applyMove(move) {
        // Limpiar estilos temporales de preview
        document.querySelectorAll('.cell.preview').forEach(cell => {
            cell.classList.remove('preview');
            cell.style.filter = "";
        });

        // Extraer letras del atril
        let currentRack = Array.from(rackInputs).map(input => input.value);

        // Ocultar panel de resultados inmediatamente para focus visual
        resultsPanel.classList.add('hidden');
        currentPreviewMove = null;

        // Limpiar botones de UI mientras se anima
        solveBtn.disabled = true;

        // Aplicar permanentemente y consumir del atril con animacion escalonada
        for (let i = 0; i < move.word.length; i++) {
            let r = move.dir === 'H' ? move.r : move.r + i;
            let c = move.dir === 'H' ? move.c + i : move.c;

            if (r >= 15 || c >= 15) continue;

            const cell = boardState[r][c].element;
            if (!boardState[r][c].letter) {
                const charToPlace = move.word[i].toUpperCase();

                // Intentar encontrar la letra exacta en el atril, o un asterisco en su defecto
                let rackIndex = currentRack.indexOf(charToPlace);
                let isWildcard = false;

                if (rackIndex === -1 && charToPlace !== '*') {
                    rackIndex = currentRack.indexOf('*');
                    isWildcard = true;
                }

                // Si la ficha o asterisco existe en el atril, la consumimos visualmente (la vaciamos)
                if (rackIndex !== -1) {
                    currentRack[rackIndex] = '';
                    rackInputs[rackIndex].value = '';
                }

                placeLetter(cell, charToPlace, isWildcard, true);

                // Efecto escalonado (90ms)
                await delay(90);
            }
        }

        // --- Registro en Firebase (Historial) ---
        // Obtenemos el usuario actual de forma segura
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (user && window.logPlayToCloud) {
            window.logPlayToCloud(user.uid, move);
        }

        solveBtn.disabled = false;
    }

    createBoard();
    restoreBoardState();

    // Inicializar el Solver
    solver = new Solver(boardLayout, letterPoints);
    solver.init();

    // Solo para debug en consola
    window.solver = solver;
    window.boardState = boardState;
});
