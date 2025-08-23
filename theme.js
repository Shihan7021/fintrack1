// theme.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const applyTheme = (theme) => {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    if (themeToggle) {
        themeToggle.checked = theme === 'dark';
    }
};

const saveThemePreference = async (userId, theme) => {
    if (!userId) return;
    try {
        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, { preferences: { theme: theme } }, { merge: true });
    } catch (error) {
        console.error("Error saving theme preference:", error);
    }
};

const loadThemePreference = async (userId) => {
    if (!userId) {
        applyTheme('light');
        return 'light';
    }
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().preferences && userDoc.data().preferences.theme) {
            const theme = userDoc.data().preferences.theme;
            applyTheme(theme);
            return theme;
        }
    } catch (error) {
        console.error("Error loading theme preference:", error);
    }
    applyTheme('light');
    return 'light';
};

export const setupTheme = () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadThemePreference(user.uid);
        } else {
            applyTheme('light');
        }
    });
};

export const setupThemeToggle = () => {
    const toggle = document.getElementById('theme-toggle-checkbox');
    if (!toggle) return;

    toggle.addEventListener('change', async () => {
        const theme = toggle.checked ? 'dark' : 'light';
        applyTheme(theme);
        const user = auth.currentUser;
        if (user) {
            await saveThemePreference(user.uid, theme);
        }
    });
};