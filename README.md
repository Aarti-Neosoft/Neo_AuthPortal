# Neosoft Technologies — User Registration & OTP-Based Login Application

A secure, enterprise-grade, responsive full-stack authentication web application featuring user registration, OTP verification (via Email or Mobile), password strength validation, JWT session management, and a protected user dashboard.

Built using **React (Vite)**, **Node.js**, **Express.js**, and **MongoDB with Mongoose**.

---

## 🌟 Key Features

### 1. User Registration (Page 1)
- **Comprehensive Fields**: Full Name, Email Address, Mobile Number, Password, Confirm Password.
- **Client & Server-Side Validation**: Strict email format checking, 10-digit mobile number validation, name length validation, and confirm password matching.
- **Dynamic Password Strength Meter**: Real-time visual strength bar and checklist for:
  - 8+ characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one digit (0-9)
  - At least one special character (`!@#$%^&*...`)
- **Staged Registration Security**: Unverified users are **never** stored in the main `User` collection. Data is safely cached in a temporary OTP verification record with TTL expiry until the code is verified.
- **Instant Redirection**: Navigates to Login page with a success banner upon completion.

### 2. Login with OTP (Page 2)
- **Step 1: Identity Entry**: Accepts either registered **Email Address** or **10-Digit Mobile Number**.
- **Step 2: 6-Digit OTP Verification**:
  - Displays masked target (e.g. `a*******v@example.com` or `******3210`).
  - Auto-advancing 6-box OTP input with full paste support (copy-paste all 6 digits).
  - Live countdown timer (30-second cooldown) for requesting a new code.
  - Option to edit email/mobile and return to Step 1.
- **Step 3: Session Establishment**:
  - Constant-time HMAC-SHA256 hash comparison.
  - Generates signed JSON Web Token (JWT).
  - Smooth animated redirect to the Protected Dashboard.

### 3. Protected Dashboard (Post-Login View)
- Protected by `ProtectedRoute` wrapper; unauthenticated visits automatically redirect to `/login`.
- Displays user's Full Name, Email, Mobile number with verified status badges.
- Displays last login timestamp, account creation date, and token status.
- Live refresh profile action calling `GET /api/auth/me`.
- Secure Logout action that invalidates the local JWT session.

### 4. Enterprise-Grade Security
- **Hashed OTPs**: OTPs are hashed using HMAC-SHA256 with unique cryptographically random salts; plain text OTPs are never persisted in the database.
- **Constant-Time Verification**: Prevents timing side-channel attacks via `crypto.timingSafeEqual`.
- **Throttling & Rate Limiting**:
  - Maximum 5 failed verification attempts before the OTP is invalidated.
  - IP-based rate limiting via `express-rate-limit`.
  - Minimum 30-second resend cooldown.
- **TTL Database Expiry**: MongoDB TTL indexes automatically clean up expired verification sessions after 5 minutes.
- **Password Salting**: 12-round bcrypt password hashing.

---

## 📁 Project Folder Structure

```text
Neosoft_Nodejs_LoginApp/
├── client/                               # Frontend React (Vite) Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertBanner.jsx           # Clean dismissible error/success banners
│   │   │   ├── AuthLayout.jsx            # Centered glassmorphic card & brand header
│   │   │   ├── Button.jsx                # Accessible button with spinner & debounce
│   │   │   ├── InputField.jsx            # Reusable input with show/hide password toggle
│   │   │   ├── OtpInput.jsx              # 6-box auto-focus & paste-supported OTP input
│   │   │   └── ProtectedRoute.jsx        # Route guard checking authentication
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Global user & JWT session management
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx             # Authenticated user profile view
│   │   │   ├── Login.jsx                 # 2-step OTP login page
│   │   │   └── Register.jsx              # Form + email OTP verification page
│   │   ├── services/
│   │   │   ├── api.js                    # Axios instance with Bearer interceptor
│   │   │   └── authService.js            # Authentication API functions
│   │   ├── App.css                       # Modern UI, micro-animations & layout
│   │   ├── App.jsx                       # React Router configuration
│   │   ├── index.css                     # Global CSS variables & design tokens
│   │   └── main.jsx                      # React 19 entrypoint
│   ├── .env                              # Frontend environment config
│   ├── .env.example                      # Template for frontend environment
│   └── package.json
│
├── server/                               # Backend Node.js & Express REST API
│   ├── config/
│   │   └── db.js                         # Mongoose connection + MongoMemoryServer fallback
│   ├── controllers/
│   │   └── authController.js             # REST API business logic
│   ├── middleware/
│   │   ├── authMiddleware.js             # Bearer JWT verification
│   │   └── rateLimiter.js                # Rate limiters for OTP generation & verification
│   ├── models/
│   │   ├── OtpVerification.js            # Temporary OTP session with TTL index
│   │   └── User.js                       # Verified user profile with bcrypt hooks
│   ├── routes/
│   │   └── authRoutes.js                 # Authentication route mappings
│   ├── services/
│   │   ├── emailService.js               # Nodemailer SMTP with dev mock fallback
│   │   ├── otpService.js                 # Unified OTP generation & verification logic
│   │   └── smsService.js                 # Twilio integration with dev mock fallback
│   ├── utils/
│   │   ├── apiResponse.js                # Standardized JSON response helper
│   │   ├── cryptoUtils.js                # Secure random generation & constant-time hash
│   │   └── validators.js                 # Email, mobile, password & masking helpers
│   ├── .env                              # Backend environment config
│   ├── .env.example                      # Template for backend environment
│   ├── app.js                            # Express app configuration & middleware
│   ├── package.json
│   ├── server.js                         # Server listener entrypoint
│   └── test-auth-flow.js                 # Automated backend test suite
│
├── .gitignore
├── package.json                          # Workspace root script orchestration
└── README.md
```

