let searchDebounceTimer;

async function trackEvent(type, data = {}) {
    if (!currentUser) return;

    try {
        await db.collection('users').doc(currentUser.uid).collection('analytics').add({
            type: type,
            ...data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
        console.warn('Analytics tracking failed:', err);
    }
}

function trackGameView(gameId, genre) {
    trackEvent('game_view', { gameId, gameGenre: genre });
}

function trackStoreClick(gameId, storeName) {
    trackEvent('store_click', { gameId, storeName });
}

function trackSearchDebounced(query) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        if (query.length >= 2) {
            trackEvent('search', { query });
        }
    }, 1000);
}

function trackFilter(type, value) {
    trackEvent('filter_' + type, { filterValue: value });
}
