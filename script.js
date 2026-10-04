// Import Firebase SDK modules via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
        if (authScreen) authScreen.classList.remove('active');

        if (currentCoupleCode) {
            if (coupleScreen) coupleScreen.classList.remove('active');
            if (appScreen) appScreen.classList.add('active');
            initCloudApp(currentCoupleCode);
        } else {
            if (coupleScreen) coupleScreen.classList.add('active');
        }
    } else {
        if (appScreen) appScreen.classList.remove('active');
        if (coupleScreen) coupleScreen.classList.remove('active');
        if (authScreen) authScreen.classList.add('active');
    }
});

// --- AUTH TOGGLE ---
if (switchAuthLink) {
    switchAuthLink.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            if (authTitle) authTitle.textContent = "Welcome Back";
            if (authSubmitBtn) authSubmitBtn.textContent = "Log In";
            if (switchAuthText) switchAuthText.textContent = "Don't have an account?";
            switchAuthLink.textContent = "Sign Up";
        } else {
            if (authTitle) authTitle.textContent = "Create Account";
            if (authSubmitBtn) authSubmitBtn.textContent = "Sign Up";
            if (switchAuthText) switchAuthText.textContent = "Already have an account?";
            switchAuthLink.textContent = "Log In";
        }
    });
}

// --- LOGIN / SIGNUP WITH FIREBASE AUTH ---
if (authSubmitBtn) {
    authSubmitBtn.addEventListener('click', async () => {
        const email = authEmail ? authEmail.value.trim() : '';
        const pwd = authPassword ? authPassword.value.trim() : '';
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
}

// --- CREATE COUPLE SPACE IN FIRESTORE ---
if (createCoupleBtn) {
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
            if (generatedCode) generatedCode.textContent = code;
            if (displayCodeBox) displayCodeBox.classList.remove('hidden');
            alert('Success! Cloud space created with code: ' + code);
        } catch (err) {
            alert('Error creating space: ' + err.message);
        }
    });
}

// --- ENTER APP AFTER CREATING CODE ---
if (enterAppFromCreate) {
    enterAppFromCreate.addEventListener('click', () => {
        if (!currentCoupleCode) {
            currentCoupleCode = (generatedCode ? generatedCode.textContent.trim() : '') || localStorage.getItem('active_couple_code');
        }
        
        if (!currentCoupleCode) {
            alert('Please create a couple space first!');
            return;
        }

        if (coupleScreen) coupleScreen.classList.remove('active');
        if (appScreen) appScreen.classList.add('active');
        initCloudApp(currentCoupleCode);
    });
}

