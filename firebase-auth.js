/**
 * firebase-auth.js — Lógica de autenticación y sincronización con Firestore
 * Apalabrados Bot
 */

// Inicializar Firebase de forma segura
let auth = null;
let db = null;

try {
    if (typeof firebase !== 'undefined' && window.firebaseConfig) {
        firebase.initializeApp(window.firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    }
} catch (e) {
    console.warn("Fallo al inicializar Firebase SDK:", e);
}

// Elementos de la UI
const userProfileContainer = document.getElementById('user-profile');

// Funciones Globales para UI y Scripts
async function loginWithGoogle() {
    if (!auth) {
        alert("Firebase no está conectado aún. Por favor, recarga la página.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        // En móviles o Safari, Popup suele fallar por los bloqueadores integrados.
        // Redirect es el estándar seguro para Web Apps.
        await auth.signInWithRedirect(provider);
    } catch (error) {
        console.error("Error en login:", error);
        alert("No se pudo iniciar sesión. Código: " + error.code);
    }
}

async function logout() {
    if (!auth) return;
    try {
        await auth.signOut();
        window.location.reload();
    } catch (error) {
        console.error("Error en logout:", error);
    }
}

if (auth && db) {
    // ─── LÓGICA DE AUTH ────────────────────────────────────────────────

    // Escuchar cambios de estado del usuario
    auth.getRedirectResult().then((result) => {
        if (result.credential) {
            console.log("Login por redirección exitoso.");
        }
    }).catch((error) => {
        console.error("Error tras redirección:", error);
        if (error.code !== 'auth/redirect-cancelled-by-user') {
            alert("Error al volver de Google: " + error.message);
        }
    });

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Usuario identificado:", user.email);

            // 1. Obtener datos de Firestore (Premium status)
            let isPremium = false;

            // 👑 Acceso Administrador / Creador
            // Sustituye el correo de abajo por el tuyo real de Google
            const adminEmails = ["ifernandezillera@gmail.com"];
            if (adminEmails.includes(user.email)) {
                isPremium = true;
            }

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    isPremium = userDoc.data().is_premium || false;
                } else {
                    // Crear documento inicial si no existe
                    await db.collection('users').doc(user.uid).set({
                        email: user.email,
                        displayName: user.displayName,
                        is_premium: false,
                        modifiedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            } catch (e) {
                console.warn("No se pudo acceder a Firestore (probablemente reglas de seguridad):", e);
            }

            // 2. Actualizar UI
            updateUserUI(user, isPremium);

            // 3. Informar al UsageTracker
            if (window.UsageTracker) {
                window.UsageTracker.setPremiumStatus(isPremium);
            }
        } else {
            renderLoginButton();
            if (window.UsageTracker) {
                window.UsageTracker.setPremiumStatus(false);
            }
        }
    });
} else {
    console.log("Autenticación no disponible.");
}

// ─── RENDERIZADO DE UI ─────────────────────────────────────────────

function renderLoginButton() {
    userProfileContainer.innerHTML = `
        <button id="login-btn" class="login-btn" onclick="if(window.FirebaseAuth) window.FirebaseAuth.loginWithGoogle()">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="G">
            Entrar con Google
        </button>
    `;
    const btn = document.getElementById('login-btn');
    if (btn) btn.addEventListener('click', loginWithGoogle);
}

function updateUserUI(user, isPremium) {
    const photoURL = user.photoURL || 'https://www.gravatar.com/avatar/000?d=mp';
    const premiumTag = isPremium ? '<span class="premium-badge">PREMIUM</span>' : '<span class="free-badge">FREE</span>';

    userProfileContainer.innerHTML = `
        <div class="user-info">
            <img src="${photoURL}" class="user-avatar" alt="Avatar">
            <div class="user-details">
                <span class="user-name">${user.displayName}</span>
                ${premiumTag}
            </div>
            <button id="logout-btn" class="logout-link">Cerrar</button>
        </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', logout);
}

// Hacer funciones globales para que otros scripts las vean si es necesario
window.FirebaseAuth = {
    loginWithGoogle,
    logout,
    getCurrentUser: () => auth.currentUser
};
