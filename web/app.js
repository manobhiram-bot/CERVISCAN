/**
 * CerviScan - Web Application Core Logic
 * Handles client-side routing, state management, forms, API integrations, and printing.
 */

// ==========================================================================
// DYNAMIC ENDPOINTS SPECIFICATION
// ==========================================================================
let backendBase = window.location.origin + '/cerviscan-backend/api/';
if (window.location.protocol === 'file:') {
    // Fallback URL for local static file testing
    backendBase = 'http://localhost:8080/cerviscan-backend/api/';
}
const BACKEND_URL = backendBase;
// Fallback to the current hostname at port 5000 for the Flask AI Service
const AI_SERVICE_URL = 'http://' + (window.location.hostname || 'localhost') + ':5000/';

console.log('Backend API Base:', BACKEND_URL);
console.log('AI Service Base:', AI_SERVICE_URL);

// ==========================================================================
// STATE VARIABLES
// ==========================================================================
let state = {
    currentUser: null,      // User object from DB session
    activePatient: null,    // Currently screening patient details
    selectedFile: null,     // Selected X-Ray image file
    historyList: [],        // Cached scan history array
    currentSortOption: 0,   // Sort index
    resetEmail: '',         // Email being reset during OTP flow
};

// ==========================================================================
// INITIALIZATION AND ROUTING
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Session check
    checkSession();

    // 2. Routing listener
    window.addEventListener('hashchange', handleRouting);
    handleRouting();

    // 3. Password visibility togglers
    setupPasswordToggles();

    // 4. Setup OTP box listeners
    setupOtpInputSequence();

    // 5. Setup Form Submit Listeners
    setupFormListeners();

    // 6. Setup Drag & Drop Image Upload
    setupDragAndDrop();

    // 7. Profile Actions
    setupProfileActions();

    // 8. History Page Controls
    setupHistoryControls();
}

function checkSession() {
    const savedUser = localStorage.getItem('cerviscan_user');
    if (savedUser) {
        try {
            state.currentUser = JSON.parse(savedUser);
            updateUserUI();
        } catch (e) {
            localStorage.removeItem('cerviscan_user');
            state.currentUser = null;
        }
    }
}

function handleRouting() {
    const hash = window.location.hash || '#splash';
    console.log('Routing to:', hash);

    // Auto-close mobile drawer menu on page transition
    if (typeof toggleMobileSidebar === 'function') {
        toggleMobileSidebar(false);
    }

    const authHashes = ['#login', '#signup', '#forgot-password', '#verify-otp', '#new-password', '#reset-success'];

    // Route Protection
    if (!state.currentUser && !authHashes.includes(hash) && hash !== '#splash') {
        window.location.hash = '#login';
        return;
    }

    if (state.currentUser && (hash === '#login' || hash === '#signup' || hash === '#splash')) {
        window.location.hash = '#dashboard';
        return;
    }

    // Special Splash handling: auto-redirects after 1.5s
    if (hash === '#splash') {
        setTimeout(() => {
            if (state.currentUser) {
                window.location.hash = '#dashboard';
            } else {
                window.location.hash = '#login';
            }
        }, 1500);
    }

    // Toggle Active Screen Section
    const viewId = 'view-' + hash.substring(1);
    const targetView = document.getElementById(viewId);

    if (targetView) {
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.remove('active');
        });
        targetView.classList.add('active');
    }

    // Toggle Sidebar Navigation Display
    const sidebar = document.getElementById('app-sidebar');
    if (state.currentUser && !authHashes.includes(hash) && hash !== '#splash') {
        sidebar.style.display = 'flex';
        // Highlight active menu item
        const targetMenu = hash.substring(1);
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
            if (item.getAttribute('data-target') === targetMenu) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    } else {
        sidebar.style.display = 'none';
    }

    // Fetch and sync data on specific page triggers
    if (hash === '#dashboard' && state.currentUser) {
        loadDashboardStats();
    } else if (hash === '#scan-history' && state.currentUser) {
        fetchScanHistory();
    } else if (hash === '#profile' && state.currentUser) {
        populateProfileFields();
    }
}

// Helper to normalize backend image urls to the current active hostname
function getNormalizedImageUrl(url) {
    if (!url) return '';
    try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            const urlObj = new URL(url);
            if (window.location.protocol === 'file:') {
                urlObj.host = 'localhost:8080';
                urlObj.protocol = 'http:';
            } else {
                urlObj.host = window.location.host;
                urlObj.protocol = window.location.protocol;
            }
            return urlObj.toString();
        }
    } catch (e) {
        console.error('Error normalizing URL:', e);
    }
    return url;
}

