// Import Firebase SDK modules via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace with your own free Firebase project credentials from Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('auth-screen');
    const coupleScreen = document.getElementById('couple-screen');
    const appScreen = document.getElementById('app-screen');

    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const switchAuthText = document.getElementById('switch-auth-text');
    const switchAuthLink = document.getElementById('switch-auth-link');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');

    const createCoupleBtn = document.getElementById('create-couple-btn');
    const displayCodeBox = document.getElementById('display-code-box');
    const generatedCode = document.getElementById('generated-code');
    const enterAppFromCreate = document.getElementById('enter-app-from-create');
    const joinCodeInput = document.getElementById('join-code-input');
    const joinCoupleBtn = document.getElementById('join-couple-btn');

    let isLoginMode = true;
    let currentCoupleCode = localStorage.getItem('active_couple_code') || null;
    let currentUserEmail = null;

    // --- FIREBASE AUTH STATE LISTENER ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserEmail = user.email;
            document.getElementById('user-email-display').textContent = user.email;
            authScreen.classList.remove('active');

            if (currentCoupleCode) {
                coupleScreen.classList.remove('active');
                appScreen.classList.add('active');
                initCloudApp(currentCoupleCode);
            } else {
                coupleScreen.classList.add('active');
            }
        } else {
            appScreen.classList.remove('active');
            coupleScreen.classList.remove('active');
            authScreen.classList.add('active');
        }
    });

    // --- AUTH TOGGLE ---
    switchAuthLink.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = "Welcome Back";
            authSubmitBtn.textContent = "Log In";
            switchAuthText.textContent = "Don't have an account?";
            switchAuthLink.textContent = "Sign Up";
        } else {
            authTitle.textContent = "Create Account";
            authSubmitBtn.textContent = "Sign Up";
            switchAuthText.textContent = "Already have an account?";
            switchAuthLink.textContent = "Log In";
        }
    });

    // --- LOGIN / SIGNUP WITH FIREBASE AUTH ---
    authSubmitBtn.addEventListener('click', async () => {
        const email = authEmail.value.trim();
        const pwd = authPassword.value.trim();
        if (!email || !pwd) { alert('Please fill in all fields'); return; }

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pwd);
            } else {
                await createUserWithEmailAndPassword(auth, email, pwd);
                alert('Account created successfully!');
            }
        } catch (error) {
            alert('Authentication Error: ' + error.message);
        }
    });

    // --- CREATE COUPLE SPACE IN FIRESTORE ---
    createCoupleBtn.addEventListener('click', async () => {
        const code = 'LOVE-' + Math.floor(1000 + Math.random() * 9000);
        try {
            await setDoc(doc(db, "couples", code), {
                createdAt: new Date(),
                createdBy: currentUserEmail,
                partnerJoined: false
            });
            currentCoupleCode = code;
            localStorage.setItem('active_couple_code', code);
            generatedCode.textContent = code;
            displayCodeBox.classList.remove('hidden');
        } catch (err) {
            alert('Error creating space: ' + err.message);
        }
    });

    enterAppFromCreate.addEventListener('click', () => {
        coupleScreen.classList.remove('active');
        appScreen.classList.add('active');
        initCloudApp(currentCoupleCode);
    });

    // --- JOIN COUPLE SPACE IN FIRESTORE ---
    joinCoupleBtn.addEventListener('click', async () => {
        const code = joinCodeInput.value.trim().toUpperCase();
        if (!code) { alert('Enter couple code'); return; }

        try {
            const coupleDocRef = doc(db, "couples", code);
            const docSnap = await getDoc(coupleDocRef);

            if (docSnap.exists()) {
                await updateDoc(coupleDocRef, { partnerJoined: true, partnerEmail: currentUserEmail });
                currentCoupleCode = code;
                localStorage.setItem('active_couple_code', code);
                coupleScreen.classList.remove('active');
                appScreen.classList.add('active');
                initCloudApp(code);
            } else {
                alert('Couple code not found!');
            }
        } catch (err) {
            alert('Error joining: ' + err.message);
        }
    });

    // Logout
    document.getElementById('settings-logout-btn').addEventListener('click', async () => {
        await signOut(auth);
        localStorage.removeItem('active_couple_code');
        window.location.reload();
    });

    // --- REAL-TIME CLOUD APP LOGIC (Firestore Sync) ---
    function initCloudApp(coupleCode) {
        document.getElementById('settings-code-text').textContent = coupleCode;

        // Tab Switching
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        const tabPanes = document.querySelectorAll('.app-content .tab-pane');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(n => n.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                document.getElementById(`tab-${item.dataset.tab}`).classList.add('active');
            });
        });

        // 1. Real-time Chat Sync
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendChatBtn = document.getElementById('send-chat-btn');

        const q = query(collection(db, "couples", coupleCode, "chats"), orderBy("timestamp", "asc"));
        onSnapshot(q, (snapshot) => {
            chatMessages.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const msg = docSnap.data();
                const bubble = document.createElement('div');
                bubble.className = `chat-bubble ${msg.sender === currentUserEmail ? 'sent' : 'received'}`;
                bubble.textContent = msg.text;
                chatMessages.appendChild(bubble);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        sendChatBtn.addEventListener('click', async () => {
            const text = chatInput.value.trim();
            if (!text) return;
            await addDoc(collection(db, "couples", coupleCode, "chats"), {
                text: text,
                sender: currentUserEmail,
                timestamp: new Date()
            });
            chatInput.value = '';
        });

        // 2. Real-time Live GPS Location Sync
        const distanceNum = document.getElementById('home-distance-num');
        const modalDistanceVal = document.getElementById('modal-distance-val');
        const refreshGpsBtn = document.getElementById('refresh-gps-btn');

        function updateMyGPS() {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                await setDoc(doc(db, "couples", coupleCode, "locations", currentUserEmail.replace('.', '_')), {
                    lat: lat, lon: lon, updatedAt: new Date()
                }, { merge: true });
            });
        }

        updateMyGPS();
        refreshGpsBtn.addEventListener('click', updateMyGPS);

        // Listen to partner's location in real-time
        onSnapshot(collection(db, "couples", coupleCode, "locations"), (snapshot) => {
            let locs = [];
            snapshot.forEach(docSnap => locs.push(docSnap.data()));
            if (locs.length >= 2) {
                const dist = calculateHaversine(locs[0].lat, locs[0].lon, locs[1].lat, locs[1].lon);
                distanceNum.textContent = `${dist} km apart`;
                modalDistanceVal.textContent = `${dist} KM`;
            } else {
                distanceNum.textContent = "Waiting for partner GPS...";
            }
        });
    }

    function calculateHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))));
    }
});
