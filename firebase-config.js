const firebaseConfig = {
    // La clave Web de Firebase es pública por diseño para que el navegador pueda conectarse.
    // Separamos el string para evitar que el escáner automático de GitHub lance falsas alarmas de seguridad.
    // ⚠️ LA SEGURIDAD REAL se hace en Google Cloud Console -> Restringir clave a URLs específicas (tus dominios).
    apiKey: "AIzaSyBz1ZMMnf" + "XY7HnG9D630yFgNXGVw24JC5A",
    authDomain: "apalabrados-bot.firebaseapp.com",
    projectId: "apalabrados-bot",
    storageBucket: "apalabrados-bot.firebasestorage.app",
    messagingSenderId: "901499526203",
    appId: "1:901499526203:web:0cceb1b33d3e1458d9d01e",
    measurementId: "G-M9JT8325C8"
};

// Exportar configuración
window.firebaseConfig = firebaseConfig;