// Helper to update User Name and Avatar across all headers
function updateUserUI() {
    if (!state.currentUser) return;
    
    const nameLabels = document.querySelectorAll('.user-name-label');
    nameLabels.forEach(label => {
        label.textContent = state.currentUser.name || 'John Doe';
    });

    const emailLabel = document.getElementById('profile-label-email');
    if (emailLabel) emailLabel.textContent = state.currentUser.email;

    const profileImgs = document.querySelectorAll('.user-profile-image');
    profileImgs.forEach(img => {
        if (state.currentUser.profile_image) {
            img.src = getNormalizedImageUrl(state.currentUser.profile_image);
        } else {
            img.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; // default doc icon
        }
    });
}

function setupPasswordToggles() {
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
            }
        });
    });
}

// ==========================================================================
// OTP CODE BLOCK TIMINGS AND KEYSTROKE SEQUENCE
// ==========================================================================
function setupOtpInputSequence() {
    const boxes = document.querySelectorAll('.otp-box');
    boxes.forEach((box, index) => {
        box.addEventListener('keyup', (e) => {
            if (e.target.value.length === 1 && index < boxes.length - 1) {
                boxes[index + 1].focus();
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                boxes[index - 1].focus();
            }
        });
    });
}

// ==========================================================================
// FORM SUBMIT HANDLERS (API INTEGRATION)
// ==========================================================================
function setupFormListeners() {
    
    // LOGIN
    const formLogin = document.getElementById('form-login');
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');
        const submitBtn = document.getElementById('btn-login-submit');

        errorEl.style.display = 'none';
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch(BACKEND_URL + 'login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (data.status === 'success') {
                // Save session in local storage
                state.currentUser = {
                    user_id: data.user_id,
                    name: data.name,
                    email: data.email,
                    age: data.age,
                    mobile: data.mobile,
                    gender: data.gender,
                    location: data.location,
                    profile_image: data.profile_image
                };
                localStorage.setItem('cerviscan_user', JSON.stringify(state.currentUser));
                updateUserUI();
                
                // Clear inputs
                formLogin.reset();
                window.location.hash = '#dashboard';
            } else {
                errorEl.textContent = data.message || 'Invalid email or password.';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Login Error:', error);
            errorEl.textContent = 'API connection error. Please ensure XAMPP services are running.';
            errorEl.style.display = 'block';
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });

    // SIGNUP
    const formSignup = document.getElementById('form-signup');
    formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const errorEl = document.getElementById('signup-error');
        const submitBtn = document.getElementById('btn-signup-submit');

        errorEl.style.display = 'none';
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch(BACKEND_URL + 'signup.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();

            if (data.status === 'success') {
                alert('Account registered successfully! Redirecting to sign in page.');
                formSignup.reset();
                window.location.hash = '#login';
            } else {
                errorEl.textContent = data.message || 'Registration failed.';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Signup Error:', error);
            errorEl.textContent = 'API connection error. Please try again.';
            errorEl.style.display = 'block';
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });

    // FORGOT PASSWORD (SEND OTP)
    const formForgot = document.getElementById('form-forgot-password');
    formForgot.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim();
        const errorEl = document.getElementById('forgot-error');
        const submitBtn = document.getElementById('btn-forgot-submit');

        errorEl.style.display = 'none';
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch(BACKEND_URL + 'send_otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (data.status === 'success') {
                state.resetEmail = email;
                document.getElementById('otp-target-email').textContent = email;
                formForgot.reset();
                window.location.hash = '#verify-otp';
            } else {
                errorEl.textContent = data.message || 'Failed to send verification code.';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Forgot password Error:', error);
            errorEl.textContent = 'Network connection error.';
            errorEl.style.display = 'block';
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });

    // VERIFY OTP
    const formVerifyOtp = document.getElementById('form-verify-otp');
    formVerifyOtp.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('otp-error');
        const submitBtn = document.getElementById('btn-otp-submit');
        
        // Collect OTP digits
        const boxes = document.querySelectorAll('.otp-box');
        let otp = '';
        boxes.forEach(box => otp += box.value.trim());

        if (otp.length !== 4) {
            errorEl.textContent = 'Please enter all 4 digits.';
            errorEl.style.display = 'block';
            return;
        }

        errorEl.style.display = 'none';
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch(BACKEND_URL + 'verify_otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: state.resetEmail, otp })
            });
            const data = await response.json();

            if (data.status === 'success') {
                boxes.forEach(box => box.value = '');
                window.location.hash = '#new-password';
            } else {
                errorEl.textContent = data.message || 'Incorrect verification code.';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Verify OTP Error:', error);
            errorEl.textContent = 'Connection timeout.';
            errorEl.style.display = 'block';
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });

    // RESEND OTP
    const btnResendOtp = document.getElementById('btn-resend-otp');
    btnResendOtp.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(BACKEND_URL + 'send_otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: state.resetEmail })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert('Verification code resent successfully to ' + state.resetEmail);
            } else {
                alert('Error resending code: ' + (data.message || 'Failed'));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to resend OTP due to network error.');
        }
    });

    // RESET / NEW PASSWORD
    const formNewPassword = document.getElementById('form-new-password');
    formNewPassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        const errorEl = document.getElementById('new-password-error');
        const submitBtn = document.getElementById('btn-new-password-submit');

        if (newPassword !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match.';
            errorEl.style.display = 'block';
            return;
        }

        errorEl.style.display = 'none';
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch(BACKEND_URL + 'reset_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: state.resetEmail, password: newPassword })
            });
            const data = await response.json();

            if (data.status === 'success') {
                formNewPassword.reset();
                window.location.hash = '#reset-success';
            } else {
                errorEl.textContent = data.message || 'Password update failed.';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Password Reset Error:', error);
            errorEl.textContent = 'Server connection error.';
            errorEl.style.display = 'block';
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });

    // LOGOUT TRIGGER BUTTONS
    document.querySelectorAll('.btn-logout-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to sign out?')) {
                localStorage.removeItem('cerviscan_user');
                state.currentUser = null;
                state.activePatient = null;
                state.selectedFile = null;
                window.location.hash = '#login';
            }
        });
    });

    // SAVE PATIENT DETAILS
    const formPatient = document.getElementById('form-patient-details');
    formPatient.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('patient-name').value.trim();
        const age = document.getElementById('patient-age').value.trim();
        const gender = document.getElementById('patient-gender').value;
        const caseId = document.getElementById('patient-case-id').value.trim();
        const submitBtn = document.getElementById('btn-patient-submit');

        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch(BACKEND_URL + 'save_patient.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: state.currentUser.user_id,
                    name: name,
                    age: parseInt(age),
                    gender: gender,
                    case_id: parseInt(caseId)
                })
            });
            const data = await response.json();

            if (data.status === 'success') {
                // Save patient to active state
                state.activePatient = {
                    patient_id: data.patient_id,
                    name: name,
                    age: age,
                    gender: gender,
                    caseId: caseId
                };

                // Clear patient form
                formPatient.reset();

                // Setup upload view details
                document.getElementById('active-patient-name').textContent = name;
                document.getElementById('active-patient-case').textContent = caseId;

                // Reset drop zone
                resetDropZone();

                window.location.hash = '#upload-scan';
            } else {
                alert('Failed to save patient: ' + (data.message || 'Database error'));
            }
        } catch (error) {
            console.error('Save Patient Error:', error);
            alert('Could not save patient. Please check database configuration.');
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });
}

