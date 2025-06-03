// Admin system with specified credentials
const ADMIN_CREDENTIALS = {
    username: 'Buckswin25',
    password: 'Bucks@Win2007'
};

// Game state
let currentUser = null;
let currentAdmin = null;
let gameTimer = 30;
let gameRunning = false;
let selectedColor = null;
let selectedAmount = 0;
let timerInterval = null;
let activeBets = []; // Store multiple bets
let leaderboardInterval = null;
let pendingBankDetails = null; // Store bank details for confirmation
let selectedPaymentMethod = 'upi'; // Default payment method
let gameResultsHistory = []; // Store last 15 game results for trends
let gameBreakTimeout = null; // For 5-second break between games

// Dice game state
let diceSelectedNumber = null;
let diceSelectedAmount = 0;

// Card game state  
let cardSelectedCard = null;
let cardSelectedAmount = 0;

// Local payment configuration
const PAYMENT_CONFIG = {
    upiId: 'juniorarishu@okhdfcbank',
    merchantName: 'ARISHU Junior',
    bankName: 'Punjab National Bank'
};

// Enhanced user data structure with complete profile information
let users = JSON.parse(localStorage.getItem('bucksWinUsers')) || {};
let gameHistory = JSON.parse(localStorage.getItem('bucksWinHistory')) || [];
let globalWinnings = JSON.parse(localStorage.getItem('bucksWinGlobalWinnings')) || {};
let savedBankDetails = JSON.parse(localStorage.getItem('bucksWinBankDetails')) || {};
let depositHistory = JSON.parse(localStorage.getItem('bucksWinDepositHistory')) || {};

// User profile and security data
let userProfiles = JSON.parse(localStorage.getItem('bucksWinUserProfiles')) || {};
let emailRegistry = JSON.parse(localStorage.getItem('bucksWinEmailRegistry')) || {};
let withdrawalRequests = JSON.parse(localStorage.getItem('bucksWinWithdrawalRequests')) || {};
let userSessions = JSON.parse(localStorage.getItem('bucksWinUserSessions')) || {};
let paymentVerifications = JSON.parse(localStorage.getItem('bucksWinPaymentVerifications')) || {};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize error handling for uncaught promises
        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });

        // Initialize error handling for uncaught errors
        window.addEventListener('error', function(event) {
            console.error('Uncaught error:', event.error);
        });

        // Migrate old data if exists
        migrateOldData();

        // Check if user is already logged in
        const loggedInUser = localStorage.getItem('bucksWinCurrentUser');
        if (loggedInUser) {
            try {
                currentUser = JSON.parse(loggedInUser);
                showDashboard();
            } catch (error) {
                console.error('Error parsing logged in user:', error);
                localStorage.removeItem('bucksWinCurrentUser');
                showLogin();
            }
        }

        // Check if admin is already logged in
        const loggedInAdmin = localStorage.getItem('bucksWinCurrentAdmin');
        if (loggedInAdmin) {
            try {
                currentAdmin = JSON.parse(loggedInAdmin);
                showAdminDashboard();
            } catch (error) {
                console.error('Error parsing logged in admin:', error);
                localStorage.removeItem('bucksWinCurrentAdmin');
                showLogin();
            }
        }

        setupEventListeners();
    } catch (error) {
        console.error('App initialization error:', error);
        showErrorAlert('❌ Application failed to initialize. Please refresh the page.');
    }
});

function setupEventListeners() {
    try {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', handleAdminLogin);
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }

        // Payment screenshot upload
        const paymentScreenshot = document.getElementById('paymentScreenshot');
        if (paymentScreenshot) {
            paymentScreenshot.addEventListener('change', handleScreenshotUpload);
        }

        // Profile update form
        const profileForm = document.getElementById('profileUpdateForm');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileUpdate);
        }

        // Custom amount input validation
        setupAmountInputs();

        // Bank details form validation
        setupBankDetailsValidation();

        // Payment form validation
        setupPaymentValidation();

    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

function setupAmountInputs() {
    try {
        // Custom amount input
        const customAmount = document.getElementById('customAmount');
        if (customAmount) {
            customAmount.addEventListener('input', function() {
                // Check if user has balance before allowing input
                if (currentUser && currentUser.balance <= 0) {
                    this.value = '';
                    showInsufficientBalancePopup(10);
                    return;
                }

                const value = parseInt(this.value);
                if (value && value >= 10) {
                    selectedAmount = value;
                    updateAmountButtons();
                }
            });
        }

        // Custom recharge input
        const customRecharge = document.getElementById('customRecharge');
        if (customRecharge) {
            customRecharge.addEventListener('input', function() {
                updateRechargeButtons();
            });
        }

        // Custom dice amount input
        const customDiceAmount = document.getElementById('customDiceAmount');
        if (customDiceAmount) {
            customDiceAmount.addEventListener('input', function() {
                if (currentUser && currentUser.balance <= 0) {
                    this.value = '';
                    showInsufficientBalancePopup(10);
                    return;
                }

                const value = parseInt(this.value);
                if (value && value >= 10) {
                    diceSelectedAmount = value;
                    document.querySelectorAll('.dice-amount-btn').forEach(btn => btn.classList.remove('selected'));
                }
            });
        }

        // Custom card amount input
        const customCardAmount = document.getElementById('customCardAmount');
        if (customCardAmount) {
            customCardAmount.addEventListener('input', function() {
                if (currentUser && currentUser.balance <= 0) {
                    this.value = '';
                    showInsufficientBalancePopup(10);
                    return;
                }

                const value = parseInt(this.value);
                if (value && value >= 10) {
                    cardSelectedAmount = value;
                    document.querySelectorAll('.card-amount-btn').forEach(btn => btn.classList.remove('selected'));
                }
            });
        }
    } catch (error) {
        console.error('Error setting up amount inputs:', error);
    }
}

function setupBankDetailsValidation() {
    try {
        const accountNumber = document.getElementById('accountNumber');
        if (accountNumber) {
            accountNumber.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }

        const ifscCode = document.getElementById('ifscCode');
        if (ifscCode) {
            ifscCode.addEventListener('input', function() {
                this.value = this.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            });
        }

        const phoneNumber = document.getElementById('phoneNumber');
        if (phoneNumber) {
            phoneNumber.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }
    } catch (error) {
        console.error('Error setting up bank details validation:', error);
    }
}

function setupPaymentValidation() {
    try {
        const transactionId = document.getElementById('transactionId');
        if (transactionId) {
            transactionId.addEventListener('input', function() {
                this.value = this.value.replace(/[^A-Za-z0-9]/g, '');
            });
        }

        const withdrawAmount = document.getElementById('withdrawAmount');
        if (withdrawAmount) {
            withdrawAmount.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }
    } catch (error) {
        console.error('Error setting up payment validation:', error);
    }
}

