// cloud-sync.js
// Usa el SDK "compat" inyectado globalmente en index.html por los CDN de Firebase v8.

let isSyncing = false;
let syncTimeout = null;

window.saveBoardToCloud = async function (uid, boardState, rackInputs) {
    if (!uid || isSyncing) return;
    if (typeof firebase === 'undefined' || !firebase.firestore) return;

    // Debounce to prevent spamming Firestore on rapid clicks
    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(async () => {
        isSyncing = true;
        try {
            const db = firebase.firestore();
            // Serialize board: 15 strings of 15 chars (space for empty)
            const serializedBoard = [];
            for (let r = 0; r < 15; r++) {
                let rowStr = "";
                for (let c = 0; c < 15; c++) {
                    const char = boardState[r][c].letter;
                    const isWildcard = boardState[r][c].element.classList.contains('is-wildcard');
                    if (!char) {
                        rowStr += ".";
                    } else if (isWildcard) {
                        rowStr += char.toLowerCase(); // Lowercase denotes wildcard
                    } else {
                        rowStr += char.toUpperCase();
                    }
                }
                serializedBoard.push(rowStr);
            }

            // Serialize rack
            const serializedRack = Array.from(rackInputs).map(i => i.value || '.').join('');

            await db.collection("boards").doc(uid).set({
                board: serializedBoard,
                rack: serializedRack,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log("Board synced to cloud for", uid);
        } catch (error) {
            console.error("Cloud Sync Error:", error);
        } finally {
            isSyncing = false;
        }
    }, 1500); // 1.5s debounce
}

window.loadBoardFromCloud = async function (uid, placeLetterFn, removeLetterFn, rackInputs) {
    if (!uid) return false;
    if (typeof firebase === 'undefined' || !firebase.firestore) return null;

    try {
        const db = firebase.firestore();
        const docSnap = await db.collection("boards").doc(uid).get();

        if (docSnap.exists) {
            const data = docSnap.data();

            // Restore Rack
            if (data.rack && data.rack.length === 7) {
                for (let i = 0; i < 7; i++) {
                    const char = data.rack[i];
                    rackInputs[i].value = char === '.' ? '' : char;
                }
            }

            // Restore Board
            return data.board;
        }
        return null;
    } catch (error) {
        console.error("Cloud Load Error:", error);
        return null;
    }
}
