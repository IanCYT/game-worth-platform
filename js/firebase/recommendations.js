let userRecommendations = [];

async function generateRecommendations() {
    if (!currentUser) return;

    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('analytics')
            .where('type', '==', 'game_view')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        if (snapshot.empty) {
            hideRecommendations();
            return;
        }

        // Tally genre frequency from viewed games
        const genreCounts = {};
        const viewedGameIds = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.gameGenre) {
                genreCounts[data.gameGenre] = (genreCounts[data.gameGenre] || 0) + 1;
            }
            if (data.gameId) {
                viewedGameIds.add(data.gameId);
            }
        });

        // Get top 3 genres
        const topGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);

        if (topGenres.length === 0) {
            hideRecommendations();
            return;
        }

        // Filter games: match top genres, exclude already-viewed, sort by rating
        userRecommendations = games
            .filter(game => topGenres.includes(game.genre) && !viewedGameIds.has(game.id))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        if (userRecommendations.length === 0) {
            hideRecommendations();
            return;
        }

        renderRecommendations(userRecommendations);
    } catch (err) {
        console.warn('Recommendations failed:', err);
        hideRecommendations();
    }
}

function renderRecommendations(recs) {
    const section = document.getElementById('recommendationsSection');
    const grid = document.getElementById('recommendationsGrid');

    if (!recs || recs.length === 0) {
        hideRecommendations();
        return;
    }

    grid.innerHTML = '';

    recs.forEach((game, index) => {
        const starCount = Math.floor(game.rating / 2);
        const starsHtml = [...Array(5)].map((_, i) => {
            const isFilled = i < starCount;
            return `<span class="star ${isFilled ? 'filled' : 'empty'}">★</span>`;
        }).join('');

        const card = document.createElement('div');
        card.className = `rec-card delay-${(index % 6) + 1}`;
        card.style.cursor = 'pointer';
        card.onclick = () => openDetails(game.id);
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-content">
                    <div class="verdict-badge ${getVerdictClass(game.verdict)}">
                        ${getVerdictLabel(game.verdict)}
                    </div>
                    <h2 class="game-title" style="font-size:1.1rem;">${game.title}</h2>
                    <p class="game-genre">${game.genre}</p>
                    <div class="rating-row" style="margin-bottom:0;padding-bottom:0;border:none;">
                        <div style="display: flex; align-items: center;">
                            <div class="stars">${starsHtml}</div>
                            <span class="rating-number">${game.rating}</span>
                        </div>
                        <span class="price-value" style="font-size:0.9rem;">${game.price}</span>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    section.style.display = 'block';
}

function hideRecommendations() {
    const section = document.getElementById('recommendationsSection');
    if (section) {
        section.style.display = 'none';
    }
}