// --- JOIN COUPLE SPACE IN FIRESTORE ---
if (joinCoupleBtn) {
    joinCoupleBtn.addEventListener('click', async () => {
        let rawInput = joinCodeInput ? joinCodeInput.value.trim().toUpperCase() : '';
        if (!rawInput) { alert('Enter couple code'); return; }

        let code = rawInput;
        if (/^\d+$/.test(rawInput)) {
            code = 'LOVE-' + rawInput;
        }

        try {
            const coupleDocRef = doc(db, "couples", code);
            const docSnap = await getDoc(coupleDocRef);

            if (docSnap.exists()) {
                await updateDoc(coupleDocRef, { partnerJoined: true, partnerEmail: currentUserEmail });
                currentCoupleCode = code;
                localStorage.setItem('active_couple_code', code);
                if (coupleScreen) coupleScreen.classList.remove('active');
                if (appScreen) appScreen.classList.add('active');
                initCloudApp(code);
            } else {
                alert(`Code "${code}" not found in database! Please check spelling.`);
            }
        } catch (err) {
            alert('Error joining: ' + err.message);
        }
    });
}

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

    // --- Dark Mode Toggle & Persistence ---
    const darkModeToggle = document.querySelector('.switch input');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Moments Subtabs Switching (Selfie vs Memories)
    const subtabBtns = document.querySelectorAll('.subtab-btn');
    const subtabPanes = document.querySelectorAll('.subtab-pane');
    subtabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            subtabBtns.forEach(b => b.classList.remove('active'));
            subtabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetPane = document.getElementById(`subtab-${btn.dataset.subtab}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // --- A. Editable & Live Countdown Sync ---
    const countdownCard = document.querySelector('.countdown-card');
    const countdownDays = document.querySelector('.countdown-days');
    const countdownTitleEl = document.querySelector('.countdown-title');
    const countdownLabelEl = document.querySelector('.countdown-label');

    if (countdownCard) {
        countdownCard.addEventListener('click', async () => {
            const newTitle = prompt("Enter countdown title (e.g., NEXT VISIT / ANNIVERSARY):", countdownTitleEl ? countdownTitleEl.textContent : "COUNTDOWN");
            if (!newTitle) return;
            const newDate = prompt("Enter target date (Format: YYYY-MM-DD, e.g., 2026-12-31):");
            if (!newDate) return;

            await updateDoc(doc(db, "couples", coupleCode), {
                countdownTitle: newTitle,
                countdownTarget: newDate
            });
            alert("Countdown updated successfully!");
        });
    }

    // --- B. "Our Story" Custom Modal Sync ---
    const menuOurStory = document.getElementById('menu-our-story');
    const storyModal = document.getElementById('story-modal');
    const closeStoryModal = document.getElementById('close-story-modal');
    const storyTextarea = document.getElementById('story-textarea');
    const saveStoryBtn = document.getElementById('save-story-btn');

    if (menuOurStory && storyModal) {
        menuOurStory.addEventListener('click', async () => {
            const coupleRef = doc(db, "couples", coupleCode);
            const docSnap = await getDoc(coupleRef);
            if (docSnap.exists()) {
                storyTextarea.value = docSnap.data().ourStory || "";
            }
            storyModal.classList.remove('hidden');
        });
    }

    if (closeStoryModal && storyModal) {
        closeStoryModal.addEventListener('click', () => storyModal.classList.add('hidden'));
    }

    if (saveStoryBtn) {
        saveStoryBtn.addEventListener('click', async () => {
            const newStory = storyTextarea.value.trim();
            const coupleRef = doc(db, "couples", coupleCode);
            await updateDoc(coupleRef, { ourStory: newStory });
            alert("✨ Our Story saved successfully!");
            storyModal.classList.add('hidden');
        });
    }

    // --- C. Important Dates Custom Modal Sync ---
    const menuDates = document.getElementById('menu-dates');
    const datesModal = document.getElementById('dates-modal');
    const closeDatesModal = document.getElementById('close-dates-modal');
    const datesListContainer = document.getElementById('dates-list-container');
    const newDateTitle = document.getElementById('new-date-title');
    const newDateValue = document.getElementById('new-date-value');
    const saveDateBtn = document.getElementById('save-date-btn');

    async function loadImportantDates(code) {
        if (!datesListContainer) return;
        const datesQuery = query(collection(db, "couples", code, "importantDates"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(datesQuery);
        datesListContainer.innerHTML = '';
        if (snapshot.empty) {
            datesListContainer.innerHTML = `<p style="color: #888; text-align: center; font-size: 13px; margin: 5px 0;">No important dates added yet.</p>`;
            return;
        }
        snapshot.forEach(d => {
            const dat = d.data();
            const item = document.createElement('div');
            item.style.cssText = "display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 13px;";
            item.innerHTML = `<strong>${dat.title}</strong> <span>${dat.date}</span>`;
            datesListContainer.appendChild(item);
        });
    }

    if (menuDates && datesModal) {
        menuDates.addEventListener('click', () => {
            datesModal.classList.remove('hidden');
            loadImportantDates(coupleCode);
        });
    }

    if (closeDatesModal && datesModal) {
        closeDatesModal.addEventListener('click', () => datesModal.classList.add('hidden'));
    }

    if (saveDateBtn) {
        saveDateBtn.addEventListener('click', async () => {
            const title = newDateTitle.value.trim();
            const dateVal = newDateValue.value.trim();
            if (!title || !dateVal) {
                alert("Please fill in both fields");
                return;
            }
            await addDoc(collection(db, "couples", coupleCode, "importantDates"), {
                title: title,
                date: dateVal,
                createdAt: new Date()
            });
            newDateTitle.value = '';
            newDateValue.value = '';
            loadImportantDates(coupleCode);
        });
    }

    // --- D. Real-time Couple Document Listener (Countdown & Details) ---
    onSnapshot(doc(db, "couples", coupleCode), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.countdownTarget && countdownDays) {
                if (countdownTitleEl) countdownTitleEl.textContent = data.countdownTitle || "COUNTDOWN";
                const target = new Date(data.countdownTarget);
                const now = new Date();
                const diffTime = target - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                countdownDays.textContent = diffDays >= 0 ? diffDays : 0;
                if (countdownLabelEl) countdownLabelEl.textContent = `Days until ${data.countdownTitle || 'Special Day'}`;
            }
        }
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

        const sendMessage = async () => {
            const text = chatInput.value.trim();
            if (!text) return;

            chatInput.value = '';
            chatInput.focus();

            await addDoc(collection(db, "couples", coupleCode, "chats"), {
                text: text,
                sender: currentUserEmail,
                timestamp: new Date()
            });
        };

        sendChatBtn.addEventListener('click', sendMessage);

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
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

    // 5. "Us" Section Menu Modals & Navigation
    const menuSettings = document.getElementById('menu-settings');
    const settingsModal = document.getElementById('settings-submodal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    if (menuSettings && settingsModal) {
        menuSettings.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    }
    if (closeSettingsModal && settingsModal) {
        closeSettingsModal.addEventListener('click', () => settingsModal.classList.add('hidden'));
    }

    const menuLocation = document.getElementById('menu-location');
    const distanceModal = document.getElementById('distance-modal');
    const closeDistanceModal = document.getElementById('close-distance-modal');
    if (menuLocation && distanceModal) {
        menuLocation.addEventListener('click', () => distanceModal.classList.remove('hidden'));
    }
    if (closeDistanceModal && distanceModal) {
        closeDistanceModal.addEventListener('click', () => distanceModal.classList.add('hidden'));
    }

    // 6. Real-time Memories & Selfie Gallery Sync (Device Uploads & Firestore)
    const memoriesGrid = document.querySelector('.memories-grid');

    const handleImageUpload = (file) => {
        const reader = new FileReader();
        reader.onload = async (uploadEvent) => {
            const base64Image = uploadEvent.target.result;
            await addDoc(collection(db, "couples", coupleCode, "memories"), {
                image: base64Image,
                createdAt: new Date()
            });
        };
        reader.readAsDataURL(file);
    };

    const takeSelfieBtns = document.querySelectorAll('.random-selfie-card .primary-btn, .chat-action-btn');
    takeSelfieBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.capture = 'environment';
            fileInput.onchange = (e) => {
                if (e.target.files[0]) handleImageUpload(e.target.files[0]);
            };
            fileInput.click();
        });
    });

    const setupMemoryUploadTriggers = () => {
        const uploadTriggers = document.querySelectorAll('#open-add-memory-btn, #upload-device-photo-btn');
        uploadTriggers.forEach(btn => {
            btn.addEventListener('click', () => {
                const memoryInput = document.createElement('input');
                memoryInput.type = 'file';
                memoryInput.accept = 'image/*';
                memoryInput.onchange = (e) => {
                    if (e.target.files[0]) handleImageUpload(e.target.files[0]);
                };
                memoryInput.click();
            });
        });
    };

    setupMemoryUploadTriggers();

    if (memoriesGrid) {
        const memoriesQuery = query(collection(db, "couples", coupleCode, "memories"), orderBy("createdAt", "desc"));
        onSnapshot(memoriesQuery, (snapshot) => {
            const existingCells = memoriesGrid.querySelectorAll('.memory-cell:not(.add-memory-cell)');
            existingCells.forEach(c => c.remove());

            snapshot.forEach((docSnap) => {
                const mem = docSnap.data();
                const cell = document.createElement('div');
                cell.className = 'memory-cell';
                cell.style.backgroundImage = `url(${mem.image})`;
                cell.style.backgroundSize = 'cover';
                cell.style.backgroundPosition = 'center';
                memoriesGrid.appendChild(cell);
            });

            setupMemoryUploadTriggers();
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
