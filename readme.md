# TOHF-E-HAYAT 🩸🫀
**Blood & Organ Donation Services Platform**

TOHF-E-HAYAT is a secure, real-time web application designed to bridge the gap between voluntary donors and those in urgent need of blood or organ transplants. The platform focuses on user privacy, identity verification, and a seamless request-and-approval workflow.

## 🚀 Live Demo
https://ahad6510.github.io/BLOOD-BANK-AND-ORGAN-DONATION-SERVICES/

## ✨ Key Features

- **Identity Verification (KYC):** Mandatory document upload (Aadhaar Card & Passport Photo) during registration to ensure the authenticity of all users.
- **Admin Verification Gatekeeper:** New accounts remain in a 'Pending' status. Users can only access the platform's features after an Admin reviews their documents and upgrades them to 'Verified'.
- **Secure Authentication:** Seamless one-click Google Sign-In powered by Firebase Auth.
- **Privacy-First Workflow:** Donor contact numbers are hidden by default. Requesters must send a digital request, and only upon the donor's explicit approval is the phone number revealed.
- **Smart Notification Hub:** Real-time tracking of incoming and outgoing requests. Includes a smart notification badge that uses local caching to alert users of new approvals.
- **Advanced Search Filters:** Cascading State and City dropdowns guarantee accurate geographic matching when searching for donors.
- **Data Integrity:** Strict input validations, including mandatory 10-digit phone number formatting and medical-grade blood type requirements.
- **Full Profile Control:** Donors have the power to Edit their information at any time or Delete their profile entirely if they are no longer available.
- **Responsive Design:** Built with Tailwind CSS, the platform is fully optimized for both Desktop and Mobile devices.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Firebase Firestore](https://firebase.google.com/products/firestore) (NoSQL)
- **Authentication:** [Firebase Auth](https://firebase.google.com/products/auth) (Google Provider)
- **Media Storage:** [Cloudinary](https://cloudinary.com/) (Secure PDF & Image Delivery)

## 📜 License

Developed with ❤️ by Ahad Khan