function handleLogin(e) {
    e.preventDefault();

    try {
        const email = document.getElementById('email').value.toLowerCase().trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            showErrorAlert('❌ Please enter both email and password');
            return;
        }

        if (!isValidEmail(email)) {
            showErrorAlert('❌ Please enter a valid email address');
            return;
        }

        if (users[email] && users[email].password === password) {
            // Check account status
            if (users[email].accountStatus === 'suspended') {
                showErrorAlert('❌ Your account has been suspended. Please contact support.');
                return;
            }

            currentUser = users[email];

            // Initialize missing fields
            if (!currentUser.gamePoints) {
                currentUser.gamePoints = currentUser.balance || 0;
            }
            if (!currentUser.matchHistory) {
                currentUser.matchHistory = [];
            }
            if (!currentUser.userId) {
                currentUser.userId = 'BW' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
            }

            // Update login statistics
            currentUser.lastLogin = new Date().toISOString();
            currentUser.loginCount = (currentUser.loginCount || 0) + 1;

            // Create session
            const sessionId = 'SES' + Date.now() + Math.random().toString(36).substr(2, 8).toUpperCase();
            userSessions[sessionId] = {
                userId: currentUser.userId,
                email: email,
                loginTime: new Date().toISOString(),
                ipAddress: 'Unknown', // In real app, get actual IP
                userAgent: navigator.userAgent,
                active: true
            };

            // Update user profile data
            if (userProfiles[currentUser.userId]) {
                userProfiles[currentUser.userId].accountInfo.lastLogin = currentUser.lastLogin;
                userProfiles[currentUser.userId].accountInfo.loginCount = currentUser.loginCount;
                userProfiles[currentUser.userId].financialInfo.balance = currentUser.balance;
                userProfiles[currentUser.userId].gameStats.gamesPlayed = currentUser.gamesPlayed || 0;
            }

            // Save updated data
            users[email] = currentUser;
            localStorage.setItem('bucksWinUsers', JSON.stringify(users));
            localStorage.setItem('bucksWinCurrentUser', JSON.stringify(currentUser));
            localStorage.setItem('bucksWinUserSessions', JSON.stringify(userSessions));
            localStorage.setItem('bucksWinUserProfiles', JSON.stringify(userProfiles));

            showDashboard();
        } else {
            showErrorAlert('❌ Invalid email or password. Please check your credentials and try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showErrorAlert('❌ Login failed. Please try again.');
    }
}

function handleAdminLogin(e) {
    e.preventDefault();

    try {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();

        if (!username || !password) {
            showErrorAlert('❌ Please enter both username and password');
            return;
        }

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            currentAdmin = {
                username: username,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('bucksWinCurrentAdmin', JSON.stringify(currentAdmin));
            showAdminDashboard();
        } else {
            showErrorAlert('❌ Invalid admin credentials');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showErrorAlert('❌ Admin login failed. Please try again.');
    }
}

function handleRegister(e) {
    e.preventDefault();

    try {
        const name = document.getElementById('regName').value.trim();
        const age = parseInt(document.getElementById('regAge').value);
        const gender = document.getElementById('regGender').value;
        const email = document.getElementById('regEmail').value.toLowerCase().trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!name) {
            showErrorAlert('❌ Please enter your name or nickname');
            return;
        }

        if (!age || age < 18) {
            showErrorAlert('❌ You must be 18 or older to register');
            return;
        }

        if (!gender) {
            showErrorAlert('❌ Please select your gender');
            return;
        }

        if (!isValidEmail(email)) {
            showErrorAlert('❌ Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            showErrorAlert('❌ Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            showErrorAlert('❌ Passwords do not match');
            return;
        }

        // Check if email is already registered (prevent duplicate accounts)
        if (emailRegistry[email]) {
            showErrorAlert('❌ This email is already registered. Only one account per email is allowed.\n\n📧 If you forgot your password, please contact support.');
            return;
        }

        if (users[email]) {
            showErrorAlert('❌ User already exists with this email');
            return;
        }

        // Generate unique user ID and invite code
        const userId = 'BW' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
        const inviteCode = generateInviteCode();
        const registrationTimestamp = new Date().toISOString();

        // Generate random phone number for demo
        const phoneNumber = '9' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');

        // Create user account
        users[email] = {
            userId: userId,
            name: name,
            age: age,
            gender: gender,
            email: email,
            password: password,
            phoneNumber: phoneNumber,
            balance: 100, // Welcome bonus
            gamePoints: 100, // Game points for withdrawals
            registeredAt: registrationTimestamp,
            inviteCode: inviteCode,
            totalWinnings: 0,
            gamesPlayed: 0,
            invitedBy: null,
            matchHistory: [], // Individual match history
            accountStatus: 'active',
            withdrawalApproved: false, // Admin approval required for withdrawals
            kycVerified: false,
            lastLogin: null,
            loginCount: 0
        };

        // Register email to prevent duplicates
        emailRegistry[email] = {
            userId: userId,
            registeredAt: registrationTimestamp,
            accountEmail: email
        };

        // Store detailed user profile for admin
        userProfiles[userId] = {
            userId: userId,
            personalInfo: {
                name: name,
                age: age,
                gender: gender,
                email: email,
                phoneNumber: phoneNumber
            },
            accountInfo: {
                registeredAt: registrationTimestamp,
                accountStatus: 'active',
                withdrawalApproved: false,
                kycVerified: false,
                inviteCode: inviteCode
            },
            financialInfo: {
                balance: 100,
                gamePoints: 100,
                totalWinnings: 0,
                totalDeposits: 100,
                totalWithdrawals: 0
            },
            gameStats: {
                gamesPlayed: 0,
                winRate: 0,
                favoriteGame: null
            },
            bankDetails: null,
            documents: [],
            notes: ''
        };

        // Add welcome bonus to deposit history
        addToDepositHistory({
            userEmail: email,
            userName: name,
            phoneNumber: phoneNumber,
            amount: 100,
            type: 'welcome_bonus',
            transactionId: 'WB' + Date.now(),
            timestamp: registrationTimestamp,
            status: 'completed'
        });

        // Save all data
        localStorage.setItem('bucksWinUsers', JSON.stringify(users));
        localStorage.setItem('bucksWinEmailRegistry', JSON.stringify(emailRegistry));
        localStorage.setItem('bucksWinUserProfiles', JSON.stringify(userProfiles));

        showSuccessPopup('Registration Successful!', `🎉 Welcome ${name}!\n\n✅ Account created successfully\n💰 Welcome bonus: ₹100\n🎮 You can now login and start playing\n\n📧 User ID: ${userId}`);

        // Clear form
        document.getElementById('registerForm').reset();
        showLogin();

    } catch (error) {
        console.error('Registration error:', error);
        showErrorAlert('❌ Registration failed. Please try again.');
    }
}

function handleProfileUpdate(e) {
    e.preventDefault();

    try {
        const name = document.getElementById('updateName').value.trim();
        const age = parseInt(document.getElementById('updateAge').value);
        const gender = document.getElementById('updateGender').value;
        const newPassword = document.getElementById('updatePassword').value.trim();

        if (!name) {
            showErrorAlert('❌ Please enter your name');
            return;
        }

        if (!age || age < 18) {
            showErrorAlert('❌ You must be 18 or older');
            return;
        }

        if (!gender) {
            showErrorAlert('❌ Please select your gender');
            return;
        }

        // Update user data
        currentUser.name = name;
        currentUser.age = age;
        currentUser.gender = gender;

        if (newPassword) {
            currentUser.password = newPassword;
        }

        updateUserData();
        updateUserInfo();
        closeModal();

        showSuccessPopup('Profile Updated!', '✅ Your profile has been updated successfully');
    } catch (error) {
        console.error('Profile update error:', error);
        showErrorAlert('❌ Failed to update profile. Please try again.');
    }
}

// Navigation functions with error handling
function showLogin() {
    try {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('loginPage').classList.add('active');
    } catch (error) {
        console.error('Error showing login page:', error);
    }
}


function showAdminLogin() {
    try {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('adminLoginPage').classList.add('active');
    } catch (error) {
        console.error('Error showing admin login page:', error);
    }
}

function showDashboard() {
    try {
        // Hide all pages first
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show dashboard
        document.getElementById('dashboardPage').classList.add('active');

        updateUserInfo();
        updateInviteCode();
        updateWinnersChart();
        showRecentHistory();
        updateActiveBetsDisplay();
        startLiveLeaderboard();
        updateTopLeaderboard();
        loadSavedBankDetails();
        setupProfileDropdown();
        updateDashboardStats();
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showErrorAlert('❌ Failed to load dashboard. Please refresh the page.');
    }
}

function showAdminDashboard() {
    try {
        // Hide all pages first
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show admin dashboard
        const adminPage = document.getElementById('adminDashboardPage');
        if (adminPage) {
            adminPage.classList.add('active');
        }

        // Load all admin components with error handling
        setTimeout(() => {
            try {
                updateAdminStats();
            } catch (error) {
                console.error('Error loading admin stats:', error);
            }

            try {
                loadPaymentVerifications();
            } catch (error) {
                console.error('Error loading payment verifications:', error);
            }

            try {
                loadUserManagementPanel();
            } catch (error) {
                console.error('Error loading user management:', error);
            }

            try {
                loadWithdrawalRequests();
            } catch (error) {
                console.error('Error loading withdrawal requests:', error);
            }
        }, 100);

        console.log('Admin dashboard loaded successfully');
    } catch (error) {
        console.error('Admin dashboard error:', error);
        showErrorAlert('❌ Failed to load admin dashboard.');
    }
}

// Enhanced Payment Verification System with Manual UPI Verification
function processUPIPayment() {
    try {
        const amount = parseInt(document.getElementById('customRecharge').value);

        if (!amount || amount < 100) {
            showErrorAlert('❌ Minimum recharge amount is ₹100');
            return;
        }

        if (amount > 5000) {
            showErrorAlert('❌ Maximum recharge amount is ₹5000');
            return;
        }

        // Show manual UPI payment modal
        document.getElementById('paymentAmount').textContent = amount;
        closeModal(); // Close recharge modal
        document.getElementById('paymentModal').style.display = 'block';

        // Update payment method to manual verification
        showManualUPIInstructions(amount);

    } catch (error) {
        console.error('UPI payment error:', error);
        showErrorAlert('❌ Failed to process UPI payment. Please try again.');
    }
}

function showManualUPIInstructions(amount) {
    try {
        const upiId = PAYMENT_CONFIG.upiId;
        const merchantName = PAYMENT_CONFIG.merchantName;

        // Show detailed manual UPI instructions
        const instructionsModal = `
            <div class="upi-manual-instructions">
                <h3>💳 Manual UPI Payment Instructions</h3>
                <div class="payment-details">
                    <div class="detail-item">
                        <strong>💰 Amount:</strong> ₹${amount}
                    </div>
                    <div class="detail-item">
                        <strong>📱 UPI ID:</strong> ${upiId}
                        <button onclick="copyUPIID()" class="copy-btn">📋 Copy</button>
                    </div>
                    <div class="detail-item">
                        <strong>🏪 Merchant Name:</strong> ${merchantName}
                    </div>
                    <div class="detail-item">
                        <strong>🏦 Bank:</strong> ${PAYMENT_CONFIG.bankName}
                    </div>
                </div>

                <div class="payment-steps">
                    <h4>📋 Follow these steps:</h4>
                    <ol>
                        <li>🔗 Open any UPI app (PhonePe, GPay, Paytm, BHIM, etc.)</li>
                        <li>📱 Choose "Pay to Contact" or "Send Money"</li>
                        <li>📝 Enter UPI ID: <strong>${upiId}</strong></li>
                        <li>💰 Enter Amount: <strong>₹${amount}</strong></li>
                        <li>✏️ Add Note: <strong>BucksWin Deposit - ${currentUser.userId || currentUser.email.split('@')[0]}</strong></li>
                        <li>✅ Complete the payment</li>
                        <li>📷 Take screenshot of success page</li>
                        <li>🔄 Return here and submit verification details</li>
                    </ol>
                </div>

                <div class="verification-notice">
                    <div class="notice-icon">⚡</div>
                    <div class="notice-text">
                        <h4>Manual Verification Process</h4>
                        <p>💡 After payment, submit your transaction details below for manual verification by our admin team.</p>
                        <p>⏰ Verification time: Usually within 30 minutes during business hours</p>
                        <p>🔔 You'll be notified once your payment is verified and credited</p>
                    </div>
                </div>
            </div>
        `;

        // Update the UPI section with manual instructions
        const upiSection = document.getElementById('upiPaymentSection');
        if (upiSection) {
            upiSection.innerHTML = instructionsModal;
        }

    } catch (error) {
        console.error('Error showing manual UPI instructions:', error);
        showErrorAlert('❌ Failed to load payment instructions.');
    }
}

function processManualPaymentVerification() {
    try {
        const amount = parseInt(document.getElementById('paymentAmount').textContent);
        const transactionId = document.getElementById('transactionId').value.trim();
        const screenshotFile = document.getElementById('paymentScreenshot').files[0];

        // Enhanced validation
        if (!validatePaymentAmount(amount)) {
            showErrorAlert('❌ Invalid payment amount. Must be between ₹100 and ₹5,000');
            return;
        }

        if (!screenshotFile) {
            showErrorAlert('❌ Payment screenshot is required for manual verification.');
            return;
        }

        if (!transactionId || transactionId.length < 8) {
            showErrorAlert('❌ Please enter a valid transaction ID (minimum 8 characters)');
            return;
        }

        // Check for duplicate transaction ID
        const existingVerifications = paymentVerifications.filter(v => 
            v.transactionId && v.transactionId.toLowerCase() === transactionId.toLowerCase()
        );

        if (existingVerifications.length > 0) {
            showErrorAlert('❌ This transaction ID has already been submitted.\n\n🔍 Please check your payment app for the correct, unused transaction ID.');
            return;
        }

        // Create manual verification request
        const verificationRecord = {
            id: 'MAN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
            userEmail: currentUser.email,
            userName: currentUser.name,
            userId: currentUser.userId,
            amount: amount,
            transactionId: transactionId,
            timestamp: new Date().toISOString(),
            status: 'pending',
            paymentMethod: 'manual_upi_verification',
            screenshot: screenshotFile.name,
            screenshotSize: screenshotFile.size,
            screenshotType: screenshotFile.type,
            upiId: PAYMENT_CONFIG.upiId,
            merchantName: PAYMENT_CONFIG.merchantName,
            userNote: `Manual UPI payment verification request from ${currentUser.name}`,
            submittedAt: new Date().toLocaleString()
        };

        // Store verification request
        paymentVerifications.unshift(verificationRecord);
        localStorage.setItem('bucksWinPaymentVerifications', JSON.stringify(paymentVerifications));

        closeModal();

        // Clear form fields
        document.getElementById('transactionId').value = '';
        document.getElementById('paymentScreenshot').value = '';
        const screenshotPreview = document.getElementById('screenshotPreview');
        if (screenshotPreview) {
            screenshotPreview.innerHTML = '';
        }

        showSuccessPopup('Manual Verification Submitted!', 
            `✅ Your payment verification request has been submitted!\n\n💰 Amount: ₹${amount}\n🔒 Transaction ID: ${transactionId}\n📋 Verification ID: ${verificationRecord.id}\n\n⏰ Our admin team will verify your payment within 30 minutes\n📧 You'll be notified once approved and money is credited\n\n💡 Keep your UPI app open to show transaction details if needed`);

        // Store the verification in user's local record
        if (!currentUser.paymentVerifications) {
            currentUser.paymentVerifications = [];
        }
        currentUser.paymentVerifications.unshift({
            verificationId: verificationRecord.id,
            amount: amount,
            submittedAt: verificationRecord.timestamp,
            status: 'pending'
        });
        updateUserData();

    } catch (error) {
        console.error('Manual payment verification error:', error);
        showErrorAlert('❌ Failed to submit verification request. Please try again.');
    }
}

function confirmPayment() {
    try {
        processManualPaymentVerification();
    } catch (error) {
        console.error('Confirm payment error:', error);
        showErrorAlert('❌ Failed to process payment verification. Please try again.');
    }
}

// Admin Functions for Manual Payment Verification
function loadPaymentVerifications() {
    try {
        const verificationsContainer = document.getElementById('paymentVerifications');
        if (!verificationsContainer) return;

        if (paymentVerifications.length === 0) {
            verificationsContainer.innerHTML = '<p style="text-align: center; color: #666;">No payment verifications pending.</p>';
            return;
        }

        const pendingVerifications = paymentVerifications.filter(v => v.status === 'pending');

        verificationsContainer.innerHTML = `
            <div class="verifications-header">
                <h4>💳 Manual Payment Verifications (${pendingVerifications.length} pending)</h4>
                <button onclick="refreshPaymentVerifications()" class="refresh-btn">🔄 Refresh</button>
            </div>
            <div class="verifications-list">
                ${pendingVerifications.map(verification => `
                    <div class="verification-item pending">
                        <div class="verification-header">
                            <h4>${verification.userName} (${verification.userEmail})</h4>
                            <span class="verification-id">ID: ${verification.id}</span>
                        </div>
                        <div class="verification-details">
                            <div class="detail-row">
                                <strong>💰 Amount:</strong> ₹${verification.amount}
                            </div>
                            <div class="detail-row">
                                <strong>🔒 Transaction ID:</strong> ${verification.transactionId}
                            </div>
                            <div class="detail-row">
                                <strong>📱 UPI ID:</strong> ${verification.upiId}
                            </div>
                            <div class="detail-row">
                                <strong>🏪 Merchant:</strong> ${verification.merchantName}
                            </div>
                            <div class="detail-row">
                                <strong>📅 Submitted:</strong> ${verification.submittedAt}
                            </div>
                            <div class="detail-row">
                                <strong>📷 Screenshot:</strong> ${verification.screenshot} (${(verification.screenshotSize / 1024).toFixed(1)} KB)
                            </div>
                        </div>
                        <div class="verification-actions">
                            <button onclick="approveManualPayment('${verification.id}')" class="approve-btn">✅ Approve & Credit</button>
                            <button onclick="rejectManualPayment('${verification.id}')" class="reject-btn">❌ Reject</button>
                            <button onclick="viewVerificationDetails('${verification.id}')" class="details-btn">👁️ View Details</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Load payment verifications error:', error);
    }
}

function approveManualPayment(verificationId) {
    try {
        const verification = paymentVerifications.find(v => v.id === verificationId);

        if (!verification) {
            showErrorAlert('❌ Payment verification not found');
            return;
        }

        if (verification.status !== 'pending') {
            showErrorAlert('❌ Payment already processed');
            return;
        }

        // Mark as approved
        verification.status = 'approved';
        verification.approvedAt = new Date().toISOString();
        verification.approvedBy = 'Admin';

        // Add money to user account
        const user = users[verification.userEmail];
        if (user) {
            const oldBalance = user.balance;
            user.balance += verification.amount;
            user.gamePoints = (user.gamePoints || 0) + verification.amount;

            // Update user profile
            if (userProfiles[user.userId]) {
                userProfiles[user.userId].financialInfo.balance = user.balance;
                userProfiles[user.userId].financialInfo.totalDeposits += verification.amount;
            }

            users[verification.userEmail] = user;
            localStorage.setItem('bucksWinUsers', JSON.stringify(users));
            localStorage.setItem('bucksWinUserProfiles', JSON.stringify(userProfiles));

            // Add to deposit history
            addToDepositHistory({
                userEmail: verification.userEmail,
                userName: verification.userName,
                phoneNumber: user.phoneNumber || 'Not provided',
                amount: verification.amount,
                type: 'manual_upi_verification',
                transactionId: verification.transactionId,
                timestamp: verification.timestamp,
                status: 'completed',
                verified: true,
                verifiedBy: 'Admin (Manual)',
                verificationId: verification.id
            });

            showSuccessPopup('Payment Approved!', 
                `✅ Manual payment verification approved!\n\n👤 User: ${verification.userName}\n💰 Amount: ₹${verification.amount}\n🔒 Transaction: ${verification.transactionId}\n\n💳 User balance updated: ₹${oldBalance} → ₹${user.balance}\n⚡ User will be notified immediately`);
        } else {
            showErrorAlert('❌ User not found');
            return;
        }

        localStorage.setItem('bucksWinPaymentVerifications', JSON.stringify(paymentVerifications));

        loadPaymentVerifications();
        updateAdminStats();
    } catch (error) {
        console.error('Approve manual payment error:', error);
        showErrorAlert('❌ Failed to approve payment');
    }
}

function rejectManualPayment(verificationId) {
    try {
        const verification = paymentVerifications.find(v => v.id === verificationId);

        if (!verification) {
            showErrorAlert('❌ Payment verification not found');
            return;
        }

        if (verification.status !== 'pending') {
            showErrorAlert('❌ Payment already processed');
            return;
        }

        const reason = prompt('Enter reason for rejection (this will be shown to the user):');
        if (!reason || reason.trim() === '') {
            showErrorAlert('❌ Rejection reason is required');
            return;
        }

        // Mark as rejected
        verification.status = 'rejected';
        verification.rejectedAt = new Date().toISOString();
        verification.rejectedBy = 'Admin';
        verification.rejectionReason = reason.trim();

        localStorage.setItem('bucksWinPaymentVerifications', JSON.stringify(paymentVerifications));

        showSuccessPopup('Payment Rejected!', 
            `❌ Manual payment verification rejected\n\n👤 User: ${verification.userName}\n💰 Amount: ₹${verification.amount}\n📝 Reason: ${reason}\n\n📧 User will be notified of rejection`);

        loadPaymentVerifications();
    } catch (error) {
        console.error('Reject manual payment error:', error);
        showErrorAlert('❌ Failed to reject payment');
    }
}

function viewVerificationDetails(verificationId) {
    try {
        const verification = paymentVerifications.find(v => v.id === verificationId);
        if (!verification) {
            showErrorAlert('❌ Verification not found');
            return;
        }

        const details = `
📋 MANUAL PAYMENT VERIFICATION DETAILS

🆔 Verification ID: ${verification.id}
👤 User: ${verification.userName}
📧 Email: ${verification.userEmail}
🆔 User ID: ${verification.userId || 'N/A'}

💰 Payment Details:
• Amount: ₹${verification.amount}
• Transaction ID: ${verification.transactionId}
• UPI ID: ${verification.upiId}
• Merchant: ${verification.merchantName}

📷 Screenshot Info:
• File: ${verification.screenshot}
• Size: ${(verification.screenshotSize / 1024).toFixed(1)} KB
• Type: ${verification.screenshotType}

⏰ Timeline:
• Submitted: ${verification.submittedAt}
• Status: ${verification.status.toUpperCase()}
${verification.approvedAt ? `• Approved: ${new Date(verification.approvedAt).toLocaleString()}` : ''}
${verification.rejectedAt ? `• Rejected: ${new Date(verification.rejectedAt).toLocaleString()}` : ''}
${verification.rejectionReason ? `• Reason: ${verification.rejectionReason}` : ''}

💡 User Note: ${verification.userNote || 'None'}
        `;

        showResultPopup('info', 0, details);
    } catch (error) {
        console.error('View verification details error:', error);
        showErrorAlert('❌ Failed to load verification details');
    }
}

function refreshPaymentVerifications() {
    try {
        loadPaymentVerifications();
        showSuccessPopup('Refreshed!', '🔄 Payment verifications refreshed');
    } catch (error) {
        console.error('Refresh payments error:', error);
        showErrorAlert('❌ Failed to refresh payments');
    }
}

// Updated recharge flow
function selectRecharge(amount) {
    if (amount > 5000) {
        showErrorAlert('❌ Maximum deposit amount is ₹5,000');
        return;
    }
    document.getElementById('customRecharge').value = amount;
    updateRechargeButtons();
}

function processSecurePayment() {
    processUPIPayment();
}

// Enhanced UPI functions
function openUPIApp() {
    try {
        const amount = document.getElementById('paymentAmount').textContent;
        const upiId = PAYMENT_CONFIG.upiId;
        const merchantName = PAYMENT_CONFIG.merchantName;
        const orderId = 'BW' + Date.now();
        const userId = currentUser?.userId || currentUser?.email?.split('@')[0] || 'USER';

        // Enhanced UPI deep link with proper encoding
        const transactionNote = encodeURIComponent(`BucksWin-${userId}-${orderId}`);

        // Improved UPI deep link format
        const baseParams = `pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${transactionNote}&tr=${orderId}&mode=02&purpose=00`;

        // Enhanced UPI app schemes with better compatibility
        const upiApps = [
            `upi://pay?${baseParams}`,
            `phonepe://pay?${baseParams}`,
            `tez://upi/pay?${baseParams}`,
            `gpay://upi/pay?${baseParams}`,
            `paytmmp://pay?${baseParams}`,
            `bhim://pay?${baseParams}`
        ];

        let appLaunched = false;
        let attempts = 0;

        function tryLaunchUPIApp() {
            if (attempts >= upiApps.length || appLaunched) {
                if (!appLaunched) {
                    showUPIManualInstructions();
                }
                return;
            }

            const currentApp = upiApps[attempts];
            attempts++;

            try {
                const tempLink = document.createElement('a');
                tempLink.href = currentApp;
                tempLink.target = '_blank';
                tempLink.style.display = 'none';
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);

                appLaunched = true;
                showSuccessPopup('🎉 UPI App Opening!', 
                    `✅ Opening payment app...\n\n💰 Amount: ₹${amount}\n🏪 Merchant: ${merchantName}\n📧 UPI ID: ${upiId}\n\n📱 Complete the payment and return here\n📷 Submit details below for verification`);

            } catch (error) {
                console.log(`UPI app launch failed for ${currentApp}:`, error);
                setTimeout(tryLaunchUPIApp, 500);
            }
        }

        tryLaunchUPIApp();

    } catch (error) {
        console.error('UPI launch error:', error);
        showUPIManualInstructions();
    }
}

function showUPIManualInstructions() {
    try {
        const amountElement = document.getElementById('paymentAmount');
        const amount = amountElement ? amountElement.textContent : '100';
        const upiId = PAYMENT_CONFIG.upiId;
        const merchantName = PAYMENT_CONFIG.merchantName;

        showResultPopup('info', 0, 
            `📱 Manual UPI Payment Instructions\n\n` +
            `Please follow these steps:\n\n` +
            `1️⃣ Open any UPI app (PhonePe, GPay, Paytm, etc.)\n` +
            `2️⃣ Choose "Pay to Contact" or "Send Money"\n` +
            `3️⃣ Enter UPI ID: ${upiId}\n` +
            `4️⃣ Enter Amount: ₹${amount}\n` +
            `5️⃣ Add Note: BucksWin Deposit\n` +
            `6️⃣ Complete the payment\n` +
            `7️⃣ Take screenshot of success page\n` +
            `8️⃣ Return here and submit verification details\n\n` +
            `✅ Manual verification by admin team within 30 minutes!`
        );
    } catch (error) {
        console.error('Error showing UPI instructions:', error);
        showErrorAlert('❌ Failed to load payment instructions. Please refresh and try again.');
    }
}

function copyUPIID() {
    const upiId = PAYMENT_CONFIG.upiId;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiId)
            .then(() => {
                showSuccessPopup('UPI ID Copied!', `📋 UPI ID copied to clipboard:\n${upiId}\n\nPaste in your UPI app to complete payment`);
            })
            .catch((error) => {
                console.error('Clipboard API failed:', error);
                fallbackCopyUPIID(upiId);
            });
    } else {
        fallbackCopyUPIID(upiId);
    }
}

