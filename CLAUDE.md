# CLAUDE.md — Game.Worth Platform

## Project Overview

**Game.Worth** is a game review platform that helps users browse games, see ratings/verdicts, filter by genre/platform, and compare prices via direct store links. Users can sign in to track favorites, build wishlists, and get personalized recommendations based on browsing history.

## Architecture

```
game-worth-platform/
├── index.html              # HTML markup only (no inline CSS/JS)
├── css/
│   └── styles.css          # All styles (dark/light themes, responsive, auth, cards)
├── js/
│   ├── data/
│   │   └── games.js        # Game data array (~115 games)
│   ├── app.js              # Core app logic: filters, search, sort, render, modal
│   ├── theme.js            # Dark/light theme toggle + localStorage
│   └── firebase/
│       ├── config.js       # Firebase init (PLACEHOLDER config — replace before use)
│       ├── auth.js         # Auth UI, sign-in/sign-up/Google, user profile
│       ├── firestore.js    # Favorites, wishlist, view mode
│       ├── analytics.js    # Event tracking (views, clicks, search, filters)
│       └── recommendations.js  # Personalized game recommendations
├── .claude/
│   └── settings.json
├── CLAUDE.md
└── game-review-platform.html   # Legacy version (unused)
```

## Tech Stack

- HTML5, CSS3 (gradients, backdrop-filter, CSS Grid, Flexbox, animations)
- Vanilla JavaScript (ES6+) — no frameworks, no bundler
- Firebase (Auth + Firestore) via CDN compat SDK
- localStorage for theme persistence

## Script Load Order (critical — no ES modules)

```html
<!-- Firebase SDK (CDN) -->
firebase-app-compat.js → firebase-auth-compat.js → firebase-firestore-compat.js
<!-- App scripts -->
games.js → config.js → auth.js → firestore.js → analytics.js → recommendations.js → theme.js → app.js
```

## Firebase Setup

The project uses Firebase Auth + Firestore. Config is in `js/firebase/config.js` with placeholder values. To enable:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Email/Password and Google sign-in in Authentication
3. Create a Firestore database
4. Replace `YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc. in `js/firebase/config.js`

### Firestore Data Model

- **`users/{uid}`** — displayName, email, photoURL, favoriteGenres[], preferredPlatforms[], createdAt, lastLoginAt
- **`users/{uid}/favorites/{gameId}`** — gameId, title, genre, addedAt
- **`users/{uid}/wishlist/{gameId}`** — gameId, title, genre, price, addedAt
- **`users/{uid}/analytics/{auto-id}`** — type, gameId, gameGenre, storeName, query, filterValue, timestamp

## Key Features

- **Game database**: ~115 curated games with rating (0-10), verdict (worth/mixed/skip), price, priceRange, tags
- **Filtering**: by genre and platform
- **Search**: real-time case-insensitive title search
- **Sorting**: by rating or review count
- **Game detail modal**: expanded info with store purchase links + analytics tracking
- **User auth**: email/password + Google sign-in
- **Favorites & Wishlist**: heart/star buttons on cards and in modal, synced to Firestore
- **View modes**: All Games / My Favorites / My Wishlist
- **Analytics**: tracks game views, store clicks, searches, filter usage (logged-in users only)
- **Recommendations**: personalized "Recommended For You" based on most-viewed genres
- **Dark/light theme**: persisted via localStorage
- **Responsive**: mobile (1-col), tablet (2-col at 768px), desktop (3-col at 1024px)

## Game Data Model

```js
{
  id: number,
  title: string,
  genre: string,
  platform: string,
  rating: number,       // 0-10
  reviews: number,
  verdict: string,      // "worth" | "mixed" | "skip"
  price: string,
  priceRange: { min, max },
  description: string,
  tags: string[]
}
```

## Conventions

- **JS**: camelCase, functional style (no classes), template literals for HTML, globals (no ES modules)
- **CSS**: kebab-case classes, verdict color coding (green=worth, orange=mixed, red=skip), both dark and `body.light-mode` variants for every component
- **Auth gating**: features like favorites/wishlist prompt sign-in if user is not authenticated
- **Analytics**: only tracked for logged-in users to conserve Firestore quota
- **`event.stopPropagation()`**: required on card action buttons to prevent modal from opening

## Development Workflow

- No build step — edit files and refresh browser
- Must serve via HTTP (not `file://`) for Firebase SDK to work — use `npx serve` or VS Code Live Server
- Test both dark and light themes after visual changes
- Test logged-in and logged-out states for auth-dependent features

## When Making Changes

- Add new games to `js/data/games.js` following the existing data model
- UI changes: edit `index.html` (markup) and `css/styles.css` (styles) separately
- App logic: edit `js/app.js`
- Firebase features: edit files in `js/firebase/`
- Always provide `body.light-mode` CSS variants for new components
- Store links are generated in `openDetails()` in `js/app.js` with `trackStoreClick()` calls