// ==========================================================================
// DRAG AND DROP IMAGE UPLOAD ENGINE
// ==========================================================================
function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('xray-file-input');
    const removePreviewBtn = document.getElementById('btn-remove-preview');
    const analyzeBtn = document.getElementById('btn-analyze-image');

    // Trigger click on browse
    dropZone.addEventListener('click', (e) => {
        // Prevent looping if clicking on remove preview button
        if (e.target.closest('#btn-remove-preview')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleSelectedFile(e.target.files[0]);
        }
    });

    // Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleSelectedFile(files[0]);
        }
    });

    removePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetDropZone();
    });

    // AI Prediction Trigger
    analyzeBtn.addEventListener('click', () => {
        if (!state.selectedFile || !state.activePatient) return;
        triggerAiDiagnosis();
    });
}

function handleSelectedFile(file) {
    const errorEl = document.getElementById('upload-error');
    const previewDiv = document.querySelector('.dropzone-preview');
    const promptDiv = document.querySelector('.dropzone-prompt');
    const imagePreview = document.getElementById('image-preview');
    const analyzeBtn = document.getElementById('btn-analyze-image');

    errorEl.style.display = 'none';

    // File validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        errorEl.textContent = 'Invalid file type. Please upload a chest X-Ray in JPG, JPEG or PNG format.';
        errorEl.style.display = 'block';
        resetDropZone();
        return;
    }

    state.selectedFile = file;

    // Display Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        promptDiv.style.display = 'none';
        previewDiv.style.display = 'block';
        analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

function resetDropZone() {
    state.selectedFile = null;
    document.getElementById('xray-file-input').value = '';
    document.querySelector('.dropzone-prompt').style.display = 'flex';
    document.querySelector('.dropzone-preview').style.display = 'none';
    document.getElementById('image-preview').src = '';
    document.getElementById('btn-analyze-image').disabled = true;
    document.getElementById('upload-error').style.display = 'none';
}

