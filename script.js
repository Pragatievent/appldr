// Import Firebase SDK modules via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCKcUpYblUPXLqEOb4HXVEW2UoJWBTj5fQ",
    authDomain: "aapldr-db8cc.firebaseapp.com",
    projectId: "aapldr-db8cc",
    storageBucket: "aapldr-db8cc.firebasestorage.app",
    messagingSenderId: "41936129144",
    appId: "1:41936129144:web:dde915da4bcf73cec6718d",
    measurementId: "G-G655PVB97P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
        const emailDisplay = document.getElementById('user-email-display');
        if (emailDisplay) emailDisplay.textContent = user.email;
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
            alert('Success! Cloud space created with code: ' + code); // Confirms cloud write
        } catch (err) {
            alert('Error creating space: ' + err.message);
        }
    });

    // --- ENTER APP AFTER CREATING CODE ---
    enterAppFromCreate.addEventListener('click', () => {
        if (!currentCoupleCode) {
            currentCoupleCode = generatedCode.textContent.trim() || localStorage.getItem('active_couple_code');
        }
        
        if (!currentCoupleCode) {
            alert('Please create a couple space first!');
            return;
        }

        coupleScreen.classList.remove('active');
        appScreen.classList.add('active');
        initCloudApp(currentCoupleCode);
    });

// --- JOIN COUPLE SPACE IN FIRESTORE ---
joinCoupleBtn.addEventListener('click', async () => {
    let rawInput = joinCodeInput.value.trim().toUpperCase();
    if (!rawInput) { alert('Enter couple code'); return; }

    // Automatically prepend "LOVE-" if the user only typed numbers
    let code = rawInput;
    if (/^\d+$/.test(rawInput)) {
        code = 'LOVE-' + rawInput;
    }

    console.log("Looking for code:", JSON.stringify(code));

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
            alert(`Code "${code}" not found in database! Please check spelling.`);
        }
    } catch (err) {
        alert('Error joining: ' + err.message);
    }
});

// Logout
const logoutBtn = document.getElementById('settings-logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        localStorage.removeItem('active_couple_code');
        window.location.reload();
    });
}

