# Djarna Backend API

A robust, production-ready backend API for **Djarna** — a peer-to-peer (P2P) social marketplace application. It supports product listings, real-time messaging, negotiation bidding/offers, secure payments, order management, feedback reviews, and push notifications.

---

## 🚀 Features

### 👤 Authentication & Profiles
- **JWT-Based Authentication**: Secure access token and refresh token rotation.
- **OTP Verification**: Email-based and SMS-based OTP verification using Nodemailer and Twilio.
- **Social Login**: Integrated passport strategies for Apple, Google, and Facebook auth.
- **Identity Verification**: Document upload and review workflows for KYC and verified user badging.
- **Follow System**: Users can follow and unfollow sellers, tracking popular merchants.

### 🛍️ Product Listings
- **Search & Filters**: Multi-criteria search (terms, category, subcategory, sub-subcategories, price limits, gender, sizes, brands, etc.).
- **Effective Boosting**: Dynamic promotional package calculations (isEffectiveBoosted checks expiration dates in real-time).
- **Favorites & Wishlist**: Bookmark favorite items for future purchasing.

### 💬 Real-Time Chat & Offers
- **WebSockets (Socket.io)**: Real-time messaging and chat threads sync.
- **Rich Message Formats**: Standard text, location sharing, and file attachments (images, PDFs, documents).
- **Negotiation System**:
  - Propose custom price and shipping offers.
  - Real-time offer updating, accepting, counter-offering, or rejecting.
  - Automatic push notifications and socket sync alerts on state changes.

### 💳 Orders & Payments
- **Secure Checkouts**: Built-in payment flow utilizing the **Paydunya** invoice checkouts and redirect mechanisms.
- **Payment Webhooks**: Paydunya webhook integrations to capture successful transactions, automatically mark products as SOLD, create orders, and complete pending offers.
- **Dispute Claims**: Users can raise order disputes to claim refunds.

### 🔔 Notifications & Cron Jobs
- **Push Notifications**: Firebase Cloud Messaging (FCM) integration for direct device alerts.
- **Cron Schedules**: Automatic cleanups for expired boost packages and uncompleted/cancelled actions.

---

## 🛠️ Technology Stack
- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Web Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using [Mongoose ODM](https://mongoosejs.com/))
- **Real-Time Communication**: [Socket.io](https://socket.io/)
- **Push Notification Service**: [Firebase Admin SDK](https://firebase.google.com/docs/admin)
- **Validation Middleware**: [Zod](https://zod.dev/)
- **File Uploads**: [Multer](https://github.com/expressjs/multer) & [Sharp](https://sharp.pixelplumbing.com/) (image optimization)

---

## ⚙️ Project Structure
```text
src/
├── app.ts                 # Express application instantiation
├── server.ts              # Server bootstrapper, DB connector, and socket initiator
├── app/
│   ├── config/            # Server configuration constants (.env parser)
│   ├── middlewares/       # Express middlewares (auth, validation, multer, error handlers)
│   ├── socket/            # Real-time WebSocket connection handling & event mapping
│   └── modules/           # Module-based MVC architecture
│       ├── activity/      # Admin audit/activity logs
│       ├── auth/          # Authentication & oauth logins
│       ├── favorite/      # Product bookmarks
│       ├── follow/        # Followers & social logic
│       ├── message/       # Chats, threads, and negotiation offers
│       ├── order/         # Order state machines
│       ├── payment/       # Paydunya checkouts & webhook receivers
│       ├── product/       # Public search and marketplace listings
│       └── ...
├── errors/                # Global API error classes
└── utils/                 # Modular utilities (firebase instance, mailers, cron schedulers)
```

---

## ⚙️ Setup and Installation

### 1. Clone the repository & Install dependencies
```bash
git clone <repository-url>
cd Djarna_App_Backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and copy the contents from `.env.example`:
```bash
cp .env.example .env
```
Fill in the values for your MongoDB URL, JWT tokens, Twilio credentials, and Paydunya merchant keys.

### 3. Setup Firebase Service Account
For push notifications, place your Firebase Private Key JSON file inside the `config/` directory with the name:
`djarna-b212e-firebase-adminsdk-fbsvc-ed19886f3e.json`

---

## 🏃 Running the Application

### Development Mode (with hot-reloads)
```bash
npm run dev
```

### Production Build
```bash
# Compile TypeScript to JavaScript in /dist
npm run build

# Start production server
npm run start
```

### Linter Checks
```bash
# Run ESLint rules check
npm run lint

# Automatically resolve fixing rules
npm run lint:fix
```

---

## 📋 API Standards & Guidelines

### Paginated Responses & Meta
All paginated search or retrieval routes return a structured wrapper matching your response standards:

```json
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": [
    {
      "_id": "60d0fe...",
      "title": "Nike Air Force 1",
      "price": 45000
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "totalPage": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```
Query parameters for pagination follow: `?page=1&limit=10`.