// ==========================================================================
// ML PREDICTION MODEL REQUEST
// ==========================================================================
async function triggerAiDiagnosis() {
    const modalAnalyzing = document.getElementById('modal-analyzing');
    const errorEl = document.getElementById('upload-error');
    const analyzeBtn = document.getElementById('btn-analyze-image');

    errorEl.style.display = 'none';
    analyzeBtn.classList.add('btn-loading');
    analyzeBtn.disabled = true;
    modalAnalyzing.style.display = 'flex';

    // 1. Invoke Flask ML service
    const formData = new FormData();
    formData.append('file', state.selectedFile);

    try {
        const response = await fetch(AI_SERVICE_URL + 'predict', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `AI Model service returned error status ${response.status}`);
        }

        const aiResult = await response.json();
        console.log('AI Prediction Output:', aiResult);

        // Extract confidence numeric value
        const rawConfidence = aiResult.confidence.replace('%', '');
        const confidenceNum = parseFloat(rawConfidence) || 90.0;

        // 2. Upload scan and save records on main PHP server
        await saveScanRecord(aiResult.result, confidenceNum);

    } catch (err) {
        console.error('Diagnosis processing failed:', err);
        modalAnalyzing.style.display = 'none';
        errorEl.textContent = err.message || 'Connection to Flask AI model failed. Please verify python app.py is running on port 5000.';
        errorEl.style.display = 'block';
    } finally {
        analyzeBtn.classList.remove('btn-loading');
        analyzeBtn.disabled = false;
    }
}

