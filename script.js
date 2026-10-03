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

    // Settings & Dark Mode Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const settingsCodeDisplay = document.getElementById('settings-code-display');
    const generateNewCodeBtn = document.getElementById('generate-new-code-btn');

    let isLoginMode = true;

    // --- DARK MODE INIT ---
    if (localStorage.getItem('dark_mode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    darkModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('dark_mode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('dark_mode', 'false');
        }
    });

    // --- SETTINGS MODAL LOGIC ---
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        settingsCodeDisplay.value = localStorage.getItem('couple_space_code') || '------';
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    generateNewCodeBtn.addEventListener('click', () => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('couple_space_code', newCode);
        settingsCodeDisplay.value = newCode;
        alert(`New couple code generated successfully: ${newCode}`);
    });

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

    // --- CREATE / JOIN COUPLE (SYNCHRONIZED) ---
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

    // --- LOGOUT ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('couple_user');
        localStorage.removeItem('paired_couple');
        appScreen.classList.remove('active');
        authScreen.classList.add('active');
    });

    // --- MAIN APP FUNCTIONALITY ---
    function initApp() {
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        const tabPanes = document.querySelectorAll('.tab-pane');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                tabPanes.forEach(pane => paneHere are the updated **`index.html`**, **`style.css`**, and **`script.js`** files featuring:
1. **Dark Mode Toggle:** A settings option that switches the entire app theme to a dark mode and saves your preference in `localStorage`.
2. **In-App Code Generation:** A settings section where you can view, regenerate, or share your couple pairing code directly from inside the app without logging out.
3. **Settings Tab:** Added a 5th navigation tab (`⚙️ Settings`) at the bottom bar.

---

### 1. `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Couple App - You & Her</title>
    <!-- Google Fonts -->
    <link href="[https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap)" rel="stylesheet">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="[https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css)">
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="app-container">
        
        <!-- ================= SCREEN 1: LOGIN / SIGNUP ================= -->
        <div id="auth-screen" class="screen active">
            <div class="auth-header">
                <div class="heart-logo">❤️</div>
                <h1>COUPLE APP</h1>
                <p>Stay close, no matter the distance.</p>
            </div>
            <div class="auth-form-card">
                <h2 id="auth-title">Welcome Back</h2>
                <div class="input-group">
                    <i class="fa-solid fa-envelope"></i>
                    <input type="email" id="auth-email" placeholder="Your Email (must contain @)">
                </div>
                <div class="input-group">
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" id="auth-password" placeholder="Password">
                </div>
                <button id="auth-submit-btn" class="primary-btn">Log In</button>
                <p class="switch-auth">
                    <span id="switch-auth-text">Don't have an account?</span> 
                    <strong id="switch-auth-link">Sign Up</strong>
                </p>
            </div>
        </div>

        <!-- ================= SCREEN 1.5: EMAIL VERIFICATION ================= -->
        <div id="verify-screen" class="screen">
            <div class="auth-header">
                <div class="heart-logo">✉️</div>
                <h1>Verify Your Email</h1>
                <p>We've sent a verification code to your email. Enter it below.</p>
            </div>
            <div class="auth-form-card">
                <h2>Enter Verification Code</h2>
                <div class="input-group">
                    <i class="fa-solid fa-shield-halved"></i>
                    <input type="text" id="verify-code-input" placeholder="Enter 4-digit code" maxlength="4">
                </div>
                <button id="verify-submit-btn" class="primary-btn">Verify & Continue</button>
                <p class="switch-auth">Didn't receive code? <strong id="resend-code-link" style="cursor: pointer; color: #d63031;">Resend</strong></p>
            </div>
        </div>

        <!-- ================= SCREEN 2: CREATE / JOIN COUPLE ================= -->
        <div id="couple-screen" class="screen">
            <div class="couple-header">
                <h2>Link With Your Partner</h2>
                <p>Create a shared space or join your partner's space using their code.</p>
            </div>
            <div class="couple-options">
                <div class="couple-card">
                    <h3>Create a Space</h3>
                    <p>Generate a secret invite code to share with your partner.</p>
                    <button id="create-couple-btn" class="primary-btn">Create Couple Code</button>
                    <div id="display-code-box" class="hidden">
                        <span>Your Code:</span> <strong id="generated-code"></strong>
                        <button id="enter-app-from-create" class="secondary-btn" style="margin-top: 10px; width: 100%;">Enter App</button>
                    </div>
                </div>
                <div class="divider">OR</div>
                <div class="couple-card">
                    <h3>Join Partner's Space</h3>
                    <input type="text" id="join-code-input" placeholder="Enter partner's code">
                    <button id="join-couple-btn" class="secondary-btn">Join Space</button>
                </div>
            </div>
        </div>

        <!-- ================= SCREEN 3: MAIN APP ================= -->
        <div id="app-screen" class="screen">
            
            <header class="app-header">
                <h1 id="app-title-header">❤️ You & Her</h1>
                <button id="logout-btn" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></button>
            </header>

            <div class="app-content">

                <!-- TAB 1: HOME -->
                <div id="tab-home" class="tab-pane active">
                    <div class="card distance-card">
                        <div class="distance-header">
                            <i class="fa-solid fa-location-dot"></i>
                            <span id="live-distance-num">Calculating GPS distance...</span>
                        </div>
                        <div class="cities" id="distance-subtext">Live distance to partner</div>
                        <button id="update-gps-btn" class="secondary-btn" style="margin-top: 10px; font-size: 0.75rem; padding: 6px 12px; width: auto;"><i class="fa-solid fa-location-crosshairs"></i> Refresh GPS</button>
                    </div>

                    <div class="card tasks-card">
                        <div class="card-title editable-title-container">
                            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                                <i class="fa-solid fa-list-check"></i>
                                <span id="tasks-main-title" contenteditable="true" title="Click text to edit section name">BBYS TASKS</span>
                            </div>
                            <i class="fa-solid fa-pen edit-icon" style="font-size: 0.75rem; color: #b2bec3;"></i>
                        </div>

                        <div class="task-slot">
                            <h4 class="slot-heading"><i class="fa-solid fa-paper-plane"></i> Assign to Partner</h4>
                            <ul id="assigned-to-partner-list" class="task-list"></ul>
                            <div class="add-task-row">
                                <input type="text" id="assign-partner-input" placeholder="Give partner a task...">
                                <button id="assign-partner-btn"><i class="fa-solid fa-plus"></i></button>
                            </div>
                        </div>

                        <div class="task-divider"></div>

                        <div class="task-slot">
                            <h4 class="slot-heading"><i class="fa-solid fa-inbox"></i> Assigned by Partner</h4>
                            <ul id="assigned-by-partner-list" class="task-list"></ul>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: CHAT -->
                <div id="tab-chat" class="tab-pane">
                    <div class="chat-container">
                        <div class="chat-header-status">
                            <span class="status-dot online" id="status-dot"></span>
                            <span id="partner-status-text">Online</span>
                        </div>

                        <div id="chat-messages" class="chat-messages"></div>
                        
                        <div class="chat-input-row">
                            <input type="text" id="chat-input" placeholder="Type a sweet message...">
                            <button id="send-chat-btn"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>

                <!-- TAB 3: MOMENTS -->
                <div id="tab-moments" class="tab-pane">
                    <div class="moments-header">
                        <h3>Our Memories</h3>
                        <label for="photo-upload" class="upload-btn"><i class="fa-solid fa-camera"></i> Add Photo</label>
                        <input type="file" id="photo-upload" accept="image/*" class="hidden">
                    </div>
                    <div id="moments-grid" class="moments-grid"></div>
                </div>

                <!-- TAB 4: SCHEDULE -->
                <div id="tab-schedule" class="tab-pane">
                    <div class="schedule-container">
                        <h3>Upcoming Dates & Plans</h3>
                        <ul id="schedule-list" class="schedule-list"></ul>
                        <div class="add-schedule-box">
                            <input type="text" id="event-title" placeholder="Event title...">
                            <input type="date" id="event-date">
                            <button id="add-event-btn" class="primary-btn">Add Plan</button>
                        </div>
                    </div>
                </div>

                <!-- TAB 5: SETTINGS -->
                <div id="tab-settings" class="tab-pane">
                    <div class="settings-container">
                        <h3>App Settings</h3>

                        <!-- Dark Mode Toggle -->
                        <div class="setting-card">
                            <div class="setting-info">
                                <strong>Dark Mode</strong>
                                <p>Switch between light and dark theme</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="dark-mode-toggle">
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <!-- Generate / View Code from Space -->
                        <div class="setting-card">
                            <div class="setting-info">
                                <strong>Couple Invite Code</strong>
                                <p>View or generate your pairing code</p>
                            </div>
                            <button id="gen-code-btn" class="secondary-btn">Show / Gen Code</button>
                        </div>
                        <div id="in-app-code-display" class="card hidden" style="background: #ffeaa7; color: #d63031; font-weight: 600;">
                            Your Code: <span id="displayed-space-code" style="letter-spacing: 2px;">------</span>
                        </div>

                        <!-- Logout Button -->
                        <div class="setting-card" style="border: none; background: transparent; padding: 0;">
                            <button id="settings-logout-btn" class="primary-btn" style="width: 100%;">Log Out</button>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Bottom Navigation Bar -->
            <nav class="bottom-nav">
                <button class="nav-item active" data-tab="home">
                    <i class="fa-solid fa-house"></i>
                    <span>Home</span>
                </button>
                <button class="nav-item" data-tab="chat">
                    <i class="fa-solid fa-comment"></i>
                    <span>Chat</span>
                </button>
                <button class="nav-item" data-tab="moments">
                    <i class="fa-solid fa-camera"></i>
                    <span>Moments</span>
                </button>
                <button class="nav-item" data-tab="schedule">
                    <i class="fa-solid fa-calendar"></i>
                    <span>Schedule</span>
                </button>
                <button class="nav-item" data-tab="settings">
                    <i class="fa-solid fa-gear"></i>
                    <span>Settings</span>
                </button>
            </nav>

        </div>

    </div>

    <script src="script.js"></script>
</body>
</html>
