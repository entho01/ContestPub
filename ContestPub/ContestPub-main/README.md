# ContestPub - Esport Match Contest Platform

ContestPub is a fully functional web application designed for organizing, managing, and entering esports matches and tourney draws. Built with a React frontend and Express backend, it features a glassmorphic space-dark design system, real-time ticket meters, automated user wallets, and robust admin modules.

## Key Features

1. **User Registration & Login (Phone OTP)**:
   - Authenticate with a mobile phone number.
   - **Twilio SMS Dispatch**: Configurable via `.env` in the backend.
   - **iOS Notification Simulator**: If Twilio credentials are omitted, the client displays a drop-down notification showing the generated verification code on-screen instantly for simple local testing.
   - New users receive a **1,000 credit Welcome Bonus** in their virtual wallet.

2. **Virtual Wallet Integration**:
   - Simulated wallet balance to purchase contest tickets.
   - Sandbox Top-up modal allowing users to instantly add credits.
   - Wallet transaction ledger recording purchases, top-ups, and refunds.

3. **Ticket Capacity Constraints**:
   - Tickets are capped per contest (up to a maximum capacity of **10,000**).
   - Dynamic visual progress meters indicating tickets sold and remaining slots.
   - Ticket stubs with sequented ticket IDs (e.g. `CP-PUBG-1002`) and barcode layouts.

4. **Special Admin Portal (Phone: `84680356`)**:
   - Logging in with phone number `84680356` automatically unlocks the Admin Panel in the navbar.
   - **Contest CRUD**: Create, Edit, and Delete contests (deleting a contest automatically refunds all ticket holders).
   - **User Registry**: View lists of enrolled users (Names, Emails, Phone Numbers) per contest.
   - **Remove Participant**: Revoke user enrollment, delete their tickets, restore contest slot capacity, and refund credits directly to the user's wallet.
   - **Draw Winner**: End a live contest and draw a random winner from the participant pool, displaying a canvas-confetti celebration.

---

## Directory Structure

- `/backend`: Node/Express server on port `5000` with local JSON file database (`/backend/data/db.json`).
- `/frontend`: Vite + React development client on port `5173`.
- `/`: Monorepo manager with concurrent start script.

---

## Setup & Running Locally

### 1. Prerequisites
Ensure you have **Node.js** installed on your Windows machine.

### 2. Startup CLI
Open a terminal in the project root directory (`C:\Users\Mayank singh\.gemini\antigravity\scratch\contestpub`) and run:

```bash
# Install root, frontend, and backend packages in one step:
npm run install:all

# Run the app:
npm run dev
```

The CLI will concurrently launch:
- The Express API server at `http://localhost:5000`
- The React application at `http://localhost:5173`

Open `http://localhost:5173` in your browser.

### 3. Twilio Credentials (Optional)
If you wish to send real phone SMS, open `backend/.env` and insert your Twilio API credentials:
```env
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_FROM_NUMBER=your_twilio_number_here
PORT=5000
```
Restart the dev server. The backend will automatically transition from simulation mode to dispatching real SMS text messages.
