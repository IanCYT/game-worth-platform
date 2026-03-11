let currentUser = null;
const googleProvider = new firebase.auth.GoogleAuthProvider();

// --- Auth Modal ---

function showAuthModal(mode = 'signin') {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    switchAuthTab(mode);
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    clearAuthError();
}

function switchAuthTab(mode) {
    const signinTab = document.getElementById('signinTab');
    const signupTab = document.getElementById('signupTab');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const authTitle = document.getElementById('authTitle');

    if (mode === 'signin') {
        signinTab.classList.add('active');
        signupTab.classList.remove('active');
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
        authTitle.textContent = 'Welcome Back';
    } else {
        signupTab.classList.add('active');
        signinTab.classList.remove('active');
        signupForm.style.display = 'block';
        signinForm.style.display = 'none';
        authTitle.textContent = 'Create Account';
    }
    clearAuthError();
}

function showAuthError(message) {
    const errorEl = document.getElementById('authError');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function clearAuthError() {
    const errorEl = document.getElementById('authError');
    errorEl.textContent = '';
    errorEl.style.display = 'none';
}

// --- Auth Handlers ---

async function handleEmailSignUp() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        showAuthError('Please fill in all fields.');
        return;
    }
    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters.');
        return;
    }

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        await createUserProfile(cred.user, name);
        closeAuthModal();
    } catch (err) {
        showAuthError(getAuthErrorMessage(err.code));
    }
}

async function handleEmailSignIn() {
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;

    if (!email || !password) {
        showAuthError('Please fill in all fields.');
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal();
    } catch (err) {
        showAuthError(getAuthErrorMessage(err.code));
    }
}

async function handleGoogleSignIn() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        // Create profile if first time
        const doc = await db.collection('users').doc(result.user.uid).get();
        if (!doc.exists) {
            await createUserProfile(result.user, result.user.displayName);
        }
        closeAuthModal();
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            showAuthError(getAuthErrorMessage(err.code));
        }
    }
}

async function handleSignOut() {
    await auth.signOut();
    closeUserDropdown();
}

async function handleForgotPassword() {
    const email = document.getElementById('signinEmail').value.trim();
    if (!email) {
        showAuthError('Enter your email address first.');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        showAuthError('Password reset email sent! Check your inbox.');
    } catch (err) {
        showAuthError(getAuthErrorMessage(err.code));
    }
}

function getAuthErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',
        'auth/invalid-credential': 'Invalid email or password.'
    };
    return messages[code] || 'An error occurred. Please try again.';
}

// --- User Profile ---

async function createUserProfile(user, displayName) {
    await db.collection('users').doc(user.uid).set({
        displayName: displayName || user.displayName || 'Player',
        email: user.email,
        photoURL: user.photoURL || null,
        favoriteGenres: [],
        preferredPlatforms: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// --- Auth State Observer ---

function onAuthStateChanged(user) {
    currentUser = user;
    updateAuthUI(user);

    if (user) {
        // Update last login
        db.collection('users').doc(user.uid).update({
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});

        // Load user data
        loadUserFavorites();
        loadUserWishlist();
        generateRecommendations();
    } else {
        // Clear user data
        userFavorites.clear();
        userWishlist.clear();
        viewMode = 'all';
        hideRecommendations();
        renderGames();
    }
}

// --- Auth UI ---

function updateAuthUI(user) {
    const authBtn = document.getElementById('authBtn');
    const userMenu = document.getElementById('userMenu');

    if (user) {
        authBtn.style.display = 'none';
        userMenu.style.display = 'flex';

        const avatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userNameDisplay');

        const name = user.displayName || user.email.split('@')[0];
        userName.textContent = name;

        if (user.photoURL) {
            avatar.innerHTML = `<img src="${user.photoURL}" alt="${name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            avatar.textContent = initials;
        }

        // Show favorites/wishlist buttons
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = '');
    } else {
        authBtn.style.display = '';
        userMenu.style.display = 'none';

        // Hide favorites/wishlist buttons
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

function closeUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.remove('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    if (userMenu && !userMenu.contains(e.target)) {
        closeUserDropdown();
    }
});

// Setup auth modal close on background click
document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }
});

// Register auth state observer
auth.onAuthStateChanged(onAuthStateChanged);