async function saveScanRecord(predictionLabel, confidence) {
    const modalAnalyzing = document.getElementById('modal-analyzing');
    
    // Build multipart data
    const formData = new FormData();
    formData.append('patient_id', state.activePatient.patient_id);
    formData.append('label', predictionLabel);
    formData.append('confidence', confidence.toFixed(2));
    formData.append('xray', state.selectedFile);

    try {
        const response = await fetch(BACKEND_URL + 'upload_and_save_scan.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        modalAnalyzing.style.display = 'none';

        if (data.status === 'success') {
            // Setup Scan Result Screen Data
            populateScanResultView(predictionLabel, confidence, data.image_url);
            window.location.hash = '#scan-result';
        } else {
            alert('AI screening completed, but saving report in DB failed: ' + (data.message || 'Unknown database exception'));
        }
    } catch (e) {
        console.error('Database Sync Error:', e);
        modalAnalyzing.style.display = 'none';
        alert('Database server communication timed out. Scan details not recorded.');
    }
}

// ==========================================================================
// RENDER SCAN RESULTS & INTERPRETATIONS
// ==========================================================================
function populateScanResultView(prediction, confidence, imageUrl) {
    const reportId = 'SRN-' + Math.floor(100000 + Math.random() * 900000);
    const currentDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // HUD Display
    document.getElementById('result-image-display').src = imageUrl;
    const scannerOverlay = document.querySelector('.hud-scanner-overlay');
    scannerOverlay.classList.remove('hud-inactive');

    // Remove scanning animation line after 2.5s for visual effect
    setTimeout(() => {
        scannerOverlay.classList.add('hud-inactive');
    }, 3000);

    // Diagnostics badges mapping
    const labelEl = document.getElementById('result-label');
    labelEl.textContent = prediction.toUpperCase();
    
    // Reset classes
    labelEl.className = 'diag-badge';
    if (prediction.includes('Normal')) {
        labelEl.classList.add('badge-normal');
    } else if (prediction.includes('Left')) {
        labelEl.classList.add('badge-rib-left');
    } else if (prediction.includes('Right')) {
        labelEl.classList.add('badge-rib-right');
    } else {
        labelEl.classList.add('badge-rib-bicrib');
    }

    // Confidence elements
    document.getElementById('result-report-id').textContent = 'REPORT ID: ' + reportId;
    document.getElementById('result-confidence-text').textContent = confidence.toFixed(2) + '%';
    document.getElementById('result-confidence-fill').style.width = confidence.toFixed(2) + '%';

    // Patient Meta
    document.getElementById('result-patient-name').textContent = state.activePatient.name;
    document.getElementById('result-patient-meta').textContent = `${state.activePatient.age} Years / ${state.activePatient.gender}`;
    document.getElementById('result-patient-case').textContent = state.activePatient.caseId;
    document.getElementById('result-date').textContent = currentDate;

    // View Detailed Explanation Modal Configuration
    const btnViewExp = document.getElementById('btn-view-explanation');
    const interpretationData = getExplanationDetails(prediction);

    // Modal populate event
    btnViewExp.onclick = () => {
        const modalExp = document.getElementById('modal-explanation');
        const expCategory = document.getElementById('exp-category');
        expCategory.textContent = prediction.toUpperCase();
        expCategory.className = 'explanation-pill ' + labelEl.classList[1]; // copy badge styles
        
        document.getElementById('exp-overview').textContent = interpretationData.overview;
        document.getElementById('exp-implications').textContent = interpretationData.implications;
        document.getElementById('exp-recommendations').textContent = interpretationData.recommendations;
        
        modalExp.style.display = 'flex';
    };

    document.getElementById('btn-close-explanation').onclick = () => {
        document.getElementById('modal-explanation').style.display = 'none';
    };

    // Print / PDF Generation Integration
    const btnPrint = document.getElementById('btn-print-report');
    btnPrint.onclick = () => {
        triggerPrintLayout(reportId, currentDate, prediction, confidence, imageUrl);
    };
}

function getExplanationDetails(prediction) {
    if (prediction.toLowerCase().includes('normal')) {
        return {
            overview: "No cervical ribs detected. The C7 vertebral structure appears normal, showing transverse processes of typical length with no evidence of accessory osseous overgrowth.",
            implications: "Normal anatomical structure poses no inherent clinical risk of neuromuscular or vascular thoracic compression. Symptoms like pain or numbness should be explored for alternative neurological or muscular etiologies.",
            recommendations: "1. Maintain proper ergonomic posture during study/work.\n2. Perform gentle neck-shoulder stretches to relieve standard muscular tension.\n3. Consult a physician if you experience radiating neck/arm discomfort."
        };
    } else if (prediction.toLowerCase().includes('left')) {
        return {
            overview: "A supernumerary (extra) rib is identified originating from the left transverse process of the seventh cervical vertebra (C7).",
            implications: "The accessory bony mass may mechanically compress the brachial plexus nerve trunk or left subclavian vascular elements. This can trigger Thoracic Outlet Syndrome (TOS), causing tingling, numbness, or weakness in the left arm and hand.",
            recommendations: "1. Consult an orthopedic specialist or neurologist for physical testing.\n2. Avoid carrying heavy bags or weight bearing on the left shoulder.\n3. Engage in physical therapy posture correction to relieve pressure."
        };
    } else if (prediction.toLowerCase().includes('right')) {
        return {
            overview: "A supernumerary (extra) rib is identified originating from the right transverse process of the seventh cervical vertebra (C7).",
            implications: "Can cause physical compression of brachial plexus nerves or blood channels on the right side. This could lead to sensory deficits, rapid arm fatigue, localized pain, or localized grip weakness in the right hand.",
            recommendations: "1. Seek orthopedic or neurology evaluation.\n2. Avoid repetitive overhead motions or heavy lifting on the right side.\n3. Perform neck-shoulder stretches under structured physiotherapist guidance."
        };
    } else {
        // Bilateral / Bicrib
        return {
            overview: "Supernumerary (extra) cervical ribs are detected originating bilaterally from both the left and right transverse processes of the C7 vertebra.",
            implications: "Highest clinical risk factor for Bilateral Thoracic Outlet Syndrome (TOS). Multi-lateral compression of both nerve trunks and vascular channels may manifest as numbness, grip weaknesses, and coldness in both upper extremities.",
            recommendations: "1. Urgent orthopedic and vascular consultation is recommended for clinical correlation.\n2. Strict avoidance of overhead workloads, heavy lifting, or poor sleep postures.\n3. Execute ergonomic workstation optimization immediately."
        };
    }
}

// Trigger Print Layout Configuration
function triggerPrintLayout(reportId, dateStr, prediction, confidence, imageUrl) {
    // Populate printable elements
    document.getElementById('print-report-id').textContent = reportId;
    document.getElementById('print-report-date').textContent = dateStr;
    document.getElementById('print-patient-name').textContent = state.activePatient.name;
    document.getElementById('print-patient-case').textContent = state.activePatient.caseId;
    document.getElementById('print-patient-age').textContent = state.activePatient.age + ' Years';
    document.getElementById('print-patient-gender').textContent = state.activePatient.gender;

    const printLabel = document.getElementById('print-diagnosis-label');
    printLabel.textContent = prediction.toUpperCase();
    
    // Style print result box depending on diagnosis
    const printBox = document.querySelector('.print-result-box');
    if (prediction.toLowerCase().includes('normal')) {
        printBox.style.borderColor = '#2E7D32';
        printBox.style.backgroundColor = '#E8F5E9';
        printLabel.style.color = '#2E7D32';
    } else {
        printBox.style.borderColor = '#C62828';
        printBox.style.backgroundColor = '#FFEBEE';
        printLabel.style.color = '#C62828';
    }

    document.getElementById('print-confidence-value').textContent = confidence.toFixed(2) + '%';
    
    const interpretationData = getExplanationDetails(prediction);
    document.getElementById('print-exp-overview').textContent = interpretationData.overview;
    document.getElementById('print-exp-implications').textContent = interpretationData.implications;
    
    // Format recommendations line-by-line
    const formattedRecs = interpretationData.recommendations.split('\n').join('<br>');
    document.getElementById('print-exp-recommendations').innerHTML = formattedRecs;

    document.getElementById('print-doctor-name').textContent = state.currentUser.name;

    // Trigger Print
    window.print();
}

// ==========================================================================
// SCANS HISTORY DATABASE MANAGEMENT
// ==========================================================================
function setupHistoryControls() {
    const searchInput = document.getElementById('history-search-input');
    const refreshBtn = document.getElementById('btn-history-refresh');

    searchInput.addEventListener('input', filterHistoryList);
    
    // Listen to sort pills
    const sortPills = document.querySelectorAll('.sort-pill');
    sortPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            sortPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.currentSortOption = parseInt(pill.getAttribute('data-value'));
            sortAndRenderHistory();
        });
    });
    
    refreshBtn.addEventListener('click', fetchScanHistory);
}

