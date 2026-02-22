// ============================================================
// monetization.js — Apalabrados Usage Tracker + Ads
// ============================================================
// URL pública: https://apalabrados-bot.up.railway.app
// Fase 1: límite de usos por día (localStorage) + banners publicitarios
// Fase 2 (futura): autenticación real + Stripe

(function () {
    const USAGE_KEY = 'apalabrados_daily';
    const FREE_LIMIT = 5;
    // ---- ID de Google AdSense (sustituir cuando tengas aprobación) ----
    const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
    const ADSENSE_SLOT_BANNER = '1234567890';

    // ─── Utilidades de uso ───────────────────────────────────────────

    function _getToday() {
        return new Date().toDateString();
    }

    function _loadUsage() {
        try {
            const raw = localStorage.getItem(USAGE_KEY);
            if (!raw) return { date: _getToday(), count: 0 };
            const parsed = JSON.parse(raw);
            // Reiniciar si es un día nuevo
            if (parsed.date !== _getToday()) return { date: _getToday(), count: 0 };
            return parsed;
        } catch {
            return { date: _getToday(), count: 0 };
        }
    }

    function _saveUsage(data) {
        localStorage.setItem(USAGE_KEY, JSON.stringify(data));
    }

    function getUsageCount() {
        return _loadUsage().count;
    }

    function incrementUsage() {
        const data = _loadUsage();
        data.count += 1;
        _saveUsage(data);
        _updateCounterUI();
        return data.count;
    }

    function isLimitReached() {
        return _loadUsage().count >= FREE_LIMIT;
    }

    // ─── Verificar y consumir un uso ─────────────────────────────────
    // Devuelve true si el uso está permitido. Si no, muestra el modal y devuelve false.
    function checkAndConsume() {
        if (isLimitReached()) {
            showLimitModal();
            return false;
        }
        incrementUsage();
        return true;
    }

    // ─── UI: contador de usos ─────────────────────────────────────────

    function _updateCounterUI() {
        const el = document.getElementById('usage-counter');
        if (!el) return;
        const count = getUsageCount();
        const remaining = Math.max(0, FREE_LIMIT - count);
        el.textContent = remaining === 0
            ? '⚠️ Sin análisis gratuitos hoy'
            : `${remaining} análisis gratuito${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'} hoy`;
        el.style.color = remaining <= 1 ? '#ef4444' : '#64748b';
    }

    function _injectCounter() {
        const solveBtn = document.getElementById('solve-btn');
        if (!solveBtn || document.getElementById('usage-counter')) return;
        const counter = document.createElement('p');
        counter.id = 'usage-counter';
        counter.style.cssText = 'margin: 6px 0 0 0; font-size: 0.78rem; text-align: center; color: #64748b; font-weight: 500;';
        solveBtn.parentElement.parentElement.insertBefore(counter, solveBtn.parentElement.nextSibling);
        _updateCounterUI();
    }

    // ─── Modal: límite alcanzado ──────────────────────────────────────

    function showLimitModal() {
        document.getElementById('limit-modal')?.classList.remove('hidden');
    }

    function hideLimitModal() {
        document.getElementById('limit-modal')?.classList.add('hidden');
    }

    function _injectModal() {
        if (document.getElementById('limit-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'limit-modal';
        modal.className = 'limit-modal hidden';
        modal.innerHTML = `
            <div class="limit-modal-card">
                <div class="limit-modal-icon">⚡</div>
                <h2>Has agotado tus análisis de hoy</h2>
                <p>Los usuarios gratuitos disponen de <strong>${FREE_LIMIT} análisis por día</strong>.<br>
                Los análisis se reinician cada medianoche.</p>
                <div class="limit-modal-actions">
                    <button class="limit-modal-premium" onclick="window.open('#', '_blank')">
                        🚀 Ir a Premium — ilimitado por 2,99&nbsp;€/mes
                    </button>
                    <button class="limit-modal-dismiss" onclick="window.UsageTracker.hideModal()">
                        Vuelvo mañana
                    </button>
                </div>
                <p class="limit-modal-note">Con Premium: sin límites, sin publicidad.</p>
            </div>
        `;
        document.body.appendChild(modal);

        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideLimitModal();
        });
    }

    // ─── Banners publicitarios ────────────────────────────────────────

    function _buildAdHTML(slot, size) {
        // Placeholder hasta que tengas la aprobación de AdSense.
        // Cuando tengas el código real de AdSense, sustituye el contenido.
        const isApproved = ADSENSE_CLIENT !== 'ca-pub-XXXXXXXXXXXXXXXX';
        if (isApproved) {
            return `<ins class="adsbygoogle"
                style="display:block"
                data-ad-client="${ADSENSE_CLIENT}"
                data-ad-slot="${slot}"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>`;
        }
        // Placeholder visual para desarrollo / antes de aprobación
        return `<div class="ad-placeholder">
            <span>Publicidad</span>
        </div>`;
    }

    function _injectAdBanner() {
        // Banner debajo del panel de solver
        const targetPanel = document.querySelector('.solver-panel');
        if (!targetPanel || document.getElementById('ad-banner-main')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'ad-banner-main';
        wrapper.className = 'ad-banner';
        wrapper.innerHTML = _buildAdHTML(ADSENSE_SLOT_BANNER, 'auto');
        targetPanel.appendChild(wrapper);

        if (ADSENSE_CLIENT !== 'ca-pub-XXXXXXXXXXXXXXXX') {
            try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
        }
    }

    // ─── Init ─────────────────────────────────────────────────────────

    function init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _setup);
        } else {
            _setup();
        }
    }

    function _setup() {
        _injectModal();
        _injectCounter();
        _injectAdBanner();
    }

    // ─── API pública ──────────────────────────────────────────────────
    window.UsageTracker = {
        checkAndConsume,   // Llama antes de cada análisis
        getCount: getUsageCount,
        getLimit: () => FREE_LIMIT,
        showModal: showLimitModal,
        hideModal: hideLimitModal,
    };

    init();
})();