function fallbackCopyUPIID(upiId) {
    try {
        const tempInput = document.createElement('input');
        tempInput.value = upiId;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showSuccessPopup('UPI ID Copied!', `📋 UPI ID copied: ${upiId}`);
    } catch (error) {
        console.error('Fallback copy failed:', error);
        showErrorAlert('❌ Unable to copy UPI ID. Please copy manually: ' + upiId);
    }
}

function handleScreenshotUpload(event) {
    try {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showErrorAlert('❌ Please upload a valid image file');
                event.target.value = '';
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5000000) {
                showErrorAlert('❌ Image file too large. Maximum size is 5MB');
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('screenshotPreview');
                if (preview) {
                    preview.innerHTML = `
                        <div class="screenshot-preview">
                            <img src="${e.target.result}" alt="Payment Screenshot" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                            <p>✅ Screenshot uploaded successfully</p>
                            <p style="font-size: 12px; color: #666;">File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>
                        </div>
                    `;
                }
            };
            reader.readAsDataURL(file);
        }
    } catch (error) {
        console.error('Screenshot upload error:', error);
        showErrorAlert('❌ Failed to upload screenshot. Please try again.');
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePaymentAmount(amount) {
    return amount && amount >= 100 && amount <= 5000;
}

function generateInviteCode() {
    return 'BW' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Error handling and popup functions
function showErrorAlert(message) {
    showResultPopup('error', 0, message);
}

function showSuccessPopup(title, message) {
    try {
        const successPopup = document.getElementById('successPopup');
        const successTitle = document.getElementById('successTitle');
        const successMessage = document.getElementById('successMessage');

        if (successTitle) successTitle.textContent = title;
        if (successMessage) successMessage.textContent = message;
        if (successPopup) successPopup.style.display = 'block';

        // Auto close after 3 seconds
        setTimeout(() => {
            closeSuccessPopup();
        }, 3000);
    } catch (error) {
        console.error('Error showing success popup:', error);
        // Fallback to alert
        alert(`${title}\n\n${message}`);
    }
}

function showResultPopup(type, amount, message) {
    try {
        const popup = document.getElementById('resultPopup');
        const icon = document.getElementById('popupIcon');
        const title = document.getElementById('popupTitle');
        const amountText = document.getElementById('popupAmount');
        const messageText = document.getElementById('popupMessage');

        if (type === 'win') {
            if (icon) icon.textContent = '🎉';
            if (title) {
                title.textContent = 'WINNER!';
                title.style.color = '#4CAF50';
            }
            if (amountText) {
                amountText.textContent = `+₹${amount}`;
                amountText.style.color = '#4CAF50';
                amountText.style.fontSize = '24px';
                amountText.style.fontWeight = 'bold';
            }
        } else if (type === 'error') {
            if (icon) icon.textContent = '❌';
            if (title) {
                title.textContent = 'ERROR!';
                title.style.color = '#f44336';
            }
            if (amountText) {
                amountText.textContent = '';
                amountText.style.fontSize = '24px';
                amountText.style.fontWeight = 'bold';
            }
        } else if (type === 'info') {
            if (icon) icon.textContent = 'ℹ️';
            if (title) {
                title.textContent = 'INFORMATION';
                title.style.color = '#2196F3';
            }
            if (amountText) {
                amountText.textContent = '';
                amountText.style.fontSize = '24px';
                amountText.style.fontWeight = 'bold';
            }
        } else {
            if (icon) icon.textContent = '😢';
            if (title) {
                title.textContent = 'BETTER LUCK NEXT TIME!';
                title.style.color = '#f44336';
            }
            if (amountText) {
                amountText.textContent = `-₹${amount}`;
                amountText.style.color = '#f44336';
                amountText.style.fontSize = '24px';
                amountText.style.fontWeight = 'bold';
            }
        }

        if (messageText) messageText.textContent = message;
        if (popup) popup.style.display = 'block';

        // Auto close after 4 seconds for non-error messages
        if (type !== 'error' && type !== 'info') {
            setTimeout(() => {
                closeResultPopup();
            }, 4000);
        }
    } catch (error) {
        console.error('Error showing result popup:', error);
        // Fallback to alert
        alert(message);
    }
}

function closeSuccessPopup() {
    try {
        const successPopup = document.getElementById('successPopup');
        if (successPopup) successPopup.style.display = 'none';
    } catch (error) {
        console.error('Error closing success popup:', error);
    }
}

function closeResultPopup() {
    try {
        const resultPopup = document.getElementById('resultPopup');
        if (resultPopup) resultPopup.style.display = 'none';
    } catch (error) {
        console.error('Error closing result popup:', error);
    }
}

function closeModal() {
    try {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });

        // Clear form fields
        clearModalForms();
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

function clearModalForms() {
    try {
        // Clear transaction ID field
        const transactionField = document.getElementById('transactionId');
        if (transactionField) {
            transactionField.value = '';
        }

        // Clear screenshot upload
        const screenshotField = document.getElementById('paymentScreenshot');
        if (screenshotField) {
            screenshotField.value = '';
        }

        const screenshotPreview = document.getElementById('screenshotPreview');
        if (screenshotPreview) {
            screenshotPreview.innerHTML = '';
        }

        // Clear bank details form
        const bankFields = ['accountNumber', 'ifscCode', 'accountHolder', 'phoneNumber'];
        bankFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = '';
        });

        if (document.getElementById('saveDetails')) {
            document.getElementById('saveDetails').checked = false;
        }

        // Clear report message
        const reportMessage = document.getElementById('reportMessage');
        if (reportMessage) {
            reportMessage.value = '';
        }
    } catch (error) {
        console.error('Error clearing modal forms:', error);
    }
}

