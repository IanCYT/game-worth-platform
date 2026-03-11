const genres = ['all', 'Action RPG', 'RPG', 'Shooter', 'Action Adventure', 'Adventure', 'Hero Shooter'];
const platforms = ['all', 'PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Multi-Platform'];
let selectedGenre = 'all';
let selectedPlatform = 'all';
let searchQuery = '';
let sortBy = 'rating';
let currentDetailGameId = null;

function initializeFilters() {
    const filterContainer = document.getElementById('filterButtons');
    genres.forEach(genre => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (genre === 'all' ? ' active' : '');
        btn.textContent = genre === 'all' ? '◆ All Genres' : genre;
        btn.onclick = () => setGenre(genre);
        filterContainer.appendChild(btn);
    });
}

function initializePlatformFilters() {
    const platformContainer = document.getElementById('platformButtons');
    platforms.forEach(platform => {
        const btn = document.createElement('button');
        btn.className = 'platform-btn' + (platform === 'all' ? ' active' : '');
        btn.textContent = platform === 'all' ? '🎮 All Platforms' : platform;
        btn.onclick = () => setPlatform(platform);
        platformContainer.appendChild(btn);
    });
}

function setGenre(genre) {
    selectedGenre = genre;
    updateFilters();
    renderGames();
    trackFilter('genre', genre);
}

function setPlatform(platform) {
    selectedPlatform = platform;
    updatePlatformFilters();
    renderGames();
    trackFilter('platform', platform);
}

function setSortBy(sort) {
    sortBy = sort;
    const btns = document.querySelectorAll('.sort-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.sort-btn').classList.add('active');
    renderGames();
}

function updateFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach((btn, idx) => {
        if (genres[idx] === selectedGenre) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updatePlatformFilters() {
    const btns = document.querySelectorAll('.platform-btn');
    btns.forEach((btn, idx) => {
        if (platforms[idx] === selectedPlatform) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function getFilteredGames() {
    return games
        .filter(game => {
            const matchesGenre = selectedGenre === 'all' || game.genre === selectedGenre;
            const matchesPlatform = selectedPlatform === 'all' || game.platform.includes(selectedPlatform);
            const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());

            // View mode filtering
            let matchesView = true;
            if (typeof viewMode !== 'undefined') {
                if (viewMode === 'favorites') matchesView = userFavorites.has(game.id);
                if (viewMode === 'wishlist') matchesView = userWishlist.has(game.id);
            }

            return matchesGenre && matchesPlatform && matchesSearch && matchesView;
        })
        .sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'reviews') return b.reviews - a.reviews;
            return 0;
        });
}

function getVerdictLabel(verdict) {
    if (verdict === 'worth') return '✓ WORTH IT';
    if (verdict === 'mixed') return '≈ MIXED';
    return '✗ SKIP IT';
}

function getVerdictClass(verdict) {
    if (verdict === 'worth') return 'verdict-worth';
    if (verdict === 'mixed') return 'verdict-mixed';
    return 'verdict-skip';
}

function openDetails(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    currentDetailGameId = gameId;

    const starCount = Math.floor(game.rating / 2);
    const starsHtml = [...Array(5)].map((_, i) => {
        const isFilled = i < starCount;
        return `<span class="star ${isFilled ? 'filled' : 'empty'}">★</span>`;
    }).join('');

    const tagsHtml = game.tags.map(tag => `<span class="detailed-tag">${tag}</span>`).join('');

    document.getElementById('detailsTitle').textContent = game.title;
    document.getElementById('detailsGenre').textContent = game.genre;
    document.getElementById('detailsPlatform').textContent = '📱 ' + game.platform;
    document.getElementById('detailsDescription').textContent = game.description;
    document.getElementById('detailsStars').innerHTML = starsHtml;
    document.getElementById('detailsRatingNumber').textContent = game.rating;
    document.getElementById('detailsReviewCount').textContent = game.reviews + ' reviews';
    document.getElementById('detailsPrice').textContent = game.price;
    document.getElementById('detailsPriceRange').textContent = game.priceRange ? `${game.priceRange.min} - ${game.priceRange.max}` : 'N/A';
    document.getElementById('detailsTotalReviews').textContent = game.reviews.toLocaleString();
    document.getElementById('detailsTags').innerHTML = tagsHtml;

    const verdictBadge = document.getElementById('detailsVerdictBadge');
    verdictBadge.className = 'details-verdict-badge ' + getVerdictClass(game.verdict);
    verdictBadge.textContent = getVerdictLabel(game.verdict);

    // Update favorite/wishlist button states in modal
    updateModalFavWishButtons(gameId);

    // Generate buy links based on platform
    const buySection = document.getElementById('buySection');
    let buyLinksHtml = '<div style="width: 100%; padding-bottom: 1rem; border-bottom: 1px solid rgba(51, 65, 85, 0.5);"><div style="font-size: 0.875rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem;">Buy Now</div></div>';

    const platform = game.platform.toLowerCase();
    const gameSearchQuery = `${game.title} game`;
    let links = [];

    // Add appropriate store links based on platform
    if (platform.includes('pc') || platform.includes('steam')) {
        const steamQuery = game.title.replace(/:/g, '').split('–')[0].trim();
        links.push(`<a href="https://store.steampowered.com/search/?term=${encodeURIComponent(steamQuery)}" target="_blank" class="buy-btn buy-btn-steam" onclick="trackStoreClick(${game.id}, 'Steam')">🎮 Steam</a>`);
    }
    if (platform.includes('playstation') || platform.includes('ps')) {
        const psQuery = game.title.split(':')[0].trim();
        links.push(`<a href="https://www.playstation.com/en-us/search/${encodeURIComponent(psQuery)}" target="_blank" class="buy-btn buy-btn-playstation" onclick="trackStoreClick(${game.id}, 'PlayStation')">🎮 PlayStation Store</a>`);
    }
    if (platform.includes('xbox')) {
        const xboxQuery = game.title.split(':')[0].trim();
        links.push(`<a href="https://www.xbox.com/en-US/search?q=${encodeURIComponent(xboxQuery)}" target="_blank" class="buy-btn buy-btn-xbox" onclick="trackStoreClick(${game.id}, 'Xbox')">🎮 Xbox Store</a>`);
    }
    if (platform.includes('nintendo')) {
        const nintendoQuery = game.title.split(':')[0].trim();
        links.push(`<a href="https://www.google.com/search?q=${encodeURIComponent(nintendoQuery + ' Nintendo Switch eShop')}" target="_blank" class="buy-btn buy-btn-nintendo" onclick="trackStoreClick(${game.id}, 'Nintendo')">🎮 Nintendo eShop</a>`);
    }
    if (platform.includes('mobile') || platform.includes('ios') || platform.includes('android')) {
        const appQuery = game.title.split(':')[0].trim();
        links.push(`<a href="https://apps.apple.com/search?term=${encodeURIComponent(appQuery)}" target="_blank" class="buy-btn buy-btn-appstore" onclick="trackStoreClick(${game.id}, 'App Store')">🎮 App Store</a>`);
    }

    // Add Amazon as a backup option
    if (links.length === 0) {
        links.push(`<a href="https://www.amazon.com/s?k=${encodeURIComponent(gameSearchQuery)}" target="_blank" class="buy-btn buy-btn-amazon" onclick="trackStoreClick(${game.id}, 'Amazon')">🛒 Buy on Amazon</a>`);
    } else {
        links.push(`<a href="https://www.amazon.com/s?k=${encodeURIComponent(gameSearchQuery)}" target="_blank" class="buy-btn buy-btn-amazon" onclick="trackStoreClick(${game.id}, 'Amazon')">🛒 Amazon</a>`);
    }

    buySection.innerHTML = buyLinksHtml + '<div style="display: flex; flex-wrap: wrap; gap: 1rem;">' + links.join('') + '</div>';

    document.getElementById('detailsModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Track game view
    trackGameView(gameId, game.genre);
}

function closeDetails() {
    document.getElementById('detailsModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentDetailGameId = null;
}

// Close modal when clicking outside
const setupModalListener = () => {
    const modal = document.getElementById('detailsModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDetails();
        }
    });
}

function renderGames() {
    const filtered = getFilteredGames();
    const grid = document.getElementById('gamesGrid');
    const noResults = document.getElementById('noResults');

    grid.innerHTML = '';

    if (filtered.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    filtered.forEach((game, index) => {
        const starCount = Math.floor(game.rating / 2);
        const starsHtml = [...Array(5)].map((_, i) => {
            const isFilled = i < starCount;
            return `<span class="star ${isFilled ? 'filled' : 'empty'}">★</span>`;
        }).join('');

        const tagsHtml = game.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        // Favorite/wishlist button states
        const favActive = (typeof userFavorites !== 'undefined' && userFavorites.has(game.id));
        const wishActive = (typeof userWishlist !== 'undefined' && userWishlist.has(game.id));
        const showActions = (typeof currentUser !== 'undefined' && currentUser !== null);

        const card = document.createElement('div');
        card.className = `game-card delay-${(index % 10) + 1}`;
        card.style.cursor = 'pointer';
        card.onclick = () => openDetails(game.id);
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-content">
                    <div class="verdict-badge ${getVerdictClass(game.verdict)}">
                        ${getVerdictLabel(game.verdict)}
                    </div>
                    <h2 class="game-title">${game.title}</h2>
                    <p class="game-genre">${game.genre}</p>
                    <p class="game-platform">📱 ${game.platform}</p>
                    <p class="game-description">${game.description}</p>
                    <div class="tags">${tagsHtml}</div>
                    <div class="rating-row">
                        <div style="display: flex; align-items: center;">
                            <div class="stars">${starsHtml}</div>
                            <span class="rating-number">${game.rating}</span>
                        </div>
                        <span class="review-count">${game.reviews} reviews</span>
                    </div>
                    <div class="price-row">
                        <span class="price-label">Price</span>
                        <span class="price-value">${game.price}</span>
                    </div>
                    ${showActions ? `
                    <div class="card-actions">
                        <button class="card-action-btn fav-btn ${favActive ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${game.id});" title="Favorite">
                            ${favActive ? '♥' : '♡'}
                        </button>
                        <button class="card-action-btn wish-btn ${wishActive ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${game.id});" title="Wishlist">
                            ${wishActive ? '★' : '☆'}
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGames();
    trackSearchDebounced(searchQuery);
});

// Scroll behavior to hide/show header
const header = document.querySelector('header');
const main = document.querySelector('main');

// Set initial margin based on header height
function updateMainMargin() {
    const headerHeight = header.offsetHeight;
    main.style.marginTop = (headerHeight + 30) + 'px';
}

updateMainMargin();
window.addEventListener('resize', updateMainMargin);

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;

    if (scrollTop > 50) {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
    }
});

initializeFilters();
initializePlatformFilters();
setupModalListener();
renderGames();
