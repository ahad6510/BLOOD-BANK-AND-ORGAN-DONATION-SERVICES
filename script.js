// 1. Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where,
    updateDoc,
    deleteDoc, // <--- NEW IMPORT for Deleting
    doc,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnyxzbytIz11IgaPHmNgdHNRrH0fOsXFI",
  authDomain: "ahad-khan-a85aa.firebaseapp.com",
  projectId: "ahad-khan-a85aa",
  storageBucket: "ahad-khan-a85aa.firebasestorage.app",
  messagingSenderId: "561806521786",
  appId: "1:561806521786:web:e0b3b667be2059760a5983",
  measurementId: "G-GFDF5MYY5R"
};

// 2. Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const donorsCol = collection(db, "donors");
const requestsCol = collection(db, "requests");

document.addEventListener('DOMContentLoaded', () => {
    console.log("Website Loaded...");

    let allDonors = [];
    let myRequests = {}; 

    // --- Selectors (with safety checks) ---
    const getEl = (id) => document.getElementById(id);

    const loginForm = getEl('login-form');
    const signupForm = getEl('signup-form');
    
    // Navigation Items
    const navLogin = getEl('nav-login');
    const navSignup = getEl('nav-signup');
    const navRegister = getEl('nav-register'); 
    const navLogout = getEl('nav-logout');
    
    // Notifications Items
    const navNotifications = getEl('nav-notifications');
    const mobileNavNotifications = getEl('mobile-nav-notifications'); 
    const notificationBadge = getEl('notification-badge');
    const notificationList = getEl('notification-list');
    const noNotifications = getEl('no-notifications');

    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenu = getEl('mobile-menu');
    const mobileMenuButton = getEl('mobile-menu-button');
    
    // Forms & Lists
    const registrationForm = getEl('registration-form');
    const donorList = getEl('donor-list');
    const loader = getEl('loader');
    const noResults = getEl('no-results');
    
    // Search Filters
    const searchCity = getEl('search-city');
    const searchDonationType = getEl('search-donation-type');
    const searchBloodType = getEl('search-blood-type');
    const searchOrgan = getEl('search-organ');
    const bloodTypeFilterContainer = getEl('blood-type-filter-container');
    const organFilterContainer = getEl('organ-filter-container');
    const donateBloodCheckbox = getEl('donate-blood');
    const donateOrganCheckbox = getEl('donate-organ');
    const organDetails = getEl('organ-donation-details');

    // --- Navigation Logic ---
    const showSection = (hash) => {
        const id = hash ? hash.substring(1) : 'home';
        
        // Protected Routes Check
        if ((id === 'register' || id === 'find' || id === 'notifications') && !auth.currentUser) {
            showToast('Please login to access this section.', true);
            window.location.hash = '#login';
            return;
        }

        sections.forEach(section => {
            section.classList.toggle('active', section.id === id);
        });
        
        if (id === 'find') fetchDonors();
        if (id === 'notifications') fetchNotifications();
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const hash = link.getAttribute('href');
            if(hash.startsWith('#')) {
                e.preventDefault();
                window.location.hash = hash;
                if(mobileMenu) mobileMenu.classList.add('hidden');
            }
        });
    });

    window.addEventListener('hashchange', () => showSection(window.location.hash));
    showSection(window.location.hash || '#home');

    if(mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Auth State Monitor ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if(navLogin) navLogin.classList.add('hidden');
            if(navSignup) navSignup.classList.add('hidden');
            if(navRegister) navRegister.classList.remove('hidden');
            if(navLogout) navLogout.classList.remove('hidden');
            
            if(navNotifications) {
                navNotifications.style.display = 'block'; 
                navNotifications.classList.remove('hidden');
            }
            if(mobileNavNotifications) mobileNavNotifications.classList.remove('hidden');

            fetchNotifications();

            if (window.location.hash === '#login') {
                window.location.hash = '#find';
            }
        } else {
            if(navLogin) navLogin.classList.remove('hidden');
            if(navSignup) navSignup.classList.remove('hidden');
            if(navRegister) navRegister.classList.add('hidden');
            if(navLogout) navLogout.classList.add('hidden');
            
            if(navNotifications) {
                navNotifications.style.display = 'none'; 
                navNotifications.classList.add('hidden');
            }
            if(mobileNavNotifications) mobileNavNotifications.classList.add('hidden');

            const hash = window.location.hash;
            if (hash === '#register' || hash === '#find' || hash === '#notifications') {
                 window.location.hash = '#login';
            }
        }
    });

    // --- Registration Logic ---
    if(donateOrganCheckbox) {
        donateOrganCheckbox.addEventListener('change', () => {
            organDetails.classList.toggle('hidden', !donateOrganCheckbox.checked);
        });
    }

    if(registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isBloodDonor = donateBloodCheckbox.checked;
            const isOrganDonor = donateOrganCheckbox.checked;
            const bloodType = getEl('blood-type').value; 

            // 1. Validation: Must select at least one type
            if (!isBloodDonor && !isOrganDonor) {
                showToast('Please select at least one donation type (Blood or Organ).', true);
                return;
            }

            // 2. Validation: Blood Type is MANDATORY
            if (bloodType === "") {
                showToast('Blood Type is required for all donors.', true);
                return;
            }

            const pledgedOrgans = isOrganDonor ? 
                [...document.querySelectorAll('input[name="organ"]:checked')].map(cb => cb.value) : [];

            // 3. Validation: Organ Check
            if (isOrganDonor && pledgedOrgans.length === 0) {
                showToast('Please select which organs you wish to donate.', true);
                return;
            }

            const donorData = {
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                fullName: getEl('fullName').value,
                age: parseInt(getEl('age').value),
                gender: getEl('gender').value,
                phone: getEl('phone').value,
                city: getEl('city').value,
                state: getEl('state').value,
                isBloodDonor,
                bloodType: bloodType,
                isOrganDonor,
                organs: pledgedOrgans,
                createdAt: new Date()
            };

            try {
                await addDoc(donorsCol, donorData);
                showToast('Registration successful!');
                registrationForm.reset();
                window.location.hash = '#find';
            } catch (error) {
                console.error(error);
                showToast(`Error: ${error.message}`, true);
            }
        });
    }

    // --- Fetch Donors ---
    async function fetchDonors() {
        if(!loader || !donorList) return;
        loader.style.display = 'block';
        if(noResults) noResults.classList.add('hidden');
        donorList.innerHTML = '';
        
        try {
            const q = query(donorsCol, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            allDonors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (auth.currentUser) {
                const reqQuery = query(requestsCol, where("requesterId", "==", auth.currentUser.uid));
                const reqSnapshot = await getDocs(reqQuery);
                myRequests = {};
                reqSnapshot.forEach(doc => {
                    const data = doc.data();
                    myRequests[data.donorDocId] = data.status;
                });
            }

            filterDonors();
        } catch (error) {
            console.error(error);
            showToast('Error loading data.', true);
        } finally {
            loader.style.display = 'none';
        }
    }

    function renderDonors(donorsToRender) {
        donorList.innerHTML = '';
        if (donorsToRender.length === 0) {
            if(noResults) noResults.classList.remove('hidden');
            return;
        }
        if(noResults) noResults.classList.add('hidden');

        donorsToRender.forEach(donor => {
            const organs = (donor.isOrganDonor && Array.isArray(donor.organs)) ? donor.organs : [];
            const requestStatus = myRequests[donor.id]; 
            const isMyOwnPost = auth.currentUser && auth.currentUser.uid === donor.userId;
            
            let actionButton = '';
            let phoneNumberDisplay = '<span class="text-gray-400 italic">Hidden for Privacy</span>';

            if (isMyOwnPost) {
                // CASE 1: MY OWN POST
                phoneNumberDisplay = `<a href="tel:${donor.phone}" class="text-blue-600 hover:underline">${donor.phone}</a>`;
                
                // NEW: Added Delete Button
                actionButton = `
                    <div class="flex items-center space-x-2 w-full">
                        <span class="text-xs bg-gray-200 px-2 py-2 rounded text-center flex-grow">Your Post</span>
                        <button onclick="window.deleteDonor('${donor.id}')" class="text-xs bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200 border border-red-200 font-bold">
                            Delete
                        </button>
                    </div>`;
            } else if (requestStatus === 'approved') {
                // CASE 2: APPROVED
                phoneNumberDisplay = `<a href="tel:${donor.phone}" class="text-blue-600 font-bold hover:underline">${donor.phone}</a>`;
                actionButton = `<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Approved</span>`;
            } else if (requestStatus === 'pending') {
                // CASE 3: PENDING
                actionButton = `<button disabled class="w-full bg-yellow-400 text-white py-2 rounded font-semibold cursor-not-allowed">Request Pending...</button>`;
            } else {
                // CASE 4: REQUEST
                actionButton = `<button onclick="window.initiateRequest('${donor.id}', '${donor.userId}', '${donor.fullName}', '${donor.phone}')" class="w-full bg-red-500 text-white py-2 rounded font-semibold hover:bg-red-600 transition">Request Contact</button>`;
            }

            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 flex flex-col justify-between';
            card.innerHTML = `
                <div>
                    <h3 class="text-xl font-bold mb-2">${donor.fullName}</h3>
                    <p class="text-gray-600 mb-4">${donor.city}, ${donor.state}</p>
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center">
                            <span class="text-red-500 font-semibold mr-2">Phone:</span>
                            ${phoneNumberDisplay}
                        </div>
                        <div class="flex items-center">
                            <span class="text-red-500 font-semibold mr-2">Blood:</span>
                            <span>${donor.bloodType}</span>
                        </div>
                        ${donor.isOrganDonor && organs.length > 0 ? `<div class="flex items-start"><span class="text-red-500 font-semibold mr-2 shrink-0">Organs:</span><span>${organs.join(', ')}</span></div>` : ''}
                    </div>
                </div>
                <div class="mt-4">
                    ${actionButton}
                </div>`;
            donorList.appendChild(card);
        });
    }

    // --- Global Functions ---
    // NEW: Delete Donor Function
    window.deleteDonor = async (docId) => {
        if(!confirm("Are you sure you want to delete your donor profile? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "donors", docId));
            showToast("Profile deleted successfully.");
            fetchDonors(); // Refresh the list immediately
        } catch (error) {
            console.error(error);
            showToast("Error deleting profile.", true);
        }
    };

    window.initiateRequest = async (donorDocId, donorUserId, donorName, donorPhone) => {
        if (!confirm(`Send a request to view contact details for ${donorName}?`)) return;
        try {
            await addDoc(requestsCol, {
                requesterId: auth.currentUser.uid,
                requesterEmail: auth.currentUser.email,
                donorDocId: donorDocId, 
                donorOwnerId: donorUserId,
                donorName: donorName,
                donorPhone: donorPhone,
                status: 'pending',
                createdAt: new Date()
            });
            showToast('Request sent successfully!');
            fetchDonors(); 
        } catch (error) {
            console.error(error);
            showToast('Failed to send request.', true);
        }
    };

    window.respondToRequest = async (requestId, newStatus) => {
        try {
            const reqRef = doc(db, "requests", requestId);
            await updateDoc(reqRef, { status: newStatus });
            showToast(`Request ${newStatus}.`);
            fetchNotifications(); 
        } catch (error) {
            console.error(error);
            showToast('Action failed.', true);
        }
    };

    // --- Notifications Logic ---
    async function fetchNotifications() {
        if(!notificationList) return;
        
        notificationList.innerHTML = '<div class="loader mx-auto"></div>';
        const currentUserId = auth.currentUser.uid;

        try {
            const qIncoming = query(requestsCol, where("donorOwnerId", "==", currentUserId));
            const snapIncoming = await getDocs(qIncoming);
            const incoming = snapIncoming.docs.filter(doc => doc.data().status === 'pending');

            const qOutgoing = query(requestsCol, where("requesterId", "==", currentUserId));
            const snapOutgoing = await getDocs(qOutgoing);
            const outgoing = snapOutgoing.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            notificationList.innerHTML = '';
            
            if (incoming.length > 0) {
                const header = document.createElement('h3');
                header.className = "font-bold text-gray-700 mt-4 mb-2 border-b pb-2";
                header.textContent = "Requests Received";
                notificationList.appendChild(header);

                incoming.forEach(docSnap => {
                    const req = docSnap.data();
                    const item = document.createElement('div');
                    item.className = 'bg-white p-4 rounded shadow border flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 mb-3';
                    item.innerHTML = `
                        <div>
                            <p class="font-semibold text-gray-800">${req.requesterEmail}</p>
                            <p class="text-sm text-gray-600">wants your contact info.</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="window.respondToRequest('${docSnap.id}', 'approved')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Approve</button>
                            <button onclick="window.respondToRequest('${docSnap.id}', 'rejected')" class="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm">Deny</button>
                        </div>`;
                    notificationList.appendChild(item);
                });
            }

            if (outgoing.length > 0) {
                const header = document.createElement('h3');
                header.className = "font-bold text-gray-700 mt-6 mb-2 border-b pb-2";
                header.textContent = "My Sent Requests";
                notificationList.appendChild(header);

                outgoing.forEach(req => {
                    const item = document.createElement('div');
                    let statusBadge = '';
                    let details = '';
                    
                    if (req.status === 'approved') {
                        statusBadge = `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Approved</span>`;
                        details = `
                            <div class="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                <p class="text-sm text-gray-800">Donor: <strong>${req.donorName}</strong></p>
                                <p class="text-lg font-bold text-blue-600 mt-1">
                                    <a href="tel:${req.donorPhone || '#'}">📞 ${req.donorPhone || 'Not Available (Old Request)'}</a>
                                </p>
                            </div>`;
                    } else if (req.status === 'rejected') {
                        statusBadge = `<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Denied</span>`;
                        details = `<p class="text-xs text-red-500 mt-1">The donor declined your request.</p>`;
                    } else {
                        statusBadge = `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Pending</span>`;
                        details = `<p class="text-xs text-gray-500 mt-1">Waiting for donor approval...</p>`;
                    }

                    item.className = 'bg-white p-4 rounded shadow border mb-3';
                    item.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-semibold text-gray-800">Request to: ${req.donorName}</p>
                                <p class="text-xs text-gray-400">Sent: ${req.createdAt && req.createdAt.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}</p>
                            </div>
                            ${statusBadge}
                        </div>
                        ${details}
                    `;
                    notificationList.appendChild(item);
                });
            }

            if (incoming.length === 0 && outgoing.length === 0) {
                if(noNotifications) noNotifications.classList.remove('hidden');
                updateBadge(0);
            } else {
                if(noNotifications) noNotifications.classList.add('hidden');
                updateBadge(incoming.length); 
            }

        } catch (error) {
            console.error("Error fetching notifications:", error);
            notificationList.innerHTML = '<p class="text-red-500 text-center">Error loading data.</p>';
        }
    }

    function updateBadge(count) {
        if(!notificationBadge) return;
        if (count > 0) {
            notificationBadge.textContent = count;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }

    // --- Filters ---
    function filterDonors() {
        const type = searchDonationType.value;
        const city = searchCity.value.trim().toLowerCase();
        const bloodType = searchBloodType.value;
        const organ = searchOrgan.value;

        const filtered = allDonors.filter(donor => {
            const cityMatch = !city || (donor.city && donor.city.toLowerCase().includes(city));
            let typeMatch = (type === 'all') || (type === 'blood' && donor.isBloodDonor) || (type === 'organ' && donor.isOrganDonor);
            const bloodMatch = !bloodType || (donor.bloodType === bloodType);
            const organsArray = donor.organs || [];
            const organMatch = !organ || (donor.isOrganDonor && organsArray.includes(organ));
            return cityMatch && typeMatch && bloodMatch && organMatch;
        });
        renderDonors(filtered);
    }

    if(searchCity) searchCity.addEventListener('input', filterDonors);
    if(searchDonationType) {
        searchDonationType.addEventListener('change', () => {
            const type = searchDonationType.value;
            bloodTypeFilterContainer.style.display = (type === 'all' || type === 'blood') ? 'block' : 'none';
            organFilterContainer.style.display = (type === 'all' || type === 'organ') ? 'block' : 'none';
            filterDonors();
        });
    }
    if(searchBloodType) searchBloodType.addEventListener('change', filterDonors);
    if(searchOrgan) searchOrgan.addEventListener('change', filterDonors);

    // --- Toast & Auth Handlers ---
    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        if(!toast || !toastMessage) return;
        
        toastMessage.textContent = message;
        toast.className = `fixed bottom-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 opacity-100 ${isError ? 'bg-red-600' : 'bg-gray-900'}`;
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }

    if(signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = getEl('signup-email').value;
            const password = getEl('signup-password').value;
            createUserWithEmailAndPassword(auth, email, password)
                .then(() => {
                    signOut(auth).then(() => {
                        alert("Account created! Please log in.");
                        signupForm.reset();
                        window.location.hash = '#login';
                    });
                })
                .catch((error) => alert("Error: " + error.message));
        });
    }

    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = getEl('login-email').value;
            const password = getEl('login-password').value;
            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    showToast('Logged in!');
                    loginForm.reset();
                    window.location.hash = '#find';
                })
                .catch((error) => alert("Error: " + error.message));
        });
    }

    if(navLogout) {
        navLogout.addEventListener('click', () => {
            signOut(auth).then(() => {
                showToast('Logged out.');
                window.location.hash = '#home';
            });
        });
    }
});