/**
 * Firebase Manager (Firestore Version)
 * Online Ranking System for Aether Dungeon
 */

let db = null;
let isInitialized = false;

/**
 * Initializes Firebase with the provided configuration.
 * @param {Object} config - Firebase configuration object.
 */
export function initFirebase(config) {
    if (isInitialized) return;

    try {
        const { initializeApp } = window.firebaseApp;
        const { getFirestore } = window.firebaseFirestore;

        const app = initializeApp(config);
        db = getFirestore(app);
        isInitialized = true;
        console.log("[Firebase Firestore] Initialized successfully.");
    } catch (error) {
        console.error("[Firebase Firestore] Initialization failed:", error);
    }
}

/**
 * Submits a score to the 'leaderboard' collection.
 * @param {string} playerName 
 * @param {number} score 
 * @returns {Promise<void>}
 */
export async function submitScore(playerName, score) {
    if (!isInitialized || !db) {
        console.warn("[Firebase Firestore] Not initialized. Score not submitted.");
        return;
    }

    try {
        const { collection, addDoc, serverTimestamp } = window.firebaseFirestore;

        await addDoc(collection(db, "leaderboard"), {
            name: playerName,
            score: Math.floor(score),
            timestamp: serverTimestamp()
        });

        console.log("[Firebase Firestore] Score submitted:", playerName, score);
    } catch (error) {
        console.error("[Firebase Firestore] Error submitting score:", error);
        throw error;
    }
}

/**
 * Fetches the top rankings from Firestore.
 * @param {number} limitCount 
 * @returns {Promise<Array>}
 */
export async function fetchTopRankings(limitCount = 10) {
    if (!isInitialized || !db) {
        console.warn("[Firebase Firestore] Not initialized. Fetch failed.");
        return [];
    }

    try {
        const { collection, getDocs, query, orderBy, limit } = window.firebaseFirestore;

        const q = query(
            collection(db, "leaderboard"),
            orderBy("score", "desc"),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const rankings = [];
        querySnapshot.forEach((doc) => {
            rankings.push(doc.data());
        });

        return rankings;
    } catch (error) {
        console.error("[Firebase Firestore] Error fetching rankings:", error);
        return [];
    }
}
