// configuración de Firebase — Apalabrados Bot
// Debes rellenar estos valores con la configuración de tu proyecto en Firebase Console
// Configuración de la cuenta de Firebase: https://console.firebase.google.com/

const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID",
    measurementId: "G-LBRNZR24DC" // Ya lo tenemos de antes
};

// Exportar configuración si usas módulos, o dejarla global
window.firebaseConfig = firebaseConfig;
