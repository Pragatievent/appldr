document.addEventListener('DOMContentLoaded', () => {
    // Screen Elements
    const authScreen = document.getElementById('auth-screen');
    const verifyScreen = document.getElementById('verify-screen');
    const coupleScreen = document.getElementById('couple-screen');
    const appScreen = document.getElementById('app-screen');

    // Auth Elements
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const switchAuthText = document.getElementById('switch-auth-text');
    const switchAuthLink = document.getElementById('switch-auth-link');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const logoutBtn = document.getElementById('logout-btn');

    // Verification Elements
    const verifyCodeInput = document.getElementById('verify-code-input');
    const verifySubmitBtn = document.getElementById('verify-submit-btn');
    const resendCodeLink = document.getElementById('resend-code-link');

    // Couple Elements
    const createCoupleBtn = document.getElementById('create-couple-btn');
    const displayCodeBox = document.getElementById('display-code-box');
    const generatedCode = document.getElementById('generated-code');
    const enterAppFromCreate = document.getElementById('enter-app-from-create');
    const joinCodeInput = document.getElementById('join-code-input');
    const joinCoupleBtn = document.getElementById('join-couple-btn');

    // Settings / Dark Mode Elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const genCodeBtn = document.getElementById('gen-code-btn');
    const inAppCodeDisplay = document.getElementById('in-app-code-display');
    const displayedSpaceCode = document.getElementById('displayed-space-code');
    const settingsLogoutBtn = document.getElementById('settings-logout-btn');

    let isLoginMode = true;

    // --- CHECK SAVED DARK MODE PREFERENCE ---
    if (localStorage.getItem('dark_mode') === 'true') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('dark_mode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('dark_mode', 'false');
            }
        });
    }

    // --- AUTH TOGGLE LOGIC ---
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

    // --- AUTH SUBMIT WITH EMAIL VALIDATION ---
    authSubmitBtn.addEventListener('click', () => {
        const email = authEmail.value.trim();
        const password = authPassword.value.trim();

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            alert('Please enter a valid email address containing "@" and "."');
            return;
        }

        localStorage.setItem('couple_user', email);

        if (isLoginMode) {
            authScreen.classList.remove('active');
            if (localStorage.getItem('paired_couple')) {
                appScreen.classList.add('active');
                initApp();
            } else {
                coupleScreen.classList.add('active');
            }
        } else {
            const randomVerifyCode = Math.floor(1000 + Math.random() * 9000).toString();
            localStorage.setItem('pending_verify_code', randomVerifyCode);
            alert(`[Inbox Simulation] Verification code sent to ${email}:\nYour Code is: ${randomVerifyCode}`);
            
            authScreen.classList.remove('active');
            verifyScreen.classList.add('active');
        }
    });

    // --- EMAIL VERIFICATION SUBMIT ---
    verifySubmitBtn.addEventListener('click', () => {
        const code = verifyCodeInput.value.trim();
        const expectedCode = localStorage.getItem('pending_verify_code') || '1234';

        if (!code) {
            alert('Please enter the verification code');
            return;
        }

        if (code !== expectedCode) {
            alert('Incorrect verification code. Please check your inbox code.');
            return;
        }

        verifyScreen.classList.remove('active');
        coupleScreen.classList.add('active');
    });

    resendCodeLink.addEventListener('click', () => {
        const resendCode = localStorage.getItem('pending_verify_code') || '1234';
        alert(`[Inbox Simulation] Resent verification code: ${resendCode}`);
    });

    // --- CREATE / JOIN COUPLE ---
    createCoupleBtn.addEventListener('click', () => {
        let activeCode = localStorage.getItem('couple_space_code');
        if (!activeCode) {
            activeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            localStorage.setItem('couple_space_code', activeCode);
        }
        generatedCode.textContent = activeCode;
        displayCodeBox.classList.remove('hidden');
    });

    enterAppFromCreate.addEventListener('click', () => {
        localStorage.setItem('paired_couple', 'true');
        coupleScreen.classList.remove('active');
        appScreen.classList.add('active');
        initApp();
    });

    joinCoupleBtn.addEventListener('click', () => {
        const enteredCode = joinCodeInput.value.trim().toUpperCase();
        const storedCode = localStorage.getItem('couple_space_code');

        if (!enteredCode) {
            alert('Please enter the couple code provided by your partner.');
            return;
        }

        if (storedCode && enteredCode === storedCode) {
            localStorage.setItem('paired_couple', 'true');
            coupleScreen.classList.remove('active');
            appScreen.classList.add('active');
            initApp();
        } else if (!storedCode) {
            localStorage.setItem('couple_space_code', enteredCode);
            localStorage.setItem('paired_couple', 'true');
            coupleScreen.classList.remove('active');
            appScreen.classList.add('active');
            initApp();
        } else {
            alert('Invalid couple code. Please check the code with your partner.');
        }
    });

    // --- LOGOUT HANDLERS ---
    function performLogout() {
        localStorage.removeItem('couple_user');
        localStorage.removeItem('paired_couple');
        appScreen.classList.remove('active');
        authScreen.classList.add('active');
    }

    logoutBtn.addEventListener('click', performLogout);
    if (settingsLogoutBtn) settingsLogoutBtn.addEventListener('click', performLogout);

    // --- IN-APP CODE GENERATION / DISPLAY HANDLER ---
    if (genCodeBtn) {
        genCodeBtn.addEventListener('click', () => {
            let activeCode = localStorage.getItem('couple_space_code');
            if (!activeCode) {
                activeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                localStorage.setItem('couple_space_code', activeCode);
            }
            displayedSpaceCode.textContent = activeCode;
            inAppCodeDisplay.classList.remove('hidden');
        });
    }

    // --- MAIN APP FUNCTIONALITY ---
    function initApp() {
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        const tabPanes = document.querySelectorAll('.tab-pane');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                item.classList.add('active');
                const targetTab = document.getElementById(`tab-${item.dataset.tab}`);
                if (targetTab) targetTab.classList.add('active');
            });
        });

        initLiveDistance();
        initTasks();
        initChat();
        initSchedule();

        const photoUpload = document.getElementById('photo-upload');
        photoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    addMomentCard(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- TWO-WAY LIVE GPS DISTANCE TRACKING ---
    function initLiveDistance() {
        const distanceNum = document.getElementById('live-distance-num');
        const distanceSubtext = document.getElementById('distance-subtext');
        const updateGpsBtn = document.getElementById('update-gps-btn');

        const currentUser = localStorage.getItem('couple_user') || 'user1';
        const isUserOne = currentUser.includes('1') || !localStorage.getItem('user_role');
        const myLocationKey = isUserOne ? 'user_a_loc' : 'user_b_loc';
        const partnerLocationKey = isUserOne ? 'user_b_loc' : 'user_a_loc';

        function updateAndCalculateDistance() {
            if (!navigator.geolocation) {
                distanceNum.textContent = "GPS not supported";
                return;
            }

            distanceNum.textContent = "Fetching GPS...";
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const myLat = position.coords.latitude;
                    const myLon = position.coords.longitude;

                    localStorage.setItem(myLocationKey, JSON.stringify({ lat: myLat, lon: myLon }));
                    const partnerData = localStorage.getItem(partnerLocationKey);

                    if (partnerData) {
                        const partnerCoord = JSON.parse(partnerData);
                        const dist = calculateHaversine(myLat, myLon, partnerCoord.lat, partnerCoord.lon);
                        distanceNum.textContent = `${dist} km`;
                        distanceSubtext.textContent = `Live GPS Distance Between You & Partner`;
                    } else {
                        const defaultPartnerLat = 23.2599;
                        const defaultPartnerLon = 77.4126;
                        const dist = calculateHaversine(myLat, myLon, defaultPartnerLat, defaultPartnerLon);
                        distanceNum.textContent = `${dist} km`;
                        distanceSubtext.textContent = `Live GPS (Partner location waiting for sync)`;
                    }
                },
                (error) => {
                    distanceNum.textContent = "GPS Permission Denied";
                    distanceSubtext.textContent = "Enable location services in browser";
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }

        updateAndCalculateDistance();
        if (updateGpsBtn) updateGpsBtn.addEventListener('click', updateAndCalculateDistance);
        setInterval(updateAndCalculateDistance, 10000);
    }

    function calculateHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c);
    }

    // --- DUAL-SLOT TASKS LOGIC ---
    function initTasks() {
        const assignedToPartnerList = document.getElementById('assigned-to-partner-list');
        const assignedByPartnerList = document.getElementById('assigned-by-partner-list');
        const assignPartnerInput = document.getElementById('assign-partner-input');
        const assignPartnerBtn = document.getElementById('assign-partner-btn');

        let tasksToPartner = [];
        let tasksByPartner = [];

        function renderTasks() {
            assignedToPartnerList.innerHTML = '';
            if (tasksToPartner.length === 0) {
                assignedToPartnerList.innerHTML = `<li style="font-size: 0.8rem; color: #b2bec3; text-align: center; padding: 4px;">No tasks assigned yet</li>`;
            } else {
                tasksToPartner.forEach((task, index) => {
                    const li = document.createElement('li');
                    li.className = `task-item ${task.completed ? 'completed' : ''}`;
                    li.innerHTML = `
                        <span>${task.text}</span>
                        <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    `;
                    li.querySelector('input').addEventListener('change', (e) => {
                        tasksToPartner[index].completed = e.target.checked;
                        renderTasks();
                    });
                    assignedToPartnerList.appendChild(li);
                });
            }

            assignedByPartnerList.innerHTML = '';
            if (tasksByPartner.length === 0) {
                assignedByPartnerList.innerHTML = `<li style="font-size: 0.8rem; color: #b2bec3; text-align: center; padding: 4px;">No tasks from partner yet</li>`;
            } else {
                tasksByPartner.forEach((task, index) => {
                    const li = document.createElement('li');
                    li.className = `task-item ${task.completed ? 'completed' : ''}`;
                    li.innerHTML = `
                        <span>${task.text}</span>
                        <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    `;
                    li.querySelector('input').addEventListener('change', (e) => {
                        tasksByPartner[index].completed = e.target.checked;
                        renderTasks();
                    });
                    assignedByPartnerList.appendChild(li);
                });
            }
        }

        if (assignPartnerBtn) {
            assignPartnerBtn.addEventListener('click', () => {
                const val = assignPartnerInput.value.trim();
                if (!val) return;
                tasksToPartner.push({ text: val, completed: false });
                assignPartnerInput.value = '';
                renderTasks();
            });
        }

        renderTasks();
    }

    // --- CHAT LOGIC ---
    function initChat() {
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendChatBtn = document.getElementById('send-chat-btn');
        const partnerStatusText = document.getElementById('partner-status-text');
        const statusDot = document.getElementById('status-dot');

        chatMessages.innerHTML = '';

        if (sendChatBtn) {
            sendChatBtn.addEventListener('click', () => {
                const text = chatInput.value.trim();
                if (!text) return;
                
                appendSentMessage(text);
                chatInput.value = '';

                setTimeout(() => {
                    partnerStatusText.textContent = "typing...";
                    statusDot.classList.add('online');
                }, 800);

                setTimeout(() => {
                    partnerStatusText.textContent = "Online";
                    appendReceivedMessage("Got your message! ❤️");
                }, 3000);
            });
        }
    }

    function appendSentMessage(text) {
        const chatMessages = document.getElementById('chat-messages');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble sent`;
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        bubble.innerHTML = `
            <span>${text}</span>
            <div class="chat-meta">
                <span class="chat-time">${timeNow}</span>
                <i class="fa-solid fa-check tick-icon" id="tick-status"></i>
            </div>
        `;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const tickElem = bubble.querySelector('#tick-status');
        setTimeout(() => {
            tickElem.className = "fa-solid fa-check-double tick-icon";
        }, 800);
        setTimeout(() => {
            tickElem.className = "fa-solid fa-check-double tick-icon read";
        }, 1800);
    }

    function appendReceivedMessage(text) {
        const chatMessages = document.getElementById('chat-messages');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble received`;
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        bubble.innerHTML = `
            <span>${text}</span>
            <div class="chat-meta">${timeNow}</div>
        `;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- SCHEDULE LOGIC ---
    function initSchedule() {
        const scheduleList = document.getElementById('schedule-list');
        const eventTitle = document.getElementById('event-title');
        const eventDate = document.getElementById('event-date');
        const addEventBtn = document.getElementById('add-event-btn');

        let plans = [];

        function renderPlans() {
            scheduleList.innerHTML = '';
            if (plans.length === 0) {
                scheduleList.innerHTML = `<li style="font-size: 0.85rem; color: #b2bec3; text-align: center; padding: 10px;">No upcoming plans added yet</li>`;
                return;
            }
            plans.forEach(plan => {
                const li = document.createElement('li');
                li.className = 'schedule-item';
                li.innerHTML = `
                    <span class="date-badge">${plan.date}</span>
                    <div class="event-details">
                        <strong>${plan.title}</strong>
                    </div>
                `;
                scheduleList.appendChild(li);
            });
        }

        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => {
                const titleVal = eventTitle.value.trim();
                const dateVal = eventDate.value;
                if (!titleVal || !dateVal) {
                    alert('Please enter both title and date');
                    return;
                }
                plans.push({ title: titleVal, date: dateVal });
                eventTitle.value = '';
                eventDate.value = '';
                renderPlans();
            });
        }

        renderPlans();
    }

    function addMomentCard(imgSrc) {
        const momentsGrid = document.getElementById('moments-grid');
        const card = document.createElement('div');
        card.className = 'moment-card';
        card.innerHTML = `<img src="${imgSrc}" alt="Moment">`;
        momentsGrid.prepend(card);
    }
});
