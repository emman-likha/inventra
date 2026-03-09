# Inventra - Project Overview & Context

Inventra is a robust, high-utility asset management system designed to manage a company’s physical and digital assets with precision and efficiency.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS, Vanilla CSS (globals.css)
- **Animations**: GSAP (@gsap/react), Framer Motion
- **3D/Graphics**: Three.js (@react-three/fiber, @react-three/drei)
- **Scrolling**: Lenis (Smooth Scroll)
- **Language**: TypeScript

### Backend
- **Framework**: Node.js with Express 5.2.1
- **Middleware**: CORS, Dotenv
- **Runtime**: Node.js

---

## 📂 Project Structure
```text
inventra/
├── frontend/               # Next.js Application
│   ├── app/                # App Router (Pages & Layouts)
│   ├── components/         # Reusable UI & Section components
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                # Node.js/Express Server
│   ├── controllers/        # Request handlers
│   ├── models/             # Data models
│   ├── routes/             # API Endpoints
│   ├── server.js           # Entry point
│   └── package.json        # Backend dependencies
├── documentations/         # Product & Branding Strategy
└── package.json            # Root configuration (concurrently)
```

---

## 🛠 Key Modules & Features
1. **Assets**: Management of physical/digital assets (Add, Check-in/out, Lease, Dispose, Maintenance).
2. **Lists**: Centralized tracking for assets, maintenances, and warranties.
3. **Reports**: Automated and custom analytical reports (Audit, Depreciation, Insurance, etc.).
4. **Tools**: Data utilities (Import/Export, Document/Image Gallery, Audit).
5. **Advanced**: Security, User roles, Customer database, and Insurance management.
6. **Setup**: Company configuration, Sites/Locations, Categories, and Dashboard management.

---

## 🎨 Branding & Design Strategy
- **Core Identity**: Reliability, Precision, Modern Efficiency.
- **Primary Color Palette**: "Trust & Precision"
  - **Primary**: Deep Blue (`#1E40AF`)
  - **Secondary**: Royal Blue (`#3B82F6`)
  - **Surface**: Slate 50 (`#F8FAFC`)
- **Typography**: Clean sans-serif (Inter / Outfit).
- **Aesthetics**: Professional, high-contrast, industrial-modern feel.

---

## 🔄 Current Development State
- **Active Task**: Implementing a login page and user dashboard structure.
- **Proposed Architecture**: Using Next.js Route Groups `(auth)` and `(dashboard)` to manage separate layouts and protection layers via Middleware.
- **Visuals**: High-fidelity Hero section with GSAP animations and smooth scrolling.
