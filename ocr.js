// ocr.js
// Lógica para importar capturas de pantalla de Apalabrados mediante Tesseract.js

class BoardOCR {
    constructor(boardState, updateBoardUI) {
        this.boardState = boardState;
        this.updateBoardUI = updateBoardUI;
        this.canvas = document.getElementById('ocr-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.statusEl = document.getElementById('ocr-status');
        this.statusText = document.getElementById('ocr-status-text');
        this.spinner = this.statusEl.querySelector('.ocr-spinner');

        this.modalEl = document.getElementById('ocr-modal');
        this.controlsEl = document.getElementById('ocr-controls');
        this.zoomInput = document.getElementById('ocr-zoom');
        this.xInput = document.getElementById('ocr-x');
        this.yInput = document.getElementById('ocr-y');
        this.startBtn = document.getElementById('ocr-start-btn');
        this.cancelBtn = document.getElementById('ocr-cancel-btn');

        this.img = null;
        this.worker = null;

        // Base heurística calculada en la carga inicial
        this.baseBoardSize = 0;
        this.baseStartX = 0;
        this.baseStartY = 0;

        this.initWorker();
        this.bindEvents();
    }

    async initWorker() {
        try {
            this.worker = await Tesseract.createWorker('spa', 1, {
                logger: m => console.log(m)
            });
            await this.worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ*',
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR
            });
            console.log('Tesseract OCR Worker inicializado');
        } catch (error) {
            console.error('Error inicializando Tesseract:', error);
            this.setStatus('Error al cargar OCR', true);
        }
    }

    bindEvents() {
        const update = () => {
            if (this.img) this.drawGrid();
        };
        if (this.zoomInput) this.zoomInput.addEventListener('input', update);
        if (this.xInput) this.xInput.addEventListener('input', update);
        if (this.yInput) this.yInput.addEventListener('input', update);

        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                this.hideModal();
                this.scanGrid();
            });
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
    }

    showModal() {
        if (this.modalEl) this.modalEl.classList.remove('hidden');
    }

    hideModal() {
        if (this.modalEl) this.modalEl.classList.add('hidden');
    }

    setStatus(message, isError = false) {
        this.statusEl.classList.remove('hidden');
        this.statusText.textContent = message;
        if (isError) {
            this.statusEl.style.borderColor = '#e53935';
            this.statusEl.style.color = '#e53935';
            this.statusEl.style.backgroundColor = '#ffebee';
            this.statusEl.querySelector('.ocr-spinner').style.display = 'none';
        } else {
            this.statusEl.style.borderColor = '#1E88E5';
            this.statusEl.style.color = '#1E88E5';
            this.statusEl.style.backgroundColor = '#E3F2FD';
            this.statusEl.querySelector('.ocr-spinner').style.display = 'block';
        }
    }

    hideStatus() {
        this.statusEl.classList.add('hidden');
    }

    async processImage(file) {
        if (!this.worker) {
            alert('El procesador OCR todavía se está cargando. Por favor, espera unos segundos y vuelve a intentarlo.');
            return;
        }

        this.setStatus('Cargando imagen para ajuste manual...');
        this.img = new Image();
        this.img.onload = () => {
            // Mostrar modal antes para obtener el tamaño real del contenedor
            this.showModal();
            this.hideStatus();

            const container = document.querySelector('.ocr-preview-container');
            const maxWidth = container.clientWidth || 600;
            const maxHeight = container.clientHeight || 400;

            // Calcular factor de escala para que la imagen encaje en el modal
            let scale = 1;
            if (this.img.width > maxWidth || this.img.height > maxHeight) {
                const scaleX = maxWidth / this.img.width;
                const scaleY = maxHeight / this.img.height;
                scale = Math.min(scaleX, scaleY) * 0.95; // 95% para dejar un pequeño margen extra
            }

            // Si la imagen es más pequeña que el contenedor, no la agrandamos para no perder calidad
            if (scale > 1) scale = 1;

            this.canvas.width = this.img.width * scale;
            this.canvas.height = this.img.height * scale;

            // Guardamos el factor de escala visual para aplicarlo a la cuadrícula y al OCR
            this.renderScale = scale;

            // Heurística simple para primera aproximación (referida a la imagen original)
            if (Math.abs(this.img.width - this.img.height) < 50) {
                this.baseBoardSize = Math.min(this.img.width, this.img.height);
                this.baseStartX = (this.img.width - this.baseBoardSize) / 2;
                this.baseStartY = (this.img.height - this.baseBoardSize) / 2;
            } else {
                this.baseBoardSize = this.img.width;
                this.baseStartX = 0;
                this.baseStartY = this.img.height * 0.22;
                if (this.baseStartY + this.baseBoardSize > this.img.height) {
                    this.baseStartY = (this.img.height - this.baseBoardSize) / 2;
                }
            }

            // Resetear sliders
            this.zoomInput.value = 98; // Asumimos un 2% de margen típico de Apalabrados
            this.xInput.value = 0;
            this.yInput.value = 0;

            this.drawGrid();

            // Hacer scroll hasta los controles
            setTimeout(() => this.controlsEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        };
        this.img.src = URL.createObjectURL(file);
    }

    getAdjustedParams() {
        // Obtenemos los valores de los sliders
        const zoom = parseInt(this.zoomInput.value) / 100;
        const offsetX = parseInt(this.xInput.value) * (this.img.width / 500);
        const offsetY = parseInt(this.yInput.value) * (this.img.height / 500);

        let targetBoardSize = this.baseBoardSize * zoom;
        let targetStartX = this.baseStartX + ((this.baseBoardSize - targetBoardSize) / 2) + offsetX;
        let targetStartY = this.baseStartY + ((this.baseBoardSize - targetBoardSize) / 2) + offsetY;

        const cellSize = targetBoardSize / 15;

        // displayMargin: margen del rectángulo rojo visual (0 = pegado para encajar bien)
        const displayMargin = 0;
        // cropMargin: 5% inset para saltar bordes de celda sin perder demasiado fondo amarillo
        const cropMargin = Math.max(1, cellSize * 0.05);
        const cropSize = cellSize - (cropMargin * 2);

        return { targetStartX, targetStartY, cellSize, displayMargin, cropMargin, cropSize };
    }

    drawGrid() {
        if (!this.img) return;

        // Dibujar imagen escalada
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);

        const { targetStartX, targetStartY, cellSize, displayMargin } = this.getAdjustedParams();
        const drawSize = cellSize - (displayMargin * 2);

        // Dibujar cuadrícula aplicando el escalado visual a las coordenadas base
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = Math.max(1, this.canvas.width / 600);

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const x = (targetStartX + (c * cellSize)) * this.renderScale;
                const y = (targetStartY + (r * cellSize)) * this.renderScale;
                const size = drawSize * this.renderScale;
                this.ctx.strokeRect(x + (displayMargin * this.renderScale), y + (displayMargin * this.renderScale), size, size);
            }
        }
    }

    async scanGrid() {
        // ── Límite de usos gratuitos ──────────────────────────────────
        if (window.UsageTracker && !window.UsageTracker.checkAndConsume()) return;

        this.setStatus('Extrayendo y procesando casillas (0/225)...');
        document.getElementById('clear-board-btn').click();

        // Imagen limpia sin la cuadrícula roja pero escalada
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);

        const { targetStartX, targetStartY, cellSize, cropMargin, cropSize } = this.getAdjustedParams();
        let recognizedCount = 0;

        try {
            for (let r = 0; r < 15; r++) {
                for (let c = 0; c < 15; c++) {
                    // Calculamos las coordenadas x,y aplicando el mismo renderScale que usa drawGrid
                    const x = (targetStartX + (c * cellSize)) * this.renderScale;
                    const y = (targetStartY + (r * cellSize)) * this.renderScale;
                    const scaledCropMargin = cropMargin * this.renderScale;
                    const scaledCropSize = cropSize * this.renderScale;

                    const rawData = this.ctx.getImageData(
                        Math.max(0, Math.round(x + scaledCropMargin)),
                        Math.max(0, Math.round(y + scaledCropMargin)),
                        Math.max(1, Math.round(scaledCropSize)),
                        Math.max(1, Math.round(scaledCropSize))
                    );

                    if (this.isCellEmpty(rawData)) continue;

                    // Canvas directo para Tesseract (sin upscaling)
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = Math.round(cropSize);
                    tempCanvas.height = Math.round(cropSize);
                    const tCtx = tempCanvas.getContext('2d');
                    // Binarizar: copia de rawData para no mutar el original (necesario para hasTilde)
                    const binData = this.preprocessImage(
                        new ImageData(new Uint8ClampedArray(rawData.data), rawData.width, rawData.height)
                    );
                    tCtx.putImageData(binData, 0, 0);

                    const result = await this.worker.recognize(tempCanvas);
                    let char = result.data.text.trim().toUpperCase();

                    // Correcciones comunes de OCR
                    // Nota: 'l' minúscula → I (Tesseract a veces confunde barra de I con l)
                    // No convertimos 'L' mayúscula porque L es letra válida en español
                    if (char === '1' || char === 'l' || char === '|') char = 'I';
                    if (char === '0' || char === 'Q') char = 'O';
                    if (char === 'N' && this.hasTilde(rawData)) char = 'Ñ';
                    if (!/^[A-ZÑ]$/.test(char)) char = '';

                    if (char.length === 1) {
                        recognizedCount++;
                        this.updateBoardUI(r, c, char);
                    }
                }
                this.setStatus(`Analizando tablero... (Fila ${r + 1}/15)`);
            }

            if (recognizedCount > 0) {
                this.setStatus(`¡Tablero importado! (${recognizedCount} letras detectadas)`);
                setTimeout(() => {
                    this.hideStatus();
                    this.canvas.style.display = 'none';
                }, 4000);
            } else {
                this.setStatus('No se detectaron letras. Ajusta la cuadrícula e inténtalo de nuevo.', true);
                this.controlsEl.classList.remove('hidden');
            }

        } catch (err) {
            console.error(err);
            this.setStatus('Fallo durante el análisis.', true);
        }
    }

    isCellEmpty(imageData) {
        // Enfoque combinado: una celda tiene ficha si tiene píxeles amarillos (fondo)
        // O píxeles de letra oscura (azul marino tras compresión JPEG puede no ser puro azul).
        // TP (rojo): excluido porque b << r. DL/TL/DP: excluidos porque no son oscuros ni amarillos.
        const data = imageData.data;
        let tilePixels = 0;
        const totalPixels = data.length / 4;
        const sampleStep = 2;

        for (let i = 0; i < data.length; i += 4 * sampleStep) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const bright = 0.299 * r + 0.587 * g + 0.114 * b;

            // Condición 1: píxel amarillo del fondo de la ficha
            const isYellow = r > 160 && g > 120 && b < 130 && r > b + 70 && g > b + 30;

            // Condición 2: píxel oscuro de letra, no dominado por rojo
            // b > r*0.6 excluye TP rojo (b≈25, r≈150: 25 < 90) pero permite grises y azules
            // que aparecen en letras comprimidas por JPEG
            const isDarkLetter = bright < 70 && b > r * 0.6;

            if (isYellow || isDarkLetter) tilePixels++;
        }

        const ratio = tilePixels / (totalPixels / sampleStep);
        return ratio < 0.06; // Menos del 6% de píxeles de ficha → celda vacía
    }

    // Detecta la tilde de la Ñ analizando píxeles oscuros en el TOPE de la celda.
    // Miramos solo el 15% superior y el centro horizontal para evitar confundir
    // con los trazos verticales de la N que también tienen píxeles oscuros arriba.
    hasTilde(imageData) {
        const { width, height } = imageData;
        const data = imageData.data;
        const topRows = Math.floor(height * 0.15); // Solo el 15% superior
        const colStart = Math.floor(width * 0.20);  // Centro horizontal (excluir bordes)
        const colEnd = Math.floor(width * 0.80);
        let darkPixels = 0;
        let totalChecked = 0;

        for (let row = 0; row < topRows; row++) {
            for (let col = colStart; col < colEnd; col++) {
                const idx = (row * width + col) * 4;
                const bright = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                totalChecked++;
                if (bright < 90) darkPixels++;
            }
        }

        const ratio = darkPixels / totalChecked;
        return ratio > 0.25; // Umbral alto (25%) para evitar falsos positivos en N normales
    }

    // Binarización adaptativa: el umbral se calcula por brillo promedio de la celda.
    // Esto adapta automáticamente la binarización a la luz de cada captura.
    preprocessImage(imageData) {
        const data = imageData.data;

        // Calcular brillo promedio para umbral adaptativo
        let totalBright = 0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
            totalBright += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const avgBright = totalBright / pixels;
        // Umbral: entre el fondo brillante y la letra oscura
        // Las letras de Apalabrados son ~30-60 brillo, el fondo áreo ~180-220
        const threshold = Math.min(180, Math.max(100, avgBright * 0.65));

        for (let i = 0; i < data.length; i += 4) {
            const bright = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const val = bright > threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
        }
        return imageData;
    }
}

window.BoardOCR = BoardOCR;
