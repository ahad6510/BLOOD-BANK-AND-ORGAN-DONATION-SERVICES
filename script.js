// 1. Correct Imports for Firebase 10
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
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

// 2. Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const donorsCol = collection(db, "donors");

document.addEventListener('DOMContentLoaded', () => {
    let allDonors = [];

    // --- Element Selectors ---
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const registrationForm = document.getElementById('registration-form');
    const donateBloodCheckbox = document.getElementById('donate-blood');
    const donateOrganCheckbox = document.getElementById('donate-organ');
    const bloodDetails = document.getElementById('blood-donation-details');
    const organDetails = document.getElementById('organ-donation-details');
    const donorList = document.getElementById('donor-list');
    const loader = document.getElementById('loader');
    const noResults = document.getElementById('no-results');
    const searchCity = document.getElementById('search-city');
    const searchDonationType = document.getElementById('search-donation-type');
    const bloodTypeFilterContainer = document.getElementById('blood-type-filter-container');
    const organFilterContainer = document.getElementById('organ-filter-container');
    const searchBloodType = document.getElementById('search-blood-type');
    const searchOrgan = document.getElementById('search-organ');

    // --- SPA Navigation Logic ---
    const showSection = (hash) => {
        const id = hash ? hash.substring(1) : 'home';
        sections.forEach(section => {
            section.classList.toggle('active', section.id === id);
        });
        if (id === 'find') fetchDonors();
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const hash = link.getAttribute('href');
            if(hash.startsWith('#')) {
                e.preventDefault();
                window.location.hash = hash;
                mobileMenu.classList.add('hidden');
            }
        });
    });

    window.addEventListener('hashchange', () => showSection(window.location.hash));
    showSection(window.location.hash || '#home');

    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // --- Registration Form Logic ---
    donateBloodCheckbox.addEventListener('change', () => {
        bloodDetails.classList.toggle('hidden', !donateBloodCheckbox.checked);
    });
    donateOrganCheckbox.addEventListener('change', () => {
        organDetails.classList.toggle('hidden', !donateOrganCheckbox.checked);
    });

    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isBloodDonor = donateBloodCheckbox.checked;
        const isOrganDonor = donateOrganCheckbox.checked;

        if (!isBloodDonor && !isOrganDonor) {
            showToast('Please select at least one donation type.', true);
            return;
        }

        const pledgedOrgans = isOrganDonor ? 
            [...document.querySelectorAll('input[name="organ"]:checked')].map(cb => cb.value) : [];

        const bloodType = document.getElementById('blood-type').value;

        const donorData = {
            fullName: document.getElementById('fullName').value,
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            isBloodDonor,
            bloodType: isBloodDonor ? bloodType : null,
            isOrganDonor,
            organs: pledgedOrgans,
            createdAt: new Date()
        };

        try {
            // Save to Firebase Firestore
            await addDoc(donorsCol, donorData);
            showToast('Registration successful! Thank you for being a hero.');
            registrationForm.reset();
            bloodDetails.classList.add('hidden');
            organDetails.classList.add('hidden');
            window.location.hash = '#find';
        } catch (error) {
            console.error('Firebase Error:', error);
            showToast(`Registration failed: ${error.message}`, true);
        }
    });

    // --- Find Donor Logic ---
    async function fetchDonors() {
        loader.style.display = 'block';
        noResults.classList.add('hidden');
        donorList.innerHTML = '';
        try {
            const q = query(donorsCol, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            allDonors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            filterDonors();
        } catch (error) {
            showToast('Could not fetch data from Firebase.', true);
        } finally {
            loader.style.display = 'none';
        }
    }

    function renderDonors(donorsToRender) {
        donorList.innerHTML = '';
        if (donorsToRender.length === 0) {
            noResults.classList.remove('hidden');
            return;
        }
        noResults.classList.add('hidden');

        donorsToRender.forEach(donor => {
            const organs = (donor.isOrganDonor && Array.isArray(donor.organs)) ? donor.organs : [];
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500';
            card.innerHTML = `
                <h3 class="text-xl font-bold mb-2">${donor.fullName}</h3>
                <p class="text-gray-600 mb-4">${donor.city}, ${donor.state}</p>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <span class="text-red-500 font-semibold mr-2">Phone:</span>
                        <a href="tel:${donor.phone}" class="text-blue-600 hover:underline">${donor.phone}</a>
                    </div>
                    ${donor.isBloodDonor ? `<div class="flex items-center"><span class="text-red-500 font-semibold mr-2">Blood:</span><span>${donor.bloodType}</span></div>` : ''}
                    ${donor.isOrganDonor && organs.length > 0 ? `<div class="flex items-start"><span class="text-red-500 font-semibold mr-2 shrink-0">Organs:</span><span>${organs.join(', ')}</span></div>` : ''}
                </div>`;
            donorList.appendChild(card);
        });
    }

    function filterDonors() {
        const type = searchDonationType.value;
        const city = searchCity.value.trim().toLowerCase();
        const bloodType = searchBloodType.value;
        const organ = searchOrgan.value;

        const filtered = allDonors.filter(donor => {
            const cityMatch = !city || (donor.city && donor.city.toLowerCase().includes(city));
            let typeMatch = (type === 'all') || (type === 'blood' && donor.isBloodDonor) || (type === 'organ' && donor.isOrganDonor);
            const bloodMatch = !bloodType || (donor.isBloodDonor && donor.bloodType === bloodType);
            const organsArray = donor.organs || [];
            const organMatch = !organ || (donor.isOrganDonor && organsArray.includes(organ));
            return cityMatch && typeMatch && bloodMatch && organMatch;
        });
        renderDonors(filtered);
    }

    searchDonationType.addEventListener('change', () => {
        const type = searchDonationType.value;
        bloodTypeFilterContainer.style.display = (type === 'all' || type === 'blood') ? 'block' : 'none';
        organFilterContainer.style.display = (type === 'all' || type === 'organ') ? 'block' : 'none';
        filterDonors();
    });

    searchCity.addEventListener('input', filterDonors);
    searchBloodType.addEventListener('change', filterDonors);
    searchOrgan.addEventListener('change', filterDonors);

    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.className = `fixed bottom-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 opacity-100 ${isError ? 'bg-red-600' : 'bg-gray-900'}`;
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }
});