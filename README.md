# Neosoft Technologies — User Registration and OTP Login

A full-stack authentication application built using React, Node.js, Express.js, and MongoDB. The application supports user registration, email or mobile OTP verification, password validation, JWT-based authentication, and a protected dashboard.

## Tech Stack

**Frontend**
- React 19
- Vite
- React Router DOM
- Axios
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB and Mongoose
- JSON Web Tokens (JWT)
- bcrypt
- Nodemailer for email delivery
- Twilio for SMS delivery
- express-rate-limit for API rate limiting

## Features

### 1. User Registration

The registration page collects the following details:

- Full name
- Email address
- Mobile number
- Password
- Confirm password

The form validates user input on both the frontend and backend. Password validation checks for a minimum of eight characters, uppercase and lowercase letters, a number, and a special character.

A password strength indicator helps users check their password while entering it.

After submitting the form, the application sends an OTP for verification. The user is added to the main `User` collection only after successful OTP verification. Pending registration details are stored separately in a temporary verification record.

Once registration is completed, the user is redirected to the login page.

### 2. OTP-Based Login

Users can log in using their registered email address or mobile number.

The login process consists of three steps:

1. Enter a registered email address or mobile number.
2. Receive and enter the six-digit OTP.
3. Verify the OTP and establish an authenticated session.

The OTP input supports automatic focus movement between fields and pasting all six digits at once. A countdown timer controls when the user can request another OTP.

The destination is displayed in a masked format to avoid exposing the complete email address or mobile number on the screen.

After successful verification, the backend generates a JWT, which the frontend uses to access protected APIs.

### 3. Dashboard

After login, users can access a protected dashboard displaying their profile information.

The dashboard includes:

- Full name, email address, and mobile number
- Email and mobile verification status
- Account creation date
- Last login information
- Profile refresh functionality
- Logout functionality

The `ProtectedRoute` component prevents unauthenticated users from accessing protected pages. The dashboard can also retrieve the latest profile information through `GET /api/auth/me`.

### 4. Security and Validation

The application includes the following security measures:

- Server-side validation of registration and login inputs
- bcrypt password hashing with a configured work factor of 12 rounds
- HMAC-SHA256-based OTP verification
- Constant-time comparison using `crypto.timingSafeEqual`
- A maximum of five failed OTP attempts per verification session
- Rate limiting for OTP-related endpoints
- A minimum 30-second resend cooldown
- Temporary OTP records with a five-minute MongoDB TTL expiry
- JWT authentication middleware for protected APIs
- Environment variables for application configuration and secrets

OTP values should not be returned in API responses or displayed in the production frontend. Email and SMS delivery should use configured providers rather than development-only mock delivery.

**Note:** JWT-based logout on the client removes the local session token. Immediate server-side token invalidation requires additional backend session or token-revocation handling if it is not already implemented.

## Project Structure

```text
Neosoft_Nodejs_LoginApp/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertBanner.jsx
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── InputField.jsx
│   │   │   ├── OtpInput.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── authService.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── .env.example
│   └── package.json
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── OtpVerification.js
│   │   └── User.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── services/
│   │   ├── emailService.js
│   │   ├── otpService.js
│   │   └── smsService.js
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── cryptoUtils.js
│   │   └── validators.js
│   ├── .env
│   ├── .env.example
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── test-auth-flow.js
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js 18 or later
- npm
- MongoDB installed locally or a MongoDB Atlas connection
- SMTP credentials for email OTP delivery
- Twilio credentials if SMS OTP delivery is required

## Installation

Clone the repository and open the project directory:

```bash
git clone <repository-url>
cd Neosoft_Nodejs_LoginApp
```

Install the frontend and backend dependencies from the project root.

**Windows PowerShell or Command Prompt:**

```bash
npm.cmd --prefix server install
npm.cmd --prefix client install
```

**macOS or Linux:**

```bash
npm --prefix server install
npm --prefix client install
```

## Environment Configuration

### Backend — `server/.env`

Create a `.env` file inside the `server` directory.

```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/neosoft_auth_db
USE_MEMORY_DB=false

JWT_SECRET=replace_with_a_secure_random_secret
JWT_EXPIRES_IN=7d
OTP_HASH_SECRET=replace_with_a_separate_secure_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Neosoft Auth App" <your_email@gmail.com>

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Replace the example secret values with securely generated secrets before running the application in a production environment.

If MongoDB is unavailable and the configured fallback is enabled, the application may use an in-memory MongoDB instance. Data in this instance is temporary and will not survive its shutdown.

### Frontend — `client/.env`

Create a `.env` file inside the `client` directory.