// Basic game and user management functions (simplified for space)
function updateUserInfo() {
    try {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = currentUser?.name || 'User';
        }

        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = currentUser?.email || '';
        }

        const balanceElement = document.getElementById('balance');
        if (balanceElement) {
            balanceElement.textContent = currentUser?.balance || 0;
        }

        // Update all balance displays
        const balanceElements = ['balanceDisplay', 'navBalance', 'gameBalance', 'diceGameBalance', 'cardBattleGameBalance'];
        balanceElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = currentUser?.balance || 0;
        });

        // Set avatar based on gender
        const avatar = document.getElementById('userAvatar');
        const profileAvatar = document.getElementById('profileCircleAvatar');
        let avatarText = '👤';

        switch(currentUser?.gender) {
            case 'male': avatarText = '👨'; break;
            case 'female': avatarText = '👩'; break;
            case 'other': avatarText = '🧑'; break;
            default: avatarText = '👤';
        }

        if (avatar) avatar.textContent = avatarText;
        if (profileAvatar) profileAvatar.textContent = avatarText;

    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

function updateUserData() {
    try {
        if (currentUser && currentUser.email) {
            users[currentUser.email] = currentUser;
            localStorage.setItem('bucksWinUsers', JSON.stringify(users));
            localStorage.setItem('bucksWinCurrentUser', JSON.stringify(currentUser));
        }
    } catch (error) {
        console.error('Error updating user data:', error);
    }
}

