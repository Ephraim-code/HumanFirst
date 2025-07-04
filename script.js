// JavaScript file

// Global variables
let currentUser = null;
let chatActive = false;

// Call-related global variables
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentCall = null;
let callTimer = null;
let callStartTime = null;
let isMuted = false;
let isCallActive = false;
let callUnsubscribe = null; // To store the Firestore listener unsubscribe function

// WebRTC configuration
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Mock data for demonstration
const mockUsers = {
    'patient@test.com': {
        type: 'patient',
        name: 'John Doe',
        email: 'patient@test.com',
        password: 'password123',
        phone: '+1 234 567 8900',
        condition: 'diabetes',
        age: 35,
        emergencyContact: 'Jane Doe (+1 234 567 8901)'
    },
    'counsellor@test.com': {
        type: 'counsellor',
        name: 'Dr. Sarah Johnson',
        email: 'counsellor@test.com',
        password: 'password123',
        phone: '+1 234 567 8900',
        specialization: 'diabetes',
        license: 'LC123456',
        experience: '8 years',
        qualifications: 'Ph.D. in Clinical Psychology, Certified Diabetes Educator'
    }
};

// Utility functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        alertDiv.style.background = '#10b981';
    } else if (type === 'error') {
        alertDiv.style.background = '#ef4444';
    } else {
        alertDiv.style.background = '#3b82f6';
    }
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Form validation
function validateForm(formData) {
    for (let [key, value] of formData.entries()) {
        if (!value) {
            showAlert(`Please fill in ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
            return false;
        }
    }
    return true;
}

// Login functionality
function login() {
    const userType = document.getElementById('userType').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!userType || !email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Check if user exists in mock data
    if (mockUsers[email] && mockUsers[email].password === password && mockUsers[email].type === userType) {
        currentUser = mockUsers[email];
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showAlert('Login successful!', 'success');
        
        // Redirect to appropriate dashboard
        setTimeout(() => {
            if (userType === 'patient') {
                window.location.href = 'patient-dashboard.html';
            } else {
                window.location.href = 'counsellor-dashboard.html';
            }
        }, 1000);
    } else {
        showAlert('Invalid credentials. Please try again.', 'error');
    }
}

// Signup functionality
function signup() {
    const userType = document.getElementById('userType').value;
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('phone').value;

    if (!userType || !fullName || !email || !password || !confirmPassword || !phone) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }

    // Check if user already exists
    if (mockUsers[email]) {
        showAlert('User with this email already exists', 'error');
        return;
    }

    // Create new user object
    const newUser = {
        type: userType,
        name: fullName,
        email: email,
        password: password,
        phone: phone
    };

    // Add user-specific fields
    if (userType === 'patient') {
        const disease = document.getElementById('disease').value;
        const age = document.getElementById('age').value;
        const emergencyContact = document.getElementById('emergencyContact').value;
        
        if (!disease || !age || !emergencyContact) {
            showAlert('Please fill in all patient-specific fields', 'error');
            return;
        }
        
        newUser.condition = disease;
        newUser.age = age;
        newUser.emergencyContact = emergencyContact;
    } else {
        const specialization = document.getElementById('specialization').value;
        const license = document.getElementById('license').value;
        const experience = document.getElementById('experience').value;
        const qualifications = document.getElementById('qualifications').value;
        
        if (!specialization || !license || !experience || !qualifications) {
            showAlert('Please fill in all counsellor-specific fields', 'error');
            return;
        }
        
        newUser.specialization = specialization;
        newUser.license = license;
        newUser.experience = experience;
        newUser.qualifications = qualifications;
    }

    // Add to mock users (in real app, this would go to database)
    mockUsers[email] = newUser;
    
    showAlert('Account created successfully!', 'success');
    
    // Redirect to login
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

// Toggle form fields based on user type
function toggleFields() {
    const userType = document.getElementById('userType').value;
    const patientFields = document.getElementById('patientFields');
    const counsellorFields = document.getElementById('counsellorFields');
    
    if (patientFields && counsellorFields) {
        if (userType === 'patient') {
            patientFields.style.display = 'block';
            counsellorFields.style.display = 'none';
        } else if (userType === 'counsellor') {
            patientFields.style.display = 'none';
            counsellorFields.style.display = 'block';
        } else {
            patientFields.style.display = 'none';
            counsellorFields.style.display = 'none';
        }
    }
}

// Dashboard section navigation
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    // Update active menu item
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Show/hide WhatsApp-Style Recent Calls section
    const waCallHistoryContainer = document.getElementById('waCallHistoryContainer');
    if (waCallHistoryContainer) {
        if (sectionName === 'calls') {
            waCallHistoryContainer.style.display = 'block';
        } else {
            waCallHistoryContainer.style.display = 'none';
        }
    }
}

// Virtual Assistant Functions
function startChat() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        chatContainer.style.display = 'block';
        chatActive = true;
        showAlert('Chat started! You can now interact with the virtual assistant.', 'success');
    }
}

// Flowise Query Function
async function query(data) {
    const systemPrompt = `
Your name is HumanFirst, You are a medical virtual assistant, you are to provide remote counselling to chronic disease patients. You should also attend to patients by responding to health-related questions, suggesting lifestyle recommendations. Respond with care.

You are to be focused on these diseases specifically:
1. Cardiovascular Diseases: Heart attacks, strokes, heart failure, and hypertension.
2. Diabetes: Type 1, Type 2, and gestational diabetes.
3. Cancer: Liver cancer, leukaemia.
4. Mental Health Disorders: PTSD, OCD, Eating Disorders, Depression.
5. Liver Disease: Hepatitis, Acute Liver Failure.
6. Chronic Respiratory Disease: Asthma, pulmonary hypertension, chronic obstructive disease (COPD).

Any disease out of these, tell the user that he/she has exceeded your scope.
`;
    // Always include the system prompt in the API call
    if (!data.overrideConfig) {
        data.overrideConfig = {};
    }
    data.overrideConfig.systemMessage = systemPrompt;
    const response = await fetch(
        "http://localhost:3000/api/v1/prediction/faf99fc4-f371-487a-8a9b-dbef6bb43cca",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.style.cssText = `
        background: #dbeafe;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 10px;
        text-align: right;
    `;
    userMessageDiv.innerHTML = `<strong>You:</strong> ${message}`;
    chatMessages.appendChild(userMessageDiv);
    
    // Clear input
    chatInput.value = '';
    
    // Show loading indicator for assistant response
    const assistantDiv = document.createElement('div');
    assistantDiv.style.cssText = `
        background: #f3f4f6;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 10px;
    `;
    assistantDiv.innerHTML = `<strong>Assistant:</strong> <span id="assistantLoading">...</span>`;
    chatMessages.appendChild(assistantDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Fetch assistant response from Flowise
    query({"question": message}).then((response) => {
        let assistantResponse = response.answer || "Sorry, I couldn't process your request.";
        assistantDiv.innerHTML = `<strong>Assistant:</strong> ${assistantResponse}`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }).catch(() => {
        assistantDiv.innerHTML = `<strong>Assistant:</strong> Sorry, there was an error connecting to the assistant.`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// Initialize dashboard
function initializeDashboard() {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
        currentUser = JSON.parse(currentUserStr);
        
        // Update user name in dashboard
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `Welcome, ${currentUser.name}`;
        }
        
        // Update profile information
        updateProfileInfo();
        
        // Initialize call system if calls section exists
        if (document.getElementById('calls')) {
            initializeCallSystem();
        }
    } else {
        // Redirect to login if no user is logged in
        if (!window.location.href.includes('login.html') && !window.location.href.includes('signup.html') && !window.location.href.includes('index.html')) {
            window.location.href = 'login.html';
        }
    }
}

function updateProfileInfo() {
    if (!currentUser) return;
    
    // Update profile fields based on user type
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    
    if (profileName) profileName.textContent = currentUser.name;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profilePhone) profilePhone.textContent = currentUser.phone;
    
    if (currentUser.userType === 'patient') {
        const profileCondition = document.getElementById('profileCondition');
        const profileAge = document.getElementById('profileAge');
        const profileEmergency = document.getElementById('profileEmergency');
        
        if (profileCondition) profileCondition.textContent = currentUser.condition || 'Not specified';
        if (profileAge) profileAge.textContent = currentUser.age || 'Not specified';
        if (profileEmergency) profileEmergency.textContent = currentUser.emergencyContact || 'Not specified';
    } else {
        const profileSpecialization = document.getElementById('profileSpecialization');
        const profileLicense = document.getElementById('profileLicense');
        const profileExperience = document.getElementById('profileExperience');
        const profileQualifications = document.getElementById('profileQualifications');
        
        if (profileSpecialization) profileSpecialization.textContent = currentUser.specialization || 'Not specified';
        if (profileLicense) profileLicense.textContent = currentUser.license || 'Not specified';
        if (profileExperience) profileExperience.textContent = currentUser.experience || 'Not specified';
        if (profileQualifications) profileQualifications.textContent = currentUser.qualifications || 'Not specified';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'index.html';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard if on dashboard page
    if (window.location.href.includes('dashboard')) {
        initializeDashboard();
    }
    
    // Add enter key support for chat
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Add enter key support for forms
    const forms = document.querySelectorAll('input, select, textarea');
    forms.forEach(form => {
        form.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const submitButton = form.closest('form')?.querySelector('button[type="submit"]') || 
                                   form.closest('.auth-form')?.querySelector('button');
                if (submitButton) {
                    submitButton.click();
                }
            }
        });
    });

    const activeCallModal = document.getElementById('activeCallModal');
    const closeActiveCallModal = document.getElementById('closeActiveCallModal');
    if (closeActiveCallModal && activeCallModal) {
        closeActiveCallModal.onclick = function() {
            activeCallModal.style.display = 'none';
            // Optionally, end the call here if you want
            // endCall();
        };
    }

    // Edit Profile Modal logic
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditProfileModal = document.getElementById('closeEditProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileBtn && editProfileModal && closeEditProfileModal && editProfileForm) {
        editProfileBtn.onclick = function() {
            // Prefill form with current user data
            const nameInput = document.getElementById('editProfileName');
            if (nameInput) nameInput.value = currentUser.name || '';
            const emailInput = document.getElementById('editProfileEmail');
            if (emailInput) emailInput.value = currentUser.email || '';
            const phoneInput = document.getElementById('editProfilePhone');
            if (phoneInput) phoneInput.value = currentUser.phone || '';
            if (currentUser.userType === 'patient') {
                const conditionInput = document.getElementById('editProfileCondition');
                if (conditionInput) conditionInput.value = currentUser.condition || '';
                const ageInput = document.getElementById('editProfileAge');
                if (ageInput) ageInput.value = currentUser.age || '';
                const emergencyInput = document.getElementById('editProfileEmergency');
                if (emergencyInput) emergencyInput.value = currentUser.emergencyContact || '';
            } else {
                const specializationInput = document.getElementById('editProfileSpecialization');
                if (specializationInput) specializationInput.value = currentUser.specialization || '';
                const licenseInput = document.getElementById('editProfileLicense');
                if (licenseInput) licenseInput.value = currentUser.license || '';
                const experienceInput = document.getElementById('editProfileExperience');
                if (experienceInput) experienceInput.value = currentUser.experience || '';
                const qualificationsInput = document.getElementById('editProfileQualifications');
                if (qualificationsInput) qualificationsInput.value = currentUser.qualifications || '';
            }
            editProfileModal.style.display = 'block';
        };
        closeEditProfileModal.onclick = function() {
            editProfileModal.style.display = 'none';
        };
        window.onclick = function(event) {
            if (event.target === editProfileModal) {
                editProfileModal.style.display = 'none';
            }
        };
        editProfileForm.onsubmit = function(e) {
            e.preventDefault();
            // Collect updated data
            const updatedData = {
                name: document.getElementById('editProfileName') ? document.getElementById('editProfileName').value.trim() : '',
                email: document.getElementById('editProfileEmail') ? document.getElementById('editProfileEmail').value.trim() : '',
                phone: document.getElementById('editProfilePhone') ? document.getElementById('editProfilePhone').value.trim() : ''
            };
            if (currentUser.userType === 'patient') {
                updatedData.condition = document.getElementById('editProfileCondition') ? document.getElementById('editProfileCondition').value.trim() : '';
                updatedData.age = document.getElementById('editProfileAge') ? document.getElementById('editProfileAge').value.trim() : '';
                updatedData.emergencyContact = document.getElementById('editProfileEmergency') ? document.getElementById('editProfileEmergency').value.trim() : '';
            } else {
                updatedData.specialization = document.getElementById('editProfileSpecialization') ? document.getElementById('editProfileSpecialization').value.trim() : '';
                updatedData.license = document.getElementById('editProfileLicense') ? document.getElementById('editProfileLicense').value.trim() : '';
                updatedData.experience = document.getElementById('editProfileExperience') ? document.getElementById('editProfileExperience').value.trim() : '';
                updatedData.qualifications = document.getElementById('editProfileQualifications') ? document.getElementById('editProfileQualifications').value.trim() : '';
            }
            // Update Firestore
            db.collection('users').doc(currentUser.uid).update(updatedData)
                .then(() => {
                    // Update localStorage and UI
                    Object.assign(currentUser, updatedData);
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateProfileInfo();
                    showAlert('Profile updated successfully!', 'success');
                    editProfileModal.style.display = 'none';
                })
                .catch((error) => {
                    showAlert('Error updating profile: ' + error.message, 'error');
                });
        };
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add CSS animation for alerts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ==================== CALL FUNCTIONALITY ====================

// Initialize call functionality
function initializeCallSystem() {
    if (currentUser && currentUser.userType === 'counsellor') {
        loadPatientsForCalls();
    } else {
        loadCounsellorsForCalls();
    }
    loadCallHistory();
    setupCallListeners();
}

// Load counsellors for call selection (patient dashboard)
function loadCounsellorsForCalls() {
    const counsellorSelect = document.getElementById('counsellorSelect');
    if (!counsellorSelect) return;

    // Clear existing options
    counsellorSelect.innerHTML = '<option value="">Choose a counsellor...</option>';

    // Load counsellors from Firebase
    db.collection('users')
        .where('userType', '==', 'counsellor')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const counsellor = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = counsellor.name || counsellor.fullName || 'Counsellor';
                counsellorSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading counsellors:', error);
            showAlert('Failed to load counsellors', 'error');
        });
}

// Load patients for call selection (counsellor dashboard)
function loadPatientsForCalls() {
    const patientSelect = document.getElementById('patientSelect');
    if (!patientSelect) return;

    patientSelect.innerHTML = '<option value="">Choose a patient...</option>';

    db.collection('users')
        .where('userType', '==', 'patient')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const patient = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = patient.name || patient.fullName || 'Patient';
                patientSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading patients:', error);
            showAlert('Failed to load patients', 'error');
        });
}

// Setup call event listeners
function setupCallListeners() {
    // Listen for incoming calls for both patients and counsellors
    if (currentUser && currentUser.uid) {
        db.collection('calls')
            .where('receiverId', '==', currentUser.uid)
            .where('status', '==', 'incoming')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        handleIncomingCall(change.doc.data(), change.doc.id);
                    }
                });
            });
    }
}

// Handle incoming call
function handleIncomingCall(callData, callId) {
    const incomingCallDiv = document.getElementById('incomingCall');
    const incomingCallerDiv = document.getElementById('incomingCaller');
    
    if (incomingCallDiv && incomingCallerDiv) {
        incomingCallerDiv.textContent = callData.callerName || 'Unknown';
        incomingCallDiv.style.display = 'flex';
        
        // Store call data
        currentCall = { ...callData, id: callId };
        
        // Auto-hide after 30 seconds if not answered
        setTimeout(() => {
            if (incomingCallDiv.style.display === 'flex') {
                rejectCall();
            }
        }, 30000);
    }
}

// Start call (patient initiates)
async function startCall(isCounsellor = false) {
    let partnerId, partnerName;
    if (isCounsellor) {
        const patientSelect = document.getElementById('patientSelect');
        if (!patientSelect || !patientSelect.value) {
            showAlert('Please select a patient to call', 'error');
            return;
        }
        partnerId = patientSelect.value;
        partnerName = patientSelect.options[patientSelect.selectedIndex].text;
    } else {
        const counsellorSelect = document.getElementById('counsellorSelect');
        if (!counsellorSelect || !counsellorSelect.value) {
            showAlert('Please select a counsellor to call', 'error');
            return;
        }
        partnerId = counsellorSelect.value;
        partnerName = counsellorSelect.options[counsellorSelect.selectedIndex].text;
    }

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const callData = {
            callerId: currentUser.uid,
            callerName: currentUser.name || currentUser.fullName,
            receiverId: partnerId,
            receiverName: partnerName,
            status: 'incoming',
            type: 'voice',
            timestamp: new Date(),
            duration: 0
        };

        const callRef = await db.collection('calls').add(callData);
        currentCall = { ...callData, id: callRef.id };

        showAlert('Calling...', 'info');

        document.getElementById('callSetup').style.display = 'none';
        document.getElementById('activeCallModal').style.display = 'block';
        document.getElementById('callStatus').textContent = 'Calling...';
        document.getElementById('callPartner').textContent = partnerName;

        listenToCallDocument(callRef.id);

    } catch (error) {
        console.error('Error starting call:', error);
        showAlert('Failed to start call. Please check your microphone permissions.', 'error');
    }
}

// Accept call (counsellor accepts)
async function acceptCall() {
    if (!currentCall) return;

    try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Update call status and set startedAt
        await db.collection('calls').doc(currentCall.id).update({
            status: 'active',
            answeredAt: new Date(),
            startedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Hide incoming call alert
        document.getElementById('incomingCall').style.display = 'none';
        
        // Show active call interface
        document.getElementById('activeCallModal').style.display = 'block';
        document.getElementById('callStatus').textContent = 'Connected';
        document.getElementById('callPartner').textContent = currentCall.callerName;

        // Initialize WebRTC
        initializeWebRTC();

        // Add:
        listenToCallDocument(currentCall.id);

    } catch (error) {
        console.error('Error accepting call:', error);
        showAlert('Failed to accept call. Please check your microphone permissions.', 'error');
        rejectCall();
    }
}

// Reject call
async function rejectCall() {
    if (!currentCall) return;

    try {
        await db.collection('calls').doc(currentCall.id).update({
            status: 'rejected',
            endedAt: new Date()
        });

        // Hide incoming call alert
        document.getElementById('incomingCall').style.display = 'none';
        
        // Reset call state
        resetCallState();
        
        showAlert('Call rejected', 'info');

    } catch (error) {
        console.error('Error rejecting call:', error);
    }
}

// End call
async function endCall() {
    if (!currentCall) return;

    // Prevent duplicate ending
    const callDoc = await db.collection('calls').doc(currentCall.id).get();
    if (!callDoc.exists) return;
    const callData = callDoc.data();
    if (callData.status === 'ended' || callData.status === 'rejected') {
        // Already ended, just clean up UI
        stopCallTimer();
        resetCallState();
        return;
    }

    try {
        const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;

        await db.collection('calls').doc(currentCall.id).update({
            status: 'ended',
            endedAt: new Date(),
            duration: duration,
            endedBy: currentUser.uid // Track who ended the call
        });

        // UI will be updated by the real-time listener (Step 1)
    } catch (error) {
        console.error('Error ending call:', error);
    }
}

// Initialize WebRTC connection
function initializeWebRTC() {
    peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Add local stream
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        // In a real implementation, you would play the remote audio
        console.log('Remote stream received');
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
            document.getElementById('callStatus').textContent = 'Connected';
        } else if (peerConnection.connectionState === 'disconnected') {
            endCall();
        }
    };
}

// Close WebRTC connection
function closeWebRTC() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    remoteStream = null;
}

// Toggle mute
function toggleMute() {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isMuted = !audioTrack.enabled;
        
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            if (isMuted) {
                muteBtn.classList.add('muted');
                muteBtn.querySelector('.control-text').textContent = 'Unmute';
            } else {
                muteBtn.classList.remove('muted');
                muteBtn.querySelector('.control-text').textContent = 'Mute';
            }
        }
    }
}

// Start call timer
function startCallTimer() {
    callStartTime = Date.now();
    callTimer = setInterval(updateCallTimer, 1000);
}

// Stop call timer
function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
    callStartTime = null;
}

// Update call timer display
function updateCallTimer() {
    if (!callStartTime) return;
    // callStartTime is now a timestamp (ms since epoch)
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timerDisplay = document.getElementById('callTimer');
    if (timerDisplay) {
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Reset call state
function resetCallState() {
    currentCall = null;
    isCallActive = false;
    
    // Reset UI
    const callSetup = document.getElementById('callSetup');
    const activeCallModal = document.getElementById('activeCallModal');
    
    if (callSetup) callSetup.style.display = 'block';
    if (activeCallModal) activeCallModal.style.display = 'none';
    
    // Reset mute button
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.classList.remove('muted');
        muteBtn.querySelector('.control-text').textContent = 'Mute';
    }

    // Add:
    if (callUnsubscribe) {
        callUnsubscribe();
        callUnsubscribe = null;
    }
}

// Load call history
function loadCallHistory() {
    const callsList = document.getElementById('callsList');
    if (!callsList || !currentUser) return;

    callsList.innerHTML = '';

    // Collect all calls (outgoing and incoming)
    const calls = [];

    // Helper to render all calls after both queries
    function renderAllCalls() {
        // Sort by timestamp descending
        calls.sort((a, b) => {
            const ta = a.data.timestamp ? (a.data.timestamp.toDate ? a.data.timestamp.toDate() : new Date(a.data.timestamp)) : new Date(0);
            const tb = b.data.timestamp ? (b.data.timestamp.toDate ? b.data.timestamp.toDate() : new Date(b.data.timestamp)) : new Date(0);
            return tb - ta;
        });
        callsList.innerHTML = '';
        calls.forEach(call => {
            renderCallHistoryItem(call.data, call.direction, callsList);
        });
    }

    let loaded = 0;
    // Outgoing calls
    db.collection('calls')
        .where('callerId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                calls.push({ data: doc.data(), direction: 'outgoing' });
            });
            loaded++;
            if (loaded === 2) renderAllCalls();
        })
        .catch(error => {
            console.error('Error loading outgoing calls:', error);
            loaded++;
            if (loaded === 2) renderAllCalls();
        });

    // Incoming calls
    db.collection('calls')
        .where('receiverId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                calls.push({ data: doc.data(), direction: 'incoming' });
            });
            loaded++;
            if (loaded === 2) renderAllCalls();
        })
        .catch(error => {
            console.error('Error loading incoming calls:', error);
            loaded++;
            if (loaded === 2) renderAllCalls();
        });
}

// Render call history item
function renderCallHistoryItem(callData, direction, container) {
    const callItem = document.createElement('div');
    callItem.className = 'call-item';
    
    const isOutgoing = direction === 'outgoing';
    const partnerName = isOutgoing ? callData.receiverName : callData.callerName;
    const callTime = callData.timestamp ? callData.timestamp.toDate ? callData.timestamp.toDate() : new Date(callData.timestamp) : new Date();
    const duration = callData.duration || 0;
    
    let iconClass = 'outgoing';
    let iconText = '📞';
    let statusText = '';
    let statusClass = '';

    // Determine call status and icon
    if (callData.status === 'rejected') {
        iconClass = 'missed';
        iconText = '❌';
        statusText = 'Rejected';
        statusClass = 'call-status-rejected';
    } else if (callData.status === 'ended') {
        if (duration > 0) {
            iconClass = isOutgoing ? 'outgoing' : 'incoming';
            iconText = '📞';
            statusText = 'Completed';
            statusClass = 'call-status-completed';
        } else {
            iconClass = 'missed';
            iconText = '❌';
            statusText = 'Missed';
            statusClass = 'call-status-missed';
        }
    } else if (callData.status === 'active') {
        iconClass = 'outgoing';
        iconText = '📞';
        statusText = 'Ongoing';
        statusClass = 'call-status-ongoing';
    } else if (callData.status === 'incoming') {
        iconClass = isOutgoing ? 'outgoing' : 'incoming';
        iconText = '📞';
        statusText = 'Ringing';
        statusClass = 'call-status-ringing';
    }

    callItem.innerHTML = `
        <div class="call-item-icon ${iconClass}">${iconText}</div>
        <div class="call-item-info">
            <div class="call-item-name">${partnerName || 'Unknown'}</div>
            <div class="call-item-details">
                <span class="call-item-time">${callTime.toLocaleDateString()} ${callTime.toLocaleTimeString()}</span>
                ${duration > 0 ? `<span class="call-item-duration">${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}</span>` : ''}
                <span class="call-item-status ${statusClass}">${statusText}</span>
            </div>
        </div>
        <div class="call-item-actions">
            <button class="call-item-btn btn btn-primary" onclick="callBack('${isOutgoing ? callData.receiverId : callData.callerId}')">
                Call Back
            </button>
        </div>
    `;
    
    container.appendChild(callItem);
}

// Call back function
function callBack(userId) {
    if (currentUser.userType === 'patient') {
        // Set the counsellor dropdown and start the call
        const counsellorSelect = document.getElementById('counsellorSelect');
        if (counsellorSelect) {
            counsellorSelect.value = userId;
            startCall();
        }
    } else if (currentUser.userType === 'counsellor') {
        // Set the patient dropdown and start the call
        const patientSelect = document.getElementById('patientSelect');
        if (patientSelect) {
            patientSelect.value = userId;
            startCall(true);
        }
    }
}

// Initialize call system when dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('calls')) {
        initializeCallSystem();
    }
});

function listenToCallDocument(callId) {
    if (callUnsubscribe) {
        callUnsubscribe();
        callUnsubscribe = null;
    }
    callUnsubscribe = db.collection('calls').doc(callId).onSnapshot(doc => {
        if (!doc.exists) return;
        const callData = doc.data();

        // Always hide call setup when a call is incoming or active
        const callSetup = document.getElementById('callSetup');
        if (callSetup && (callData.status === 'active' || callData.status === 'incoming')) {
            callSetup.style.display = 'none';
        }

        if (callData.status === 'active') {
            document.getElementById('callStatus').textContent = 'Connected';
            if (callData.startedAt) {
                const startedAt = callData.startedAt.toDate ? callData.startedAt.toDate() : new Date(callData.startedAt);
                callStartTime = startedAt.getTime();
                if (!callTimer) {
                    callTimer = setInterval(updateCallTimer, 1000);
                }
            } else {
                stopCallTimer();
                callStartTime = null;
            }
        } else if (callData.status === 'ended' || callData.status === 'rejected') {
            stopCallTimer();
            closeWebRTC(); // Ensure microphone is released
            resetCallState();
            if (callData.endedBy && callData.endedBy !== currentUser.uid) {
                showAlert('The other user ended the call.', 'info');
            } else {
                showAlert('Call ended', 'info');
            }
        } else if (callData.status === 'incoming') {
            document.getElementById('callStatus').textContent = 'Calling...';
        }
    });
}

function showActiveCallModal() {
    const activeCallModal = document.getElementById('activeCallModal');
    if (activeCallModal) {
        activeCallModal.style.display = 'block';
    }
}

function hideActiveCallModal() {
    const activeCallModal = document.getElementById('activeCallModal');
    if (activeCallModal) {
        activeCallModal.style.display = 'none';
    }
}