async function fetchScanHistory() {
    const loadingEl = document.getElementById('history-loading');
    const emptyEl = document.getElementById('history-empty');
    const wrapperEl = document.getElementById('history-table-wrapper');

    loadingEl.style.display = 'block';
    emptyEl.style.display = 'none';
    wrapperEl.style.display = 'none';

    try {
        const response = await fetch(BACKEND_URL + 'get_scan_history.php?user_id=' + state.currentUser.user_id);
        const data = await response.json();

        loadingEl.style.display = 'none';

        if (data.status === 'success') {
            state.historyList = data.history || [];
            if (state.historyList.length === 0) {
                emptyEl.style.display = 'block';
            } else {
                wrapperEl.style.display = 'block';
                sortAndRenderHistory();
            }
        } else {
            alert('Failed to load history list: ' + data.message);
        }
    } catch (e) {
        console.error('History API error:', e);
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
        document.querySelector('#history-empty p').textContent = 'Server connection failed. Could not fetch history records.';
    }
}

function sortAndRenderHistory() {
    let sorted = [...state.historyList];
    const option = state.currentSortOption;

    if (option === 0) {
        // Latest First
        sorted.sort((a, b) => b.id - a.id);
    } else if (option === 1) {
        // Oldest First
        sorted.sort((a, b) => a.id - b.id);
    } else if (option === 2) {
        // Name A-Z
        sorted.sort((a, b) => a.patient_name.localeCompare(b.patient_name));
    } else if (option === 3) {
        // Name Z-A
        sorted.sort((a, b) => b.patient_name.localeCompare(a.patient_name));
    } else if (option === 4) {
        // Highest Confidence
        sorted.sort((a, b) => {
            const confA = parseFloat(a.confidence.replace('%', ''));
            const confB = parseFloat(b.confidence.replace('%', ''));
            return confB - confA;
        });
    } else if (option === 5) {
        // Abnormal First
        sorted.sort((a, b) => {
            const isNormA = a.prediction.toLowerCase().includes('normal') ? 1 : 0;
            const isNormB = b.prediction.toLowerCase().includes('normal') ? 1 : 0;
            return isNormA - isNormB; // Normal (1) comes after Abnormal (0)
        });
    }

    renderHistoryTable(sorted);
}

