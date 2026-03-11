let userFavorites = new Set();
let userWishlist = new Set();
let viewMode = 'all'; // 'all' | 'favorites' | 'wishlist'

// --- Favorites ---

async function toggleFavorite(gameId) {
    if (!currentUser) {
        showAuthModal('signin');
        return;
    }

    const ref = db.collection('users').doc(currentUser.uid).collection('favorites').doc(String(gameId));

    if (userFavorites.has(gameId)) {
        await ref.delete();
        userFavorites.delete(gameId);
    } else {
        const game = games.find(g => g.id === gameId);
        await ref.set({
            gameId: game.id,
            title: game.title,
            genre: game.genre,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        userFavorites.add(gameId);
    }

    renderGames();
    updateModalFavWishButtons(gameId);
}

async function toggleWishlist(gameId) {
    if (!currentUser) {
        showAuthModal('signin');
        return;
    }

    const ref = db.collection('users').doc(currentUser.uid).collection('wishlist').doc(String(gameId));

    if (userWishlist.has(gameId)) {
        await ref.delete();
        userWishlist.delete(gameId);
    } else {
        const game = games.find(g => g.id === gameId);
        await ref.set({
            gameId: game.id,
            title: game.title,
            genre: game.genre,
            price: game.price,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        userWishlist.add(gameId);
    }

    renderGames();
    updateModalFavWishButtons(gameId);
}

async function loadUserFavorites() {
    if (!currentUser) return;

    const snapshot = await db.collection('users').doc(currentUser.uid).collection('favorites').get();
    userFavorites.clear();
    snapshot.forEach(doc => {
        userFavorites.add(doc.data().gameId);
    });
    renderGames();
}

async function loadUserWishlist() {
    if (!currentUser) return;

    const snapshot = await db.collection('users').doc(currentUser.uid).collection('wishlist').get();
    userWishlist.clear();
    snapshot.forEach(doc => {
        userWishlist.add(doc.data().gameId);
    });
    renderGames();
}

function isFavorite(gameId) {
    return userFavorites.has(gameId);
}

function isWishlisted(gameId) {
    return userWishlist.has(gameId);
}

// --- View Mode ---

function setViewMode(mode) {
    if (!currentUser && mode !== 'all') {
        showAuthModal('signin');
        return;
    }

    viewMode = mode;

    // Update button active states
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.view-btn[data-view="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    renderGames();
}

// --- Modal Favorite/Wishlist Buttons ---

function updateModalFavWishButtons(gameId) {
    const favBtn = document.getElementById('detailsFavBtn');
    const wishBtn = document.getElementById('detailsWishBtn');
    if (!favBtn || !wishBtn) return;

    if (isFavorite(gameId)) {
        favBtn.innerHTML = '♥ Favorited';
        favBtn.classList.add('active');
    } else {
        favBtn.innerHTML = '♡ Favorite';
        favBtn.classList.remove('active');
    }

    if (isWishlisted(gameId)) {
        wishBtn.innerHTML = '★ Wishlisted';
        wishBtn.classList.add('active');
    } else {
        wishBtn.innerHTML = '☆ Wishlist';
        wishBtn.classList.remove('active');
    }
}