```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

Make sure the API URL matches the backend server address.

## Email OTP Configuration

To send OTPs to real email inboxes, configure SMTP credentials in `server/.env`.

For Gmail:

1. Open your Google Account settings.
2. Enable two-step verification.
3. Generate an App Password, if available for your account.
4. Set your Gmail address in `SMTP_USER`.
5. Set the generated App Password in `SMTP_PASS`.

Example:

```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Neosoft Auth App" <your_email@gmail.com>
```

The application must have valid SMTP configuration to send real email OTPs. A development mock, if implemented, is for local testing only and does not deliver an email.

## SMS OTP Configuration

To send OTPs to real mobile numbers, configure your Twilio credentials:

```ini
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

Use valid Twilio credentials and a sender number supported by your account. Check your Twilio account configuration and messaging restrictions if SMS delivery fails.

If the required provider credentials are missing, the application should report a delivery configuration error rather than treating the OTP as successfully delivered.

## Running the Application

Start the backend and frontend in separate terminal windows.

### 1. Start the backend

From the project root:

```bash
npm.cmd --prefix server run dev
```

On macOS or Linux:

```bash
npm --prefix server run dev
```

The backend should be available at:

`http://localhost:5000`

Confirm that the `dev` script exists in `server/package.json`. If it does not, use the script configured in that file.

### 2. Start the frontend

Open a second terminal and run:

```bash
npm.cmd --prefix client run dev
```

On macOS or Linux:

```bash
npm --prefix client run dev
```

The frontend should be available at:

`http://localhost:5173`

Open the frontend URL in your browser to register a new user and test the authentication flow.

## API Endpoints

All authentication endpoints use the `/api/auth` base path.

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Validate registration details and send OTP | Not required |
| POST | `/api/auth/register/verify-otp` | Verify registration OTP and create the user | Not required |
| POST | `/api/auth/login/send-otp` | Send a login OTP | Not required |
| POST | `/api/auth/login/verify-otp` | Verify login OTP and return a JWT | Not required |
| POST | `/api/auth/resend-otp` | Request another OTP subject to cooldown rules | Not required |
| GET | `/api/auth/me` | Retrieve the authenticated user's profile | JWT required |
| POST | `/api/auth/logout` | Handle logout | JWT required, if enforced by the route |
| GET | `/api/health` | Check backend health | Not required |

Protected endpoints require a valid access token in the request header:

```http
Authorization: Bearer <jwt-token>
```

The exact request body, response format, and status codes depend on the implementation in `authRoutes.js` and `authController.js`.

## Testing

The backend includes a test script at `server/test-auth-flow.js`.

Run it from the project root:

```bash
node server/test-auth-flow.js
```

The test suite is intended to cover the main authentication scenarios:

1. Backend health check
2. Validation of required fields
3. Rejection of weak passwords
4. Registration OTP generation and dispatch
5. Prevention of user creation before OTP verification
6. Rejection of an incorrect OTP
7. Successful OTP verification and user creation
8. Duplicate email and mobile number checks
9. Authenticated profile retrieval
10. Rejection of unauthenticated profile requests
11. Login OTP delivery to a mobile number
12. Successful OTP-based login
13. Logout handling

Run the tests with the required database and environment configuration. Actual provider delivery tests require valid email or SMS credentials.

The list above describes the intended test coverage; confirm that each test passes before reporting the suite as fully successful.

## Troubleshooting

**Backend does not start**

- Check that the required dependencies are installed.
- Verify the `dev` script in `server/package.json`.
- Check whether port `5000` is already in use.
- Review the terminal output for database connection or environment errors.

**Frontend cannot reach the backend**

- Confirm that the backend is running.
- Check `VITE_API_BASE_URL` in `client/.env`.
- Verify the CORS configuration and `CLIENT_URL` value.
- Restart the Vite development server after changing environment variables.

**OTP email is not received**

- Check the SMTP host, port, username, and App Password.
- Check the server logs for delivery errors.
- Check the spam folder and email provider restrictions.

**SMS OTP is not received**

- Verify the Twilio credentials and sender number.
- Check the destination number format and Twilio messaging permissions.
- Review the backend logs for provider errors.

**Login fails after entering the correct OTP**

- Check whether the OTP has expired or the attempt limit has been reached.
- Verify that the frontend sends the expected request body.
- Check the backend response and JWT configuration.
- Confirm that the protected API receives the token in the expected header.

## Security Notes

- Do not commit `.env` files or real credentials to GitHub.
- Keep `.env.example` limited to placeholder values.
- Use separate, securely generated secrets for JWT signing and OTP hashing.
- Use HTTPS in production.
- Keep dependencies updated and review authentication-related changes carefully.
- Apply rate limits and appropriate validation to all authentication endpoints.
- Ensure production error responses do not expose OTPs, passwords, tokens, or internal stack traces.
- Configure production-grade database backups and access controls.
- Review token expiry, revocation, and logout behavior before deployment.

## License

ISC