function logout() {
    try {
        localStorage.removeItem('bucksWinCurrentUser');
        currentUser = null;
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        if (leaderboardInterval) {
            clearInterval(leaderboardInterval);
        }

        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
        showLogin(); // Fallback
    }
}

function adminLogout() {
    try {
        localStorage.removeItem('bucksWinCurrentAdmin');
        currentAdmin = null;
        showLogin();
    } catch (error) {
        console.error('Admin logout error:', error);
        showLogin(); // Fallback
    }
}

// Game navigation functions
function startColorPredictionGame() {
    try {
        if (!currentUser) {
            showErrorAlert('❌ Please login to play games');
            return;
        }
        
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('gamePage').classList.add('active');
        updateUserInfo();
        updateActiveBetsDisplay();
    } catch (error) {
        console.error('Error starting color prediction game:', error);
        showErrorAlert('❌ Failed to start game. Please try again.');
    }
}

function startColorPredictionGameDemo() {
    showErrorAlert('🎮 Demo mode coming soon!');
}

function startDiceGame() {
    try {
        if (!currentUser) {
            showErrorAlert('❌ Please login to play games');
            return;
        }
        
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('diceGamePage').classList.add('active');
        updateUserInfo();
    } catch (error) {
        console.error('Error starting dice game:', error);
        showErrorAlert('❌ Failed to start game. Please try again.');
    }
}

function startDiceGameDemo() {
    showErrorAlert('🎲 Demo mode coming soon!');
}

function startCardBattleGame() {
    try {
        if (!currentUser) {
            showErrorAlert('❌ Please login to play games');
            return;
        }
        
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('cardBattleGamePage').classList.add('active');
        updateUserInfo();
    } catch (error) {
        console.error('Error starting card battle game:', error);
        showErrorAlert('❌ Failed to start game. Please try again.');
    }
}

function startCardBattleGameDemo() {
    showErrorAlert('🃏 Demo mode coming soon!');
}

// Game navigation back functions
function goToDashboard() {
    showDashboard();
}

function goToDashboardFromDice() {
    showDashboard();
}

function goToDashboardFromCard() {
    showDashboard();
}

function showRecharge() {
    try {
        document.getElementById('rechargeModal').style.display = 'block';
    } catch (error) {
        console.error('Error showing recharge modal:', error);
    }
}

function showWithdraw() {
    try {
        document.getElementById('withdrawModal').style.display = 'block';
    } catch (error) {
        console.error('Error showing withdraw modal:', error);
    }
}

function showProfile() {
    try {
        if (currentUser) {
            document.getElementById('updateName').value = currentUser.name || '';
            document.getElementById('updateAge').value = currentUser.age || '';
            document.getElementById('updateGender').value = currentUser.gender || '';
            document.getElementById('updateEmail').value = currentUser.email;
            document.getElementById('updatePassword').value = '';
        }
        document.getElementById('profileModal').style.display = 'block';
    } catch (error) {
        console.error('Error showing profile modal:', error);
    }
}

function showHistory() {
    try {
        if (!currentUser) {
            showErrorAlert('❌ Please login to view history');
            return;
        }

        const historyModal = document.getElementById('historyModal');
        const historyContent = document.getElementById('historyContent');
        
        if (!historyModal || !historyContent) {
            showErrorAlert('❌ History feature is not available');
            return;
        }

        // Get user's game history
        const userHistory = gameHistory.filter(game => 
            game.userEmail === currentUser.email
        ).slice(0, 20); // Show last 20 games

        if (userHistory.length === 0) {
            historyContent.innerHTML = `
                <div class="no-history">
                    <div class="no-history-icon">📊</div>
                    <h3>No Game History</h3>
                    <p>You haven't played any games yet!</p>
                    <p>Start playing to see your game history here.</p>
                </div>
            `;
        } else {
            let historyHTML = '<div class="history-list">';
            
            userHistory.forEach(game => {
                const date = new Date(game.timestamp).toLocaleString();
                const resultClass = game.result === 'win' ? 'win' : 'loss';
                const resultIcon = game.result === 'win' ? '🎉' : '😢';
                const amountPrefix = game.result === 'win' ? '+' : '-';
                
                historyHTML += `
                    <div class="history-item">
                        <div class="history-details">
                            <div class="history-game">${game.gameType || 'Color Prediction'}</div>
                            <div class="history-bet">Bet: ₹${game.betAmount} on ${game.prediction}</div>
                            <div class="history-time">${date}</div>
                        </div>
                        <div class="history-result ${resultClass}">
                            ${resultIcon} ${amountPrefix}₹${game.amount}
                        </div>
                    </div>
                `;
            });
            
            historyHTML += '</div>';
            historyContent.innerHTML = historyHTML;
        }

        historyModal.style.display = 'block';
        
    } catch (error) {
        console.error('Error showing history:', error);
        showErrorAlert('❌ Failed to load history. Please try again.');
    }
}

function showAbout() {
    try {
        document.getElementById('aboutModal').style.display = 'block';
    } catch (error) {
        console.error('Error showing about modal:', error);
    }
}