// --- REAL-TIME CLOUD APP LOGIC (Firestore Sync) ---
function initCloudApp(coupleCode) {
    const settingsCodeText = document.getElementById('settings-code-text');
    if (settingsCodeText) settingsCodeText.textContent = coupleCode;

    // Tab Switching
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const tabPanes = document.querySelectorAll('.app-content .tab-pane');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const target = document.getElementById(`tab-${item.dataset.tab}`);
            if (target) target.classList.add('active');
        });
    });

    // 1. Real-time Chat Sync
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');

    if (chatMessages && chatInput && sendChatBtn) {
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
    }

    // 2. Real-time Live GPS Location Sync
    const distanceNum = document.getElementById('home-distance-num');
    const modalDistanceVal = document.getElementById('modal-distance-val');
    const refreshGpsBtn = document.getElementById('refresh-gps-btn');

    function updateMyGPS() {
        if (!navigator.geolocation || !currentUserEmail) return;
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            await setDoc(doc(db, "couples", coupleCode, "locations", currentUserEmail.replace(/[@.]/g, '_')), {
                lat: lat, lon: lon, updatedAt: new Date()
            }, { merge: true });
        }, (err) => {
            console.log("GPS Notice:", err.message);
        });
    }

    updateMyGPS();
    if (refreshGpsBtn) refreshGpsBtn.addEventListener('click', updateMyGPS);

    onSnapshot(collection(db, "couples", coupleCode, "locations"), (snapshot) => {
        let locs = [];
        snapshot.forEach(docSnap => locs.push(docSnap.data()));
        if (locs.length >= 2 && distanceNum && modalDistanceVal) {
            const dist = calculateHaversine(locs[0].lat, locs[0].lon, locs[1].lat, locs[1].lon);
            distanceNum.textContent = `${dist} km apart`;
            modalDistanceVal.textContent = `${dist} KM`;
        } else if (distanceNum) {
            distanceNum.textContent = "Waiting for partner GPS...";
        }
    });

    // 3. Real-time Tasks Sync
    const homeTaskPreviewList = document.getElementById('home-task-preview-list');
    const fullTaskList = document.getElementById('full-task-list');
    const openAddTaskBtn = document.getElementById('open-add-task-btn');
    const viewAllTasksBtn = document.getElementById('view-all-tasks-btn');
    const tasksModal = document.getElementById('tasks-modal');
    const closeTasksModal = document.getElementById('close-tasks-modal');

    if (viewAllTasksBtn && tasksModal) {
        viewAllTasksBtn.addEventListener('click', () => tasksModal.classList.remove('hidden'));
    }
    if (closeTasksModal && tasksModal) {
        closeTasksModal.addEventListener('click', () => tasksModal.classList.add('hidden'));
    }

    if (openAddTaskBtn) {
        openAddTaskBtn.addEventListener('click', async () => {
            const taskText = prompt("Enter a new task for today:");
            if (!taskText) return;
            await addDoc(collection(db, "couples", coupleCode, "tasks"), {
                text: taskText,
                completed: false,
                createdAt: new Date()
            });
        });
    }

    if (fullTaskList && homeTaskPreviewList) {
        const tasksQuery = query(collection(db, "couples", coupleCode, "tasks"), orderBy("createdAt", "desc"));
        onSnapshot(tasksQuery, (snapshot) => {
            fullTaskList.innerHTML = '';
            homeTaskPreviewList.innerHTML = '';
            let tasks = [];
            snapshot.forEach((docSnap) => {
                tasks.push({ id: docSnap.id, ...docSnap.data() });
            });

            if (tasks.length === 0) {
                homeTaskPreviewList.innerHTML = `<li class="task-item"><span>No tasks yet. Tap 'View all' to add one!</span></li>`;
                return;
            }

            tasks.forEach((task, index) => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.innerHTML = `
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span>${task.text}</span>
                `;
                const checkbox = li.querySelector('input');
                checkbox.addEventListener('change', async () => {
                    await updateDoc(doc(db, "couples", coupleCode, "tasks", task.id), {
                        completed: checkbox.checked
                    });
                });
                fullTaskList.appendChild(li);

                if (index < 3) {
                    const previewLi = li.cloneNode(true);
                    const previewCheckbox = previewLi.querySelector('input');
                    previewCheckbox.addEventListener('change', async () => {
                        await updateDoc(doc(db, "couples", coupleCode, "tasks", task.id), {
                            completed: previewCheckbox.checked
                        });
                    });
                    homeTaskPreviewList.appendChild(previewLi);
                }
            });
        });
    }

    // 4. Real-time Plans / Timeline Sync
    const timelineContainer = document.getElementById('timeline-container');
    const openAddPlanModal = document.getElementById('open-add-plan-modal');

    if (openAddPlanModal) {
        openAddPlanModal.addEventListener('click', async () => {
            const planTitle = prompt("Enter plan title (e.g., ❤️ Video Call):");
            if (!planTitle) return;
            const planTime = prompt("Enter time/date (e.g., Tonight • 8:30 PM):");
            if (!planTime) return;

            await addDoc(collection(db, "couples", coupleCode, "plans"), {
                title: planTitle,
                time: planTime,
                createdAt: new Date()
            });
        });
    }

    if (timelineContainer) {
        const plansQuery = query(collection(db, "couples", coupleCode, "plans"), orderBy("createdAt", "asc"));
        onSnapshot(plansQuery, (snapshot) => {
            timelineContainer.innerHTML = `<div class="timeline-group-label">UPCOMING PLANS</div>`;
            snapshot.forEach((docSnap) => {
                const plan = docSnap.data();
                const card = document.createElement('div');
                card.className = 'timeline-card';
                card.innerHTML = `
                    <strong>${plan.title}</strong>
                    <p>${plan.time}</p>
                `;
                timelineContainer.appendChild(card);
            });
        });
    }
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
