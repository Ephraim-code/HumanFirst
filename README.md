# HealthCompanion

HealthCompanion is a web-based e-counselling platform designed for individuals living with chronic diseases. It connects patients and counsellors in disease-specific support groups, enabling secure communication, group and private calls, and access to a virtual health assistant for advice.

## Features

- **User Roles:**
  - **Patient:** Join disease-specific groups, chat, join group calls, and receive support.
  - **Counsellor:** Create and manage groups, moderate discussions, and support patients.
- **Authentication:** Secure sign-up and login using Firebase Authentication.
- **Disease-Specific Groups:** Patients join groups based on their condition; counsellors can manage multiple groups.
- **Group Chat:** Real-time group chat for support and discussion.
- **Group Calls:** Audio-only group calls using WebRTC, with mute/unmute and "raise hand" features.
- **Private Calls:** One-on-one audio calls between users.
- **Virtual Assistant:** AI-powered assistant for general health advice (does not book appointments or handle emergencies).
- **Edit Profile:** Users can update their profile information via a modal form.
- **Leave Group:** Patients can leave groups at any time.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Firebase (Authentication, Firestore)
- **Real-Time Communication:** WebRTC (for calls)

## Setup & Installation

1. **Clone the repository:**
   ```
   git clone <your-repo-url>
   cd <project-directory>
   ```

2. **Firebase Setup:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Email/Password).
   - Enable **Cloud Firestore** (in test mode for development).
   - Copy your Firebase config and replace it in the HTML files (`signup.html`, `login.html`, `patient-dashboard.html`, `counsellor-dashboard.html`).
   - Update Firestore security rules using `firestore-rules-multi-group.txt`.

3. **Run Locally:**
   - You can use a local server (e.g., VSCode Live Server, Python's `http.server`, or similar) to serve the files.
   - Open `index.html` in your browser.

## File Structure

- `index.html` — Landing page
- `signup.html` — User registration
- `login.html` — User login
- `patient-dashboard.html` — Patient dashboard
- `counsellor-dashboard.html` — Counsellor dashboard
- `script.js` — Main JavaScript logic (shared by dashboards)
- `styles.css` — Main stylesheet
- `firestore-rules-multi-group.txt` — Firestore security rules
- `cors.json` — Example CORS config for Firebase Storage (not required for current features)

## Usage

1. **Sign Up:**
   - Patients and counsellors register with their details and role.
2. **Login:**
   - Users log in and are redirected to their respective dashboards.
3. **Groups:**
   - Patients join/leave groups based on their condition.
   - Counsellors create and manage groups.
4. **Chat & Calls:**
   - Use group chat and group call features for real-time support.
   - Private calls are available between users.
5. **Virtual Assistant:**
   - Click "Start Chat" in the assistant section for advice.
6. **Edit Profile:**
   - Use the "Edit Profile" button to update your information.

## Notes

- **No Resource Uploads:** All resource upload/management features have been removed.
- **Advice-Only Virtual Assistant:** The assistant provides general advice only; it does not book appointments or handle emergencies.
- **Firebase Spark Plan:** The app works on the free Spark plan (no Storage required).

## Security

- Use the provided Firestore rules for secure access control.
- Do not expose sensitive Firebase credentials in public repositories.

## License

MIT License 