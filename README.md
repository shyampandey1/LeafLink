# LeafLink ESP32 Smart Garden Dashboard

LeafLink is a modern, high-fidelity React dashboard designed to monitor and control indoor and outdoor plants via ESP32 microcontrollers. It features real-time environmental telemetry, direct actuator override controls, BLE device discovery/pairing, and intelligent care recommendations powered by Gemini AI.

---

## 🚀 Key Features

* **Botanical Health Index**: Dynamic calculation of overall garden health based on real-time telemetry (soil moisture, temperature, light intensity, pH, and humidity).
* **Control Room**: Precision manual override of physical actuators (high-flow drip irrigation pumps, grow lights with spectrum configuration, and cooling blowers).
* **BLE Hub**: High-fidelity Bluetooth scanner and GATT transceiver simulation to pair, debug, and monitor active ESP32 nodes locally.
* **AI Advisory**: Smart crop diagnosis and automated care prescriptions powered by Gemini API integration.
* **Hybrid Connectivity**: Seamless local caching for offline operation with automatic synchronization to Firestore when the cloud link is restored.
* **Responsive Dark/Light UI**: Curated aesthetics featuring modern typography, micro-interactions, and glassmorphism styling.

---

## 🛠️ Architecture & Tech Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Animations**: [Motion](https://motion.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **AI Integration**: [Google Gen AI SDK (@google/genai)](https://github.com/google/generative-ai-js)
* **Backend Integration**: [Firebase (Auth & Firestore)](https://firebase.google.com/)

---

## 💻 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Clone & Install Dependencies
Navigate to the project directory and install the required npm packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create or edit your `.env.local` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Development Server
Run the local Vite development server:
```bash
npm run dev
```
Open your browser and navigate to the address shown in the terminal (typically `http://localhost:3000`).

### 4. Build for Production
To build the optimized static assets for production:
```bash
npm run build
```

---

## 🔒 Security Configuration

The project includes pre-configured database security rules inside [firestore.rules](firestore.rules) to prevent threat vectors like path poisoning, cross-tenant data modification, and schema value tampering. 

To deploy the rules to your Firebase project, run:
```bash
firebase deploy --only firestore:rules
```