---

## ⚙️ Environment Variables

### Backend Configuration (`server/.env`)

```ini
# Server port and environment
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection
# Set your local MongoDB or Atlas URI. If unreachable, the server automatically
# starts MongoMemoryServer in-memory so the app works out-of-the-box!
MONGODB_URI=mongodb://127.0.0.1:27017/neosoft_auth_db
USE_MEMORY_DB=false

# Security & Secrets
JWT_SECRET=neosoft_super_secure_jwt_secret_token_key_2026_change_in_production
JWT_EXPIRES_IN=7d
OTP_HASH_SECRET=neosoft_otp_hmac_secret_salt_key_2026

# Email Delivery (Nodemailer / SMTP)
# (Leave empty to use built-in Development Mock Delivery mode with console logs and UI dev helpers)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Neosoft Auth App" <noreply@neosoft.com>

# SMS Delivery (Twilio - Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Frontend Configuration (`client/.env`)

```ini
# Base URL for Backend REST API
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Installation & Running the Application

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested)
- **npm** / **npm.cmd**

### 2. Install Dependencies
Run the command below in the project root:
```bash
# Windows PowerShell / CMD:
npm.cmd --prefix server install && npm.cmd --prefix client install

# macOS / Linux:
npm --prefix server install && npm --prefix client install
```

### 3. Run the Backend Server
```bash
# Windows PowerShell:
npm.cmd --prefix server run dev

# macOS / Linux:
npm --prefix server run dev
```
The server will start on `http://localhost:5000`. If local MongoDB is not running, it automatically starts an in-memory MongoDB instance.

### 4. Run the Frontend Development Server
In a new terminal window:
```bash
# Windows PowerShell:
npm.cmd --prefix client run dev

# macOS / Linux:
npm --prefix client run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Testing the Application

### Automated End-to-End Test Suite
A dedicated verification suite tests all 13 core authentication requirements:
```bash
cd server
node test-auth-flow.js
```
**Test coverage includes**:
1. Server health check
2. Missing field rejection (400)
3. Weak password rejection (400)
4. Successful registration staging & masked OTP dispatch (200)
5. Ensuring unverified user is **not** in MongoDB prior to verification
6. Rejecting wrong OTP and decrementing attempt count (400)
7. Successful OTP verification, creating MongoDB record and generating JWT (201)
8. Duplicate email/mobile registration prevention (409)
9. Protected profile access via `GET /api/auth/me` with JWT (200)
10. Unauthenticated access prevention (401)
11. Login OTP dispatch via Mobile Number (200)
12. Login OTP verification and session authentication (200)
13. Logout endpoint handling (200)

---

## 📡 REST API Reference

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Validate details and dispatch registration OTP | No |
| `POST` | `/api/auth/register/verify-otp` | Verify OTP and persist user in MongoDB | No |
| `POST` | `/api/auth/login/send-otp` | Dispatch login OTP to email or mobile | No |
| `POST` | `/api/auth/login/verify-otp` | Verify OTP and return JWT session token | No |
| `POST` | `/api/auth/resend-otp` | Resend OTP with cooldown enforcement | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | **Yes (JWT)** |
| `POST` | `/api/auth/logout` | Terminate active user session | **Yes (JWT)** |
| `GET` | `/api/health` | Service health status | No |

---

## 🔒 Email & SMS Provider Configuration

### 1. Live Gmail / SMTP Setup:
In `server/.env`, configure your real SMTP credentials:
```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Neosoft Auth App" <your_email@gmail.com>
```
> **Note for Gmail:**
> 1. Go to your **Google Account** > **Security**.
> 2. Enable **2-Step Verification**.
> 3. Search for **App Passwords** and generate a 16-character app password for "Mail".
> 4. Use that app password as `SMTP_PASS`.

### 2. Live Twilio SMS Setup:
In `server/.env`, configure your Twilio account details:
```ini
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### 3. Strict Real Delivery & Validation Behavior:
- When a user enters their email address and clicks **Send OTP**, Nodemailer sends the OTP code to their real email inbox.
- If `SMTP_USER` or `SMTP_PASS` are unconfigured, the server returns HTTP 503 with:  
  `"Email delivery service is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in server environment variables to send verification OTPs."`
- If mobile is used and Twilio credentials are not set, the server returns HTTP 503 with:  
  `"SMS delivery service is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in server environment variables to send verification OTPs via SMS."`
- The OTP is **never** returned in API responses or displayed on the frontend UI.
- The user must enter the OTP received in their real inbox/phone to verify and sign in.
---

## 📄 License
ISC License — Neosoft Technologies 2026.