function showDepositHistory() {
    try {
        if (!currentUser) {
            showErrorAlert('❌ Please login to view deposit history');
            return;
        }

        const depositModal = document.getElementById('depositHistoryModal');
        const depositContent = document.getElementById('depositHistoryContent');
        
        if (!depositModal || !depositContent) {
            showErrorAlert('❌ Deposit history feature is not available');
            return;
        }

        // Get user's deposit history
        const allDeposits = depositHistory.allDeposits || [];
        const userDeposits = allDeposits.filter(deposit => 
            deposit.userEmail === currentUser.email
        ).slice(0, 20); // Show last 20 deposits

        if (userDeposits.length === 0) {
            depositContent.innerHTML = `
                <div class="no-deposits">
                    <div class="no-deposits-icon">💳</div>
                    <h3>No Deposit History</h3>
                    <p>You haven't made any deposits yet!</p>
                    <p>Add money to your wallet to see deposit history here.</p>
                    <button onclick="showRecharge(); closeModal();" class="add-money-btn">💵 Add Money Now</button>
                </div>
            `;
        } else {
            let depositsHTML = '<div class="deposits-list">';
            
            userDeposits.forEach(deposit => {
                const date = new Date(deposit.timestamp).toLocaleString();
                const statusClass = deposit.status === 'completed' ? 'completed' : 'pending';
                const statusIcon = deposit.status === 'completed' ? '✅' : '⏳';
                
                depositsHTML += `
                    <div class="deposit-item ${statusClass}">
                        <div class="deposit-details">
                            <div class="deposit-amount">₹${deposit.amount}</div>
                            <div class="deposit-type">${deposit.type || 'UPI Deposit'}</div>
                            <div class="deposit-time">${date}</div>
                            ${deposit.transactionId ? `<div class="deposit-id">ID: ${deposit.transactionId}</div>` : ''}
                        </div>
                        <div class="deposit-status ${statusClass}">
                            ${statusIcon} ${deposit.status}
                        </div>
                    </div>
                `;
            });
            
            depositsHTML += '</div>';
            depositContent.innerHTML = depositsHTML;
        }

        depositModal.style.display = 'block';
        
    } catch (error) {
        console.error('Error showing deposit history:', error);
        showErrorAlert('❌ Failed to load deposit history. Please try again.');
    }
}

function showReportModal() {
    try {
        document.getElementById('reportModal').style.display = 'block';
    } catch (error) {
        console.error('Error showing report modal:', error);
    }
}

function submitReport() {
    try {
        const reportMessage = document.getElementById('reportMessage').value.trim();

        if (!reportMessage) {
            showErrorAlert('❌ Please describe your issue');
            return;
        }

        // Store report
        let reports = JSON.parse(localStorage.getItem('bucksWinReports')) || [];
        const report = {
            id: 'RPT' + Date.now(),
            userEmail: currentUser.email,
            userName: currentUser.name,
            message: reportMessage,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        reports.unshift(report);
        localStorage.setItem('bucksWinReports', JSON.stringify(reports));

        closeModal();
        document.getElementById('reportMessage').value = '';

        showSuccessPopup('Report Submitted!', `✅ Your report #${report.id} has been submitted successfully!\n\n📧 We will review your case within 24 hours`);
    } catch (error) {
        console.error('Error submitting report:', error);
        showErrorAlert('❌ Failed to submit report. Please try again.');
    }
}

// Placeholder functions for admin panel
function updateAdminStats() {
    try {
        const totalUsers = Object.keys(users).length;
        const totalBalance = Object.values(users).reduce((sum, user) => sum + (user.balance || 0), 0);
        const allDeposits = depositHistory.allDeposits || [];
        const totalDeposits = allDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);

        const statsElements = [
            { id: 'adminTotalUsers', value: totalUsers },
            { id: 'adminTotalBalance', value: totalBalance },
            { id: 'adminTotalGames', value: gameHistory.length },
            { id: 'adminTotalDeposits', value: totalDeposits }
        ];

        statsElements.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (element) element.textContent = stat.value;
        });

        loadUserManagementPanel();
        loadWithdrawalRequests();
        loadPaymentVerifications();
    } catch (error) {
        console.error('Admin stats error:', error);
    }
}

function loadUserManagementPanel() {
    // Placeholder - implement user management
    const container = document.getElementById('userManagementPanel');
    if (container) {
        container.innerHTML = '<p>👥 User management panel - under development</p>';
    }
}

function loadWithdrawalRequests() {
    // Placeholder - implement withdrawal requests
    const container = document.getElementById('withdrawalRequestsPanel');
    if (container) {
        container.innerHTML = '<p>💸 Withdrawal requests panel - under development</p>';
    }
}

// Utility functions implementation
function migrateOldData() {
    try {
        // Migration logic for old user data
        const oldData = localStorage.getItem('bucksWinUser');
        if (oldData && !localStorage.getItem('bucksWinUsers')) {
            const userData = JSON.parse(oldData);
            if (userData.email) {
                users[userData.email] = userData;
                localStorage.setItem('bucksWinUsers', JSON.stringify(users));
            }
        }
    } catch (error) {
        console.error('Migration error:', error);
    }
}

function showInsufficientBalancePopup(requiredAmount) {
    try {
        const modal = document.getElementById('insufficientBalanceModal');
        if (modal) {
            document.getElementById('currentBalancePopup').textContent = currentUser?.balance || 0;
            document.getElementById('requiredAmountPopup').textContent = requiredAmount;
            document.getElementById('shortageAmountPopup').textContent = Math.max(0, requiredAmount - (currentUser?.balance || 0));
            modal.style.display = 'block';
        } else {
            showErrorAlert(`❌ Insufficient balance! You need ₹${requiredAmount} but have ₹${currentUser?.balance || 0}`);
        }
    } catch (error) {
        console.error('Error showing insufficient balance popup:', error);
        showErrorAlert('❌ Insufficient balance');
    }
}

function updateInviteCode() {
    try {
        const inviteCodeElement = document.getElementById('userInviteCode');
        if (inviteCodeElement && currentUser) {
            inviteCodeElement.textContent = currentUser.inviteCode || 'No code';
        }
    } catch (error) {
        console.error('Error updating invite code:', error);
    }
}