function renderHistoryTable(list) {
    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = '';

    list.forEach(item => {
        const tr = document.createElement('tr');
        
        // Date Formatter
        const dateObj = new Date(item.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        // Badge styling depending on prediction
        let badgeClass = 'badge-pill ';
        const pred = item.prediction.toLowerCase();
        if (pred.includes('normal')) {
            badgeClass += 'badge-normal';
        } else if (pred.includes('left')) {
            badgeClass += 'badge-rib-left';
        } else if (pred.includes('right')) {
            badgeClass += 'badge-rib-right';
        } else {
            badgeClass += 'badge-rib-bicrib';
        }

        tr.innerHTML = `
            <td><strong>#${item.case_id}</strong></td>
            <td><strong>${item.patient_name}</strong></td>
            <td>${item.age} Y / ${item.gender}</td>
            <td><span class="${badgeClass}">${item.prediction}</span></td>
            <td><strong>${item.confidence}</strong></td>
            <td>${formattedDate}</td>
            <td class="text-right">
                <div class="history-item-actions">
                    <button class="btn-history-view" data-id="${item.id}" title="Print Report"><i class="fa-solid fa-print"></i></button>
                    <button class="btn-history-delete" data-id="${item.id}" data-name="${item.patient_name}" title="Delete Report"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </td>
        `;

        // Bind Row Print Actions
        tr.querySelector('.btn-history-view').addEventListener('click', () => {
            state.activePatient = {
                patient_id: item.patient_id,
                name: item.patient_name,
                age: item.age,
                gender: item.gender,
                caseId: item.case_id
            };
            const confidenceNum = parseFloat(item.confidence.replace('%', ''));
            triggerPrintLayout('SRN-' + item.id, item.created_at, item.prediction, confidenceNum, item.image_path);
        });

        // Bind Row Delete Actions
        tr.querySelector('.btn-history-delete').addEventListener('click', (e) => {
            const scanId = e.currentTarget.getAttribute('data-id');
            const patientName = e.currentTarget.getAttribute('data-name');
            if (confirm(`Are you sure you want to delete the diagnostic report for ${patientName}?`)) {
                deleteScanReport(scanId);
            }
        });

        tbody.appendChild(tr);
    });
}

function filterHistoryList() {
    const query = document.getElementById('history-search-input').value.toLowerCase().trim();
    if (!query) {
        sortAndRenderHistory();
        return;
    }

    const filtered = state.historyList.filter(item => {
        return item.patient_name.toLowerCase().includes(query) || 
               item.case_id.toString().includes(query);
    });

    renderHistoryTable(filtered);
}

async function deleteScanReport(scanId) {
    try {
        const formData = new URLSearchParams();
        formData.append('scan_id', scanId);

        const response = await fetch(BACKEND_URL + 'delete_scan.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        const data = await response.json();

        if (data.status === 'success') {
            alert('Scan report deleted successfully.');
            fetchScanHistory(); // Reload list
        } else {
            alert('Failed to delete report: ' + data.message);
        }
    } catch (e) {
        console.error('Delete API Error:', e);
        alert('Server request timed out. Could not delete report.');
    }
}

// Dashboard statistics loader helper
async function loadDashboardStats() {
    try {
        const response = await fetch(BACKEND_URL + 'get_scan_history.php?user_id=' + state.currentUser.user_id);
        const data = await response.json();
        if (data.status === 'success') {
            const history = data.history || [];
            const total = history.length;
            const normals = history.filter(item => item.prediction.toLowerCase().includes('normal')).length;
            const abnormals = total - normals;

            animateCountUp('stat-total-scans', total);
            animateCountUp('stat-normal-scans', normals);
            animateCountUp('stat-detected-scans', abnormals);
        }
    } catch (e) {
        console.error('Stats loading failed:', e);
    }
}

// Micro-animation: Count-up from 0 with cubic easeOut
function animateCountUp(elementId, targetValue, duration = 1200) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (targetValue === 0) {
        el.textContent = '0';
        return;
    }
    
    const startTime = performance.now();
    
    function updateCount(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function: easeOutQuad
        const easedProgress = progress * (2 - progress);
        const currentValue = Math.floor(easedProgress * targetValue);
        
        el.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCount);
        } else {
            el.textContent = targetValue;
        }
    }
    
    requestAnimationFrame(updateCount);
}

// ==========================================================================
// USER PROFILE SETTINGS MANAGEMENT
// ==========================================================================
function populateProfileFields() {
    if (!state.currentUser) return;
    document.getElementById('profile-name').value = state.currentUser.name || '';
    document.getElementById('profile-email').value = state.currentUser.email || '';
    document.getElementById('profile-age').value = state.currentUser.age || '';
    document.getElementById('profile-gender').value = state.currentUser.gender || '';
    document.getElementById('profile-mobile').value = state.currentUser.mobile || '';
    document.getElementById('profile-location').value = state.currentUser.location || '';
    
    const avatarPreview = document.getElementById('profile-editor-avatar-preview');
    if (state.currentUser.profile_image) {
        avatarPreview.src = getNormalizedImageUrl(state.currentUser.profile_image);
    } else {
        avatarPreview.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    }
}

