document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const authScreen = document.getElementById('auth-screen');
    const verifyScreen = document.getElementById('verify-screen');
    const coupleScreen = document.getElementById('couple-screen');
    const appScreen = document.getElementById('app-screen');

    // Auth & Verify Elements
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const switchAuthText = document.getElementById('switch-auth-text');
    const switchAuthLink = document.getElementById('switch-auth-link');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
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

    // Modals & Sheets
    const tasksModal = document.getElementById('tasks-modal');
    const closeTasksModal = document.getElementById('close-tasks-modal');
    const viewAllTasksBtn = document.getElementById('view-all-tasks-btn');
    const addTaskSheet = document.getElementById('add-task-sheet');
    const openAddTaskBtn = document.getElementById('open-add-task-btn');
    const submitNewTaskBtn = document.getElementById('submit-new-task-btn');
    const newTaskName = document.getElementById('new-task-name');
    const fullTaskList = document.getElementById('full-task-list');

    const distanceModal = document.getElementById('distance-modal');
    const closeDistanceModal = document.getElementById('close-distance-modal');
    const homeDistanceCard = document.getElementById('home-distance-card');
    const refreshGpsBtn = document.getElementById('refresh-gps-btn');
    const modalDistanceVal = document.getElementById('modal-distance-val');

    const notificationsModal = document.getElementById('notifications-modal');
    const closeNotificationsModal = document.getElementById('close-notifications-modal');
    const openNotificationsBtn = document.getElementById('open-notifications-btn');

    const settingsSubmodal = document.getElementById('settings-submodal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const goToSettingsBtn = document.getElementById('go-to-settings-btn');
    const menuSettings = document.getElementById('menu-settings');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const leaveCoupleBtn = document.getElementById('leave-couple-btn');
    const settingsLogoutBtn = document.getElementById('settings-logout-btn');

    // Chat Elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const homeLastMessageBtn = document.getElementById('home-last-message-btn');

    let isLoginMode = true;

    // --- INITIAL SCREEN STATE CHECK ---
    if (localStorage.getItem('paired_couple') && localStorage.getItem('couple_user')) {
        authScreen.classList.remove('active');
        appScreen.classList.add('active');
        initApp();
    } else if (localStorage.getItem('couple_user')) {
        authScreen.classList.remove('active');
        coupleScreen.classList.add('active');
    } else {
        authScreen.classList.add('active');
    }

    // --- DARK MODE INIT ---
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

    // --- AUTH FLOW ---
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

    authSubmitBtn.addEventListener('click', () => {
        const email = authEmail.value.trim();
        const pwd = authPassword.value.trim();
        if (!email || !pwd) { alert('Please fill in all fields'); return; }
        if (!email.includes('@') || !email.includes('.')) { alert('Enter a valid email containing "@" and "."'); return; }

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
            const vCode = Math.floor(1000 + Math.random() * 9000).toString();
            localStorage.setItem('pending_verify_code', vCode);
            alert(`[Inbox Simulation] Verification code sent to ${email}:\nCode: ${vCode}`);
            authScreen.classList.remove('active');
            verifyScreen.classList.add('active');
        }
    });

    verifySubmitBtn.addEventListener('click', () => {
        const code = verifyCodeInput.value.trim();
        const expected = localStorage.getItem('pending_verify_code') || '1234';
        if (code !== expected) { alert('Incorrect verification code'); return; }
        verifyScreen.classList.remove('active');
        coupleScreen.classList.add('active');
    });

    resendCodeLink.addEventListener('click', () => {
        alert(`[Inbox Simulation] Code: ${localStorage.getItem('pending_verify_code') || '1234'}`);
    });

    // --- COUPLE CONNECTION ---
    createCoupleBtn.addEventListener('click', () => {
        let code = localStorage.getItem('couple_space_code');
        if (!code) {
            code = 'LOVE-' + Math.floor(1000 + Math.random() * 9000);
            localStorage.setItem('couple_space_code', code);
        }
        generatedCode.textContent = code;
        displayCodeBox.classList.remove('hidden');
    });

    enterAppFromCreate.addEventListener('click', () => {
        localStorage.setItem('paired_couple', 'true');
        coupleScreen.classList.remove('active');
        appScreen.classList.add('active');
        initApp();
    });

    joinCoupleBtn.addEventListener('click', () => {
        const entered = joinCodeInput.value.trim().toUpperCase();
        if (!entered) { alert('Please enter code'); return; }
        localStorage.setItem('couple_space_code', entered);
        localStorage.setItem('paired_couple', 'true');
        coupleScreen.classList.remove('active');
        appScreen.classList.add('active');
        initApp();
    });

    // Logout
    function logoutUser() {
        localStorage.removeItem('paired_couple');
        appScreen.classList.remove('active');
        authScreen.classList.add('active');
    }
    if (settingsLogoutBtn) settingsLogoutBtn.addEventListener('click', logoutUser);
    if (leaveCoupleBtn) leaveCoupleBtn.addEventListener('click', logoutUser);

    // --- MAIN APP INIT ---
    function initApp() {
        // Bottom Navigation (5 tabs)
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        const tabPanes = document.querySelectorAll('.app-content .tab-pane');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                item.classList.add('active');
                const target = document.getElementById(`tab-${item.dataset.tab}`);
                if (target) target.classList.add('active');
            });
        });

        // Moments Subtabs
        const momentSubtabs = document.querySelectorAll('.subtab-btn');
        momentSubtabs.forEach(btn => {
            btn.addEventListener('click', () => {
                momentSubtabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.subtab-pane').forEach(p => p.classList.remove('active'));
                document.getElementById(`subtab-pane-${btn.dataset.subtab}`).classList.add('active');
            });
        });

        // Modals Listeners
        if (viewAllTasksBtn) viewAllTasksBtn.addEventListener('click', () => tasksModal.classList.remove('hidden'));
        if (closeTasksModal) closeTasksModal.addEventListener('click', () => tasksModal.classList.add('hidden'));

        if (openAddTaskBtn) openAddTaskBtn.addEventListener('click', () => addTaskSheet.classList.remove('hidden'));
        if (submitNewTaskBtn) submitNewTaskBtn.addEventListener('click', () => {
            const val = newTaskName.value.trim();
            if (!val) return;
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `<input type="checkbox"> <span>${val}</span>`;
            fullTaskList.appendChild(li);
            newTaskName.value = '';
            addTaskSheet.classList.add('hidden');
        });

        if (homeDistanceCard) homeDistanceCard.addEventListener('click', () => distanceModal.classList.remove('hidden'));
        if (closeDistanceModal) closeDistanceModal.addEventListener('click', () => distanceModal.classList.add('hidden'));

        if (openNotificationsBtn) openNotificationsBtn.addEventListener('click', () => notificationsModal.classList.remove('hidden'));
        if (closeNotificationsModal) closeNotificationsModal.addEventListener('click', () => notificationsModal.classList.add('hidden'));

        if (goToSettingsBtn) goToSettingsBtn.addEventListener('click', () => settingsSubmodal.classList.remove('hidden'));
        if (menuSettings) menuSettings.addEventListener('click', () => settingsSubmodal.classList.remove('hidden'));
        if (closeSettingsModal) closeSettingsModal.addEventListener('click', () => settingsSubmodal.classList.add('hidden'));

        if (homeLastMessageBtn) homeLastMessageBtn.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            document.querySelector('[data-tab="chat"]').classList.add('active');
            document.getElementById('tab-chat').classList.add('active');
        });

        // Chat send
        if (sendChatBtn) sendChatBtn.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (!text) return;
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble sent';
            bubble.textContent = text;
            chatMessages.appendChild(bubble);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        // Live GPS Refresh simulation
        if (refreshGpsBtn) refreshGpsBtn.addEventListener('click', () => {
            modalDistanceVal.textContent = "Updating...";
            setTimeout(() => { modalDistanceVal.textContent = "720 KM"; alert('Location updated successfully!'); }, 1000);
        });
    }
});