function updateWinnersChart() {
    try {
        const winnersChart = document.getElementById('winnersChart');
        if (winnersChart) {
            const winners = Object.values(users)
                .filter(user => user.totalWinnings > 0)
                .sort((a, b) => b.totalWinnings - a.totalWinnings)
                .slice(0, 5);

            if (winners.length === 0) {
                winnersChart.innerHTML = '<p style="text-align: center; color: #666;">No winners yet!</p>';
            } else {
                let html = '<div class="winners-list">';
                winners.forEach((winner, index) => {
                    html += `
                        <div class="winner-item">
                            <span class="winner-rank">#${index + 1}</span>
                            <span class="winner-name">${winner.name}</span>
                            <span class="winner-amount">₹${winner.totalWinnings}</span>
                        </div>
                    `;
                });
                html += '</div>';
                winnersChart.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error updating winners chart:', error);
    }
}

function showRecentHistory() {
    try {
        const historyList = document.getElementById('historyList');
        if (historyList && currentUser) {
            const userHistory = gameHistory
                .filter(game => game.userEmail === currentUser.email)
                .slice(0, 5);

            if (userHistory.length === 0) {
                historyList.innerHTML = '<p style="text-align: center; color: #666;">No recent games</p>';
            } else {
                let html = '';
                userHistory.forEach(game => {
                    const date = new Date(game.timestamp).toLocaleString();
                    const resultClass = game.result === 'win' ? 'win' : 'loss';
                    html += `
                        <div class="history-item">
                            <div class="history-details">
                                <div class="history-bet">${game.prediction} - ₹${game.betAmount}</div>
                                <div class="history-time">${date}</div>
                            </div>
                            <div class="history-result ${resultClass}">
                                ${game.result === 'win' ? '+' : '-'}₹${game.amount}
                            </div>
                        </div>
                    `;
                });
                historyList.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error showing recent history:', error);
    }
}

function updateActiveBetsDisplay() {
    try {
        const container = document.getElementById('activeBetsContainer');
        if (container) {
            if (activeBets.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">No active bets</p>';
            } else {
                let html = '<div class="active-bets-list">';
                activeBets.forEach(bet => {
                    html += `
                        <div class="active-bet-item">
                            <span>${bet.color} - ₹${bet.amount}</span>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error updating active bets:', error);
    }
}

function startLiveLeaderboard() {
    try {
        updateTopLeaderboard();
        if (leaderboardInterval) {
            clearInterval(leaderboardInterval);
        }
        leaderboardInterval = setInterval(updateTopLeaderboard, 30000); // Update every 30 seconds
    } catch (error) {
        console.error('Error starting live leaderboard:', error);
    }
}

function updateTopLeaderboard() {
    try {
        const leaderboard = document.getElementById('topLeaderboard');
        const liveLeaderboard = document.getElementById('liveLeaderboard');
        
        const topUsers = Object.values(users)
            .filter(user => user.totalWinnings > 0)
            .sort((a, b) => b.totalWinnings - a.totalWinnings)
            .slice(0, 3);

        const leaderboardHTML = topUsers.length === 0 
            ? '<p style="text-align: center; color: #666;">No leaders yet!</p>'
            : topUsers.map((user, index) => `
                <div class="leader-item">
                    <span class="leader-rank">#${index + 1}</span>
                    <span class="leader-name">${user.name}</span>
                    <span class="leader-amount">₹${user.totalWinnings}</span>
                </div>
              `).join('');

        if (leaderboard) leaderboard.innerHTML = leaderboardHTML;
        if (liveLeaderboard) liveLeaderboard.innerHTML = leaderboardHTML;
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

function loadSavedBankDetails() {
    try {
        if (currentUser && savedBankDetails[currentUser.email]) {
            const details = savedBankDetails[currentUser.email];
            const accountNumber = document.getElementById('accountNumber');
            const ifscCode = document.getElementById('ifscCode');
            const accountHolder = document.getElementById('accountHolder');
            
            if (accountNumber) accountNumber.value = details.accountNumber || '';
            if (ifscCode) ifscCode.value = details.ifscCode || '';
            if (accountHolder) accountHolder.value = details.accountHolder || '';
        }
    } catch (error) {
        console.error('Error loading saved bank details:', error);
    }
}

function setupProfileDropdown() {
    try {
        const profileCircle = document.getElementById('profileCircle');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileCircle && profileDropdown) {
            profileCircle.addEventListener('click', function(e) {
                e.stopPropagation();
                profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
            });

            document.addEventListener('click', function() {
                profileDropdown.style.display = 'none';
            });
        }
    } catch (error) {
        console.error('Error setting up profile dropdown:', error);
    }
}

function updateDashboardStats() {
    try {
        const totalBalance = document.getElementById('totalBalance');
        const totalWinnings = document.getElementById('totalWinnings');
        const gamesPlayed = document.getElementById('gamesPlayed');

        if (currentUser) {
            if (totalBalance) totalBalance.textContent = currentUser.balance || 0;
            if (totalWinnings) totalWinnings.textContent = currentUser.totalWinnings || 0;
            if (gamesPlayed) gamesPlayed.textContent = currentUser.gamesPlayed || 0;
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

function updateRechargeButtons() {
    try {
        const buttons = document.querySelectorAll('.recharge-amounts button');
        buttons.forEach(btn => btn.classList.remove('selected'));
        
        const customRecharge = document.getElementById('customRecharge');
        if (customRecharge && customRecharge.value) {
            // Custom amount entered
        }
    } catch (error) {
        console.error('Error updating recharge buttons:', error);
    }
}

function updateAmountButtons() {
    try {
        const buttons = document.querySelectorAll('.amount-btn');
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.textContent.replace('₹', '')) === selectedAmount) {
                btn.classList.add('selected');
            }
        });
    } catch (error) {
        console.error('Error updating amount buttons:', error);
    }
}

function addToDepositHistory(deposit) {
    try {
        if (!depositHistory.allDeposits) {
            depositHistory.allDeposits = [];
        }
        
        depositHistory.allDeposits.unshift(deposit);
        
        // Keep only last 100 deposits
        if (depositHistory.allDeposits.length > 100) {
            depositHistory.allDeposits = depositHistory.allDeposits.slice(0, 100);
        }
        
        localStorage.setItem('bucksWinDepositHistory', JSON.stringify(depositHistory));
    } catch (error) {
        console.error('Error adding to deposit history:', error);
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    try {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Close result popup when clicking outside
        if (event.target === document.getElementById('resultPopup')) {
            closeResultPopup();
        }
    } catch (error) {
        console.error('Error handling window click:', error);
    }
}

// Prevent form submission on enter key in amount inputs
document.addEventListener('keypress', function(e) {
    try {
        if (e.key === 'Enter' && (e.target.type === 'number' || e.target.type === 'text')) {
            e.preventDefault();
        }
    } catch (error) {
        console.error('Error handling keypress:', error);
    }
});

// Additional payment verification functions
function validatePaymentAmount(amount) {
    return amount && amount >= 100 && amount <= 5000;
}

function validateWithdrawalAmount(amount) {
    return amount && amount >= 150 && amount <= Math.min(6000, currentUser.balance);
}

function validateTransactionId(transactionId) {
    // Enhanced validation for transaction IDs with advanced pattern detection
    if (!transactionId || transactionId.length < 12 || transactionId.length > 25) {
        return false;
    }

    // Advanced fake pattern detection
    const fakePatterns = [
        'fake', 'test', 'demo', 'sample', 'trial', 'dummy', 'temp', 'example',
        'qwerty', 'asdfgh', 'zxcvbn', 'password', 'admin', 'user', 'guest',
        'abcdef', 'fedcba', 'abcd', 'xyz', 'aaa', 'bbb', 'ccc', 'ddd',
        'notreal', 'invalid', 'wrong', 'error', 'null', 'undefined',
        'payment', 'transaction', 'money', 'cash', 'bank', 'upi'
    ];

    // Sequential number patterns (more than 4 consecutive numbers)
    const sequentialPatterns = [
        '01234', '12345', '23456', '34567', '45678', '56789',
        '09876', '98765', '87654', '76543', '65432', '54321'
    ];

    // Repeated patterns
    const repeatedPatterns = [
        '000', '111', '222', '333', '444', '555', '666', '777', '888', '999',
        'aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff', 'ggg', 'hhh', 'iii', 'jjj'
    ];

    const lowerTransactionId = transactionId.toLowerCase();

    // Check for fake patterns
    for (let pattern of fakePatterns) {
        if (lowerTransactionId.includes(pattern)) {
            return false;
        }
    }

    // Check for sequential patterns
    for (let pattern of sequentialPatterns) {
        if (transactionId.includes(pattern)) {
            return false;
        }
    }

    // Check for repeated patterns
    for (let pattern of repeatedPatterns) {
        if (lowerTransactionId.includes(pattern)) {
            return false;
        }
    }

    // Check if it's all same characters (more strict)
    if (new Set(transactionId.toLowerCase()).size < 4) {
        return false;
    }

    // Must contain both numbers and letters for authenticity
    const hasNumbers = /[0-9]/.test(transactionId);
    const hasLetters = /[a-zA-Z]/.test(transactionId);
    if (!hasNumbers || !hasLetters) {
        return false;
    }

    // Check for keyboard patterns
    const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', 'plmnko'];
    for (let pattern of keyboardPatterns) {
        if (lowerTransactionId.includes(pattern)) {
            return false;
        }
    }

    // Check for too many repeated characters in a row
    for (let i = 0; i < transactionId.length - 3; i++) {
        if (transactionId[i] === transactionId[i+1] && 
            transactionId[i] === transactionId[i+2] && 
            transactionId[i] === transactionId[i+3]) {
            return false;
        }
    }

    // Check for common date patterns that might be fake
    const datePatterns = [
        '2024', '2023', '2022', '2021', '2020',
        '0101', '1212', '3112', '1501'
    ];

    let datePatternCount = 0;
    for (let pattern of datePatterns) {
        if (transactionId.includes(pattern)) {
            datePatternCount++;
        }
    }

    // If it contains multiple date patterns, likely fake
    if (datePatternCount > 1) {
        return false;
    }

    // Check entropy (randomness) - real transaction IDs should have good entropy
    const entropy = calculateEntropy(transactionId);
    if (entropy < 3.0) { // Minimum entropy threshold
        return false;
    }

    return true;
}

// Helper function to calculate entropy
function calculateEntropy(str) {
    const frequencies = {};
    for (let char of str) {
        frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    const length = str.length;

    for (let freq of Object.values(frequencies)) {
        const probability = freq / length;
        entropy -= probability * Math.log2(probability);
    }

    return entropy;
}

function validateBankDetails(accountNumber, ifscCode, accountHolder) {
    try {
        return accountNumber && accountNumber.length >= 9 && 
               ifscCode && ifscCode.length === 11 && 
               accountHolder && accountHolder.length >= 2;
    } catch (error) {
        console.error('Error in validateBankDetails:', error);
        return false;
    }
}

// Add missing report submission function
function submitReport() {
    try {
        const reportMessage = document.getElementById('reportMessage').value.trim();

        if (!reportMessage) {
            showErrorAlert('❌ Please describe your issue');
            return;
        }

        // Store report (in real app, this would be sent to server)
        let reports = JSON.parse(localStorage.getItem('bucksWinReports')) || [];
        const report = {
            id: 'RPT' + Date.now(),
            userEmail: currentUser.email,
            userName: currentUser.name,
            message: reportMessage,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        reports.unshift(report);
        localStorage.setItem('bucksWinReports', JSON.stringify(reports));

        closeModal();
        document.getElementById('reportMessage').value = '';

        showSuccessPopup('Report Submitted!', `✅ Your report #${report.id} has been submitted successfully!\n\n📧 We will review your case within 24 hours`);
    } catch (error) {
        console.error('Error submitting report:', error);
        showErrorAlert('❌ Failed to submit report. Please try again.');
    }
}

// Payment processing function
function processPayment(amount, transactionId, screenshot) {
    return new Promise((resolve, reject) => {
        try {
            // Validate transaction ID format
            if (!validateTransactionId(transactionId)) {
                reject(new Error('Invalid transaction ID format'));
                return;
            }

            // Simulate payment processing with your UPI system
            setTimeout(() => {
                // In a real implementation, you would:
                // 1. Verify the transaction with your payment gateway
                // 2. Check if the amount matches
                // 3. Validate the screenshot

                const success = Math.random() > 0.1; // 90% success rate for demo

                if (success) {
                    resolve({
                        status: 'success',
                        transactionId: transactionId,
                        amount: amount,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    reject(new Error('Payment verification failed'));
                }
            }, 2000);
        } catch (error) {
            console.log('Payment processing error handled:', error.message);
            reject(error);
        }
    });
}

// Add money to wallet
function addMoney(amount) {
    try {
        currentUser.balance += amount;
        updateBalance();
        localStorage.setItem('bucksWinUser', JSON.stringify(currentUser));

        // Add transaction record
        addTransaction('credit', amount, 'Money added to wallet');

        showSuccessPopup('Money Added!', `💰 ₹${amount} has been added to your wallet!`);
    } catch (error) {
        console.log('Add money error handled:', error.message);
        showErrorAlert('Failed to add money. Please try again.');
    }
}

// Process withdrawal
function processWithdrawal(amount, accountNumber, ifscCode, accountName) {
    try {
        if (currentUser.balance < amount) {
            showErrorAlert('❌ Insufficient balance for withdrawal');
            return;
        }

        // Deduct amount from balance
        currentUser.balance -= amount;
        updateBalance();
        localStorage.setItem('bucksWinUser', JSON.stringify(currentUser));

        // Add transaction record
        addTransaction('debit', amount, `Withdrawal to ${accountNumber}`);

        closeModal();
        showSuccessPopup('Withdrawal Requested!', `💸 Your withdrawal of ₹${amount} has been requested!\n\n🏦 Bank: ${accountNumber}\n⏰ Processing time: 2-5 business days\n\n📧 You will receive confirmation via email`);
    } catch (error) {
        console.log('Withdrawal error handled:', error.message);
        showErrorAlert('Withdrawal failed. Please try again.');
    }
}

function updateBalance() {
    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
        balanceElement.textContent = currentUser?.balance || 0;
    }
}

function addTransaction(type, amount, description) {
    try {
        if (!currentUser.transactions) {
            currentUser.transactions = [];
        }
        
        const transaction = {
            id: 'TXN' + Date.now(),
            type: type,
            amount: amount,
            description: description,
            timestamp: new Date().toISOString(),
            balance: currentUser.balance
        };
        
        currentUser.transactions.unshift(transaction);
        
        // Keep only last 50 transactions
        if (currentUser.transactions.length > 50) {
            currentUser.transactions = currentUser.transactions.slice(0, 50);
        }
        
        updateUserData();
    } catch (error) {
        console.error('Error adding transaction:', error);
    }
}

// Dice game functions
function selectDiceNumber(number) {
    try {
        if (currentUser && currentUser.balance <= 0) {
            showInsufficientBalancePopup(10);
            return;
        }
        
        diceSelectedNumber = number;
        document.querySelectorAll('[data-dice-number]').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-dice-number="${number}"]`).classList.add('selected');
    } catch (error) {
        console.error('Error selecting dice number:', error);
    }
}

function selectDiceAmount(amount) {
    try {
        if (currentUser && currentUser.balance < amount) {
            showInsufficientBalancePopup(amount);
            return;
        }
        
        diceSelectedAmount = amount;
        document.querySelectorAll('.dice-amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        // Clear custom amount
        const customDiceAmount = document.getElementById('customDiceAmount');
        if (customDiceAmount) customDiceAmount.value = '';
    } catch (error) {
        console.error('Error selecting dice amount:', error);
    }
}

function placeDiceBet() {
    try {
        const customAmount = document.getElementById('customDiceAmount').value;
        const finalAmount = customAmount ? parseInt(customAmount) : diceSelectedAmount;
        
        if (!diceSelectedNumber) {
            showErrorAlert('❌ Please select a number first');
            return;
        }
        
        if (!finalAmount || finalAmount < 10) {
            showErrorAlert('❌ Please select bet amount (minimum ₹10)');
            return;
        }
        
        if (currentUser.balance < finalAmount) {
            showInsufficientBalancePopup(finalAmount);
            return;
        }
        
        // Simulate dice roll
        const rolledNumber = Math.floor(Math.random() * 6) + 1;
        const won = rolledNumber === diceSelectedNumber;
        const winAmount = won ? finalAmount * 6 : 0;
        
        // Update balance
        currentUser.balance -= finalAmount;
        if (won) {
            currentUser.balance += winAmount;
            currentUser.totalWinnings = (currentUser.totalWinnings || 0) + winAmount;
        }
        currentUser.gamesPlayed = (currentUser.gamesPlayed || 0) + 1;
        
        // Add to game history
        gameHistory.unshift({
            userEmail: currentUser.email,
            gameType: 'Dice Game',
            prediction: `Number ${diceSelectedNumber}`,
            result: won ? 'win' : 'loss',
            betAmount: finalAmount,
            amount: won ? winAmount : finalAmount,
            actualResult: `Rolled ${rolledNumber}`,
            timestamp: new Date().toISOString()
        });
        
        updateUserData();
        localStorage.setItem('bucksWinHistory', JSON.stringify(gameHistory));
        updateUserInfo();
        
        // Show result
        showResultPopup(
            won ? 'win' : 'loss',
            won ? winAmount : finalAmount,
            won ? `🎉 You guessed correctly! The dice rolled ${rolledNumber}!` : `😢 The dice rolled ${rolledNumber}, not ${diceSelectedNumber}. Better luck next time!`
        );
        
        // Reset selections
        diceSelectedNumber = null;
        diceSelectedAmount = 0;
        document.querySelectorAll('[data-dice-number]').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.dice-amount-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('customDiceAmount').value = '';
        
    } catch (error) {
        console.error('Error placing dice bet:', error);
        showErrorAlert('❌ Failed to place bet. Please try again.');
    }
}

// Card game functions
function selectCard(card) {
    try {
        if (currentUser && currentUser.balance <= 0) {
            showInsufficientBalancePopup(10);
            return;
        }
        
        cardSelectedCard = card;
        document.querySelectorAll('[data-card]').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-card="${card}"]`).classList.add('selected');
    } catch (error) {
        console.error('Error selecting card:', error);
    }
}

function selectCardAmount(amount) {
    try {
        if (currentUser && currentUser.balance < amount) {
            showInsufficientBalancePopup(amount);
            return;
        }
        
        cardSelectedAmount = amount;
        document.querySelectorAll('.card-amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        // Clear custom amount
        const customCardAmount = document.getElementById('customCardAmount');
        if (customCardAmount) customCardAmount.value = '';
    } catch (error) {
        console.error('Error selecting card amount:', error);
    }
}

function playCardBattle() {
    try {
        const customAmount = document.getElementById('customCardAmount').value;
        const finalAmount = customAmount ? parseInt(customAmount) : cardSelectedAmount;
        
        if (!cardSelectedCard) {
            showErrorAlert('❌ Please select a card first');
            return;
        }
        
        if (!finalAmount || finalAmount < 10) {
            showErrorAlert('❌ Please select bet amount (minimum ₹10)');
            return;
        }
        
        if (currentUser.balance < finalAmount) {
            showInsufficientBalancePopup(finalAmount);
            return;
        }
        
        // Get card values
        const getCardValue = (card) => {
            if (card === 'A') return 1;
            if (card === 'J') return 11;
            if (card === 'Q') return 12;
            if (card === 'K') return 13;
            return parseInt(card);
        };
        
        const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const computerCard = cards[Math.floor(Math.random() * cards.length)];
        
        const userValue = getCardValue(cardSelectedCard);
        const computerValue = getCardValue(computerCard);
        
        let result, winAmount = 0;
        if (userValue > computerValue) {
            result = 'win';
            winAmount = finalAmount * 2;
        } else if (userValue === computerValue) {
            result = 'draw';
            winAmount = finalAmount; // Return bet amount
        } else {
            result = 'loss';
            winAmount = 0;
        }
        
        // Update balance
        currentUser.balance -= finalAmount;
        if (result === 'win' || result === 'draw') {
            currentUser.balance += winAmount;
            if (result === 'win') {
                currentUser.totalWinnings = (currentUser.totalWinnings || 0) + winAmount;
            }
        }
        currentUser.gamesPlayed = (currentUser.gamesPlayed || 0) + 1;
        
        // Add to game history
        gameHistory.unshift({
            userEmail: currentUser.email,
            gameType: 'Card Battle',
            prediction: `Card ${cardSelectedCard}`,
            result: result === 'draw' ? 'draw' : result,
            betAmount: finalAmount,
            amount: result === 'loss' ? finalAmount : winAmount,
            actualResult: `Computer: ${computerCard}`,
            timestamp: new Date().toISOString()
        });
        
        updateUserData();
        localStorage.setItem('bucksWinHistory', JSON.stringify(gameHistory));
        updateUserInfo();
        
        // Show result
        let message = '';
        if (result === 'win') {
            message = `🎉 You won! Your ${cardSelectedCard} (${userValue}) beat computer's ${computerCard} (${computerValue})!`;
        } else if (result === 'draw') {
            message = `🤝 It's a draw! Both cards have value ${userValue}. Your bet is returned.`;
        } else {
            message = `😢 You lost! Computer's ${computerCard} (${computerValue}) beat your ${cardSelectedCard} (${userValue}).`;
        }
        
        showResultPopup(result === 'draw' ? 'info' : result, winAmount || finalAmount, message);
        
        // Reset selections
        cardSelectedCard = null;
        cardSelectedAmount = 0;
        document.querySelectorAll('[data-card]').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.card-amount-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('customCardAmount').value = '';
        
    } catch (error) {
        console.error('Error playing card battle:', error);
        showErrorAlert('❌ Failed to play card battle. Please try again.');
    }
}