function setupProfileActions() {
    const formProfile = document.getElementById('form-profile-edit');
    const avatarInput = document.getElementById('profile-avatar-input');
    const deleteBtnTrigger = document.getElementById('btn-delete-account-trigger');
    const deleteBtnConfirm = document.getElementById('btn-delete-account-confirm');
    const deleteInput = document.getElementById('delete-account-confirm');

    // 1. Submit Profile Edit Info
    formProfile.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-profile-submit');
        const errorEl = document.getElementById('profile-error');
        const successEl = document.getElementById('profile-success');

        errorEl.style.display = 'none';
        successEl.style.display = 'none';
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        const profileData = {
            user_id: state.currentUser.user_id,
            name: document.getElementById('profile-name').value.trim(),
            age: document.getElementById('profile-age').value.trim(),
            gender: document.getElementById('profile-gender').value,
            mobile: document.getElementById('profile-mobile').value.trim(),
            location: document.getElementById('profile-location').value.trim(),
            profile_image: state.currentUser.profile_image || ''
        };

        try {
            const response = await fetch(BACKEND_URL + 'update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            const data = await response.json();

            if (data.status === 'success') {
                // Update Local State Session
                state.currentUser.name = profileData.name;
                state.currentUser.age = profileData.age;
                state.currentUser.gender = profileData.gender;
                state.currentUser.mobile = profileData.mobile;
                state.currentUser.location = profileData.location;
                
                localStorage.setItem('cerviscan_user', JSON.stringify(state.currentUser));
                updateUserUI();

                successEl.textContent = 'Account profile settings updated successfully!';
                successEl.style.display = 'block';
                setTimeout(() => { successEl.style.display = 'none'; }, 4000);
            } else {
                errorEl.textContent = data.message || 'Profile save failed.';
                errorEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Profile Update Error:', error);
            errorEl.textContent = 'Network communication failure.';
            errorEl.style.display = 'block';
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });

    // 2. Avatar upload
    avatarInput.addEventListener('change', async (e) => {
        if (e.target.files.length === 0) return;
        const file = e.target.files[0];
        const loader = document.getElementById('profile-avatar-loader');
        
        loader.style.display = 'block';

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(BACKEND_URL + 'upload_image.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            loader.style.display = 'none';

            if (data.status === 'success' && data.image_url) {
                // Update Image URL in Database Profile immediately
                state.currentUser.profile_image = data.image_url;
                
                // Save profile updates to persist DB
                await updateProfileImageDB(data.image_url);
            } else {
                alert('Avatar upload failed: ' + (data.message || 'Server image parser error'));
            }
        } catch (err) {
            console.error(err);
            loader.style.display = 'none';
            alert('Avatar image sync failed due to network error.');
        }
    });

    // Subroutine to save avatar URL to user row
    async function updateProfileImageDB(avatarUrl) {
        const profileData = {
            user_id: state.currentUser.user_id,
            name: state.currentUser.name || '',
            age: state.currentUser.age || '',
            gender: state.currentUser.gender || '',
            mobile: state.currentUser.mobile || '',
            location: state.currentUser.location || '',
            profile_image: avatarUrl
        };
        
        try {
            const response = await fetch(BACKEND_URL + 'update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            if (data.status === 'success') {
                localStorage.setItem('cerviscan_user', JSON.stringify(state.currentUser));
                updateUserUI();
                document.getElementById('profile-editor-avatar-preview').src = getNormalizedImageUrl(avatarUrl);
            }
        } catch (e) {
            console.error(e);
        }
    }

    // 3. Delete Account Dialog triggers
    deleteBtnTrigger.addEventListener('click', () => {
        document.getElementById('modal-delete-account').style.display = 'flex';
        deleteInput.value = '';
        deleteBtnConfirm.disabled = true;
    });

    deleteInput.addEventListener('input', (e) => {
        if (e.target.value.trim().toUpperCase() === 'DELETE') {
            deleteBtnConfirm.disabled = false;
        } else {
            deleteBtnConfirm.disabled = true;
        }
    });

    deleteBtnConfirm.addEventListener('click', async () => {
        const errorEl = document.getElementById('delete-account-error');
        errorEl.style.display = 'none';

        try {
            const response = await fetch(BACKEND_URL + 'delete_account.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: state.currentUser.user_id })
            });
            const data = await response.json();

            if (data.status === 'success') {
                document.getElementById('modal-delete-account').style.display = 'none';
                localStorage.removeItem('cerviscan_user');
                state.currentUser = null;
                alert('Your CerviScan account has been permanently deleted.');
                window.location.hash = '#login';
            } else {
                errorEl.textContent = data.message || 'Account delete failed.';
                errorEl.style.display = 'block';
            }
        } catch (err) {
            console.error(err);
            errorEl.textContent = 'Communication failed. Please try again later.';
            errorEl.style.display = 'block';
        }
    });
}

// ==========================================================================
// MOBILE RESPONSIVE SIDEBAR DRAWER CONTROLS
// ==========================================================================
function toggleMobileSidebar(isOpen) {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;

    if (isOpen) {
        sidebar.classList.add('show-sidebar');
        overlay.classList.add('active');
    } else {
        sidebar.classList.remove('show-sidebar');
        overlay.classList.remove('active');
    }
}

// Auto-close sidebar on menu clicks for smooth mobile navigation
document.addEventListener('DOMContentLoaded', () => {
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            if (e.target.closest('.menu-item')) {
                toggleMobileSidebar(false);
            }
        });
    }
});
