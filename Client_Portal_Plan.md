# Client Portal Implementation Plan

## 1. Introduction
This document outlines the plan for implementing a secure and user-friendly Client Portal. The portal will allow clients to securely view their invoices, make payments, download PDF invoices, and track their payment history. It will integrate seamlessly with the existing invoice management system, providing a dedicated interface for clients.

## 2. Features

### For Users (Admins/Company Staff):
-   **Enable Client Portal:** A setting will be available to enable/disable the client portal functionality.
-   **Automatic Account Creation:** Each client record will automatically be associated with a client portal account.
-   **Credential Management:** Ability to send clients their login credentials or an invite link.
-   **Self-Service Password Reset:** Clients will have the ability to reset their own passwords.

### For Clients:
-   **Email Notification:** Clients receive an email with portal access details (invite link or credentials).
-   **Secure Login:** Clients log in using their email and password.
-   **Dashboard View:** A personalized dashboard displaying:
    -   All invoices (categorized by paid, unpaid, overdue).
    -   Total outstanding amount.
    -   Complete payment history.
    -   Account information.
-   **Invoice Details:** Ability to view detailed invoice information.
-   **PDF Download:** Option to download invoices as PDF files.
-   **Online Payments:** Capability to make online payments for outstanding invoices (requires payment gateway integration).
-   **Contact Information Update:** Clients can update their contact details.

## 3. Technical Approach

### 3.1. Separate Client User Type
-   Implement a distinct `ClientUser` model or extend the existing `User` model with a `role` field (e.g., `client`, `admin`). This ensures clear separation of concerns and permissions.
-   **Backend:** Define a new Pydantic schema for client authentication and data.

### 3.2. Portal Routes
-   Establish a dedicated set of routes for the client portal (e.g., `/portal/*` in the frontend, `/api/v1/client-portal/*` in the backend).
-   These routes will handle client-specific requests like fetching invoices, payment history, and profile updates.

### 3.3. Permissions (Data Isolation)
-   Implement robust authorization logic to ensure clients can only access data pertinent to their own account.
-   Each API endpoint for the client portal will include checks to filter data based on the authenticated client's ID.

### 3.4. Client Authentication
-   **Backend:** Utilize existing authentication mechanisms (e.g., JWT) but with a specific scope or role for clients.
-   **Frontend:** Develop a client-specific login page and handle token storage securely.

### 3.5. Secure Links
-   **Password Reset:** Implement a secure, token-based password reset mechanism. When a client requests a reset, a unique, time-limited token is generated, stored, and sent via email.
-   **First Login/Invite:** Similar token-based system for initial client portal access or account activation.

### 3.6. Read-Only Access
-   Clients will have read-only access to invoices and payment records. They will not be able to modify existing invoices or create new ones.
-   The only modification allowed will be for their own contact information via a dedicated profile update section.

## 4. Security Considerations

### 4.1. Data Isolation
-   Strict filtering at the database query level to ensure no client can access another client's data.
-   All API endpoints exposed to the client portal must explicitly filter results by the authenticated client's ID.

### 4.2. Password Reset
-   Use secure, one-time, time-limited tokens for password reset.
-   Enforce strong password policies for client accounts.
-   Implement rate limiting on password reset requests to prevent abuse.

### 4.3. Session Management
-   Implement secure session management, including:
    -   Short session lifetimes for client tokens.
    -   Automatic logout after periods of inactivity.
    -   Ability for clients to revoke sessions (e.g., "log out from all devices").

### 4.4. Email Verification
-   For new client portal accounts, require email verification to ensure legitimate access. This can be part of the initial invite flow.

### 4.5. Audit Log
-   Log significant client portal activities, such as:
    -   Login attempts (success/failure).
    -   Password changes.
    -   Invoice downloads.
    -   Payment initiation.
    -   Profile updates.

## 5. UI/UX Considerations

### 5.1. Branded Portal
-   Allow for easy customization of the portal's appearance (logo, primary colors) to match the company's branding. This might involve configurable CSS variables or a theme setting.

### 5.2. Simple Navigation
-   Clear, intuitive navigation menu with direct links to "My Invoices," "Payment History," and "My Account."
-   Minimize clicks to access essential information.

### 5.3. Mobile Friendly
-   Ensure the client portal is fully responsive and provides an optimal user experience on various devices (desktops, tablets, mobile phones).

### 5.4. Invoice Status
-   Implement clear visual indicators for invoice statuses:
    -   **Paid:** ✅ (e.g., green checkmark)
    -   **Due:** 🕐 (e.g., yellow clock icon)
    -   **Overdue:** ⚠️ (e.g., red warning icon)

### 5.5. Download Button
-   Prominently display a "Download PDF" button on each invoice view and possibly within the invoice list.

### 5.6. Payment Button
-   For unpaid invoices, a clear and prominent "Pay Now" button should be available, leading to the payment gateway.

### 5.7. Help Section
-   Include a dedicated help or FAQ section.
-   Provide clear contact information for support.

## 6. Client Stories

-   As a client, I want to view all my invoices in one place, so I can easily track my financial obligations.
-   As a client, I want to download invoice PDFs without asking, so I can keep my records updated efficiently.
-   As a client, I want to see my payment history, so I can reconcile my payments with your company.
-   As a client, I want to pay invoices online directly, so I can settle my bills conveniently and promptly.

## 7. Phased Implementation Plan

### Phase 1: Backend Setup & Client Model
-   Modify User/Client models to distinguish between admin/internal users and external clients.
-   Implement client registration/creation logic, potentially linking to existing clients.
-   Develop client-specific authentication endpoints.
-   Establish basic permission system for client data access.

### Phase 2: Backend API Endpoints for Client Portal
-   Create API endpoints for clients to:
    -   Fetch their list of invoices.
    -   View a specific invoice detail.
    -   Fetch their payment history.
    -   Update their contact information.
    -   Initiate password reset.

### Phase 3: Frontend Client Portal UI (Core Functionality)
-   Set up dedicated frontend routes for `/portal/login`, `/portal/dashboard`, `/portal/invoices`, `/portal/invoice/:id`, `/portal/payments`, `/portal/profile`.
-   Develop core components for client login, dashboard, invoice listing, and single invoice view.
-   Implement data fetching from the backend for client-specific data.

### Phase 4: Payment Gateway Integration
-   Research and select a payment gateway (if not already integrated).
-   Implement backend payment processing endpoints.
-   Integrate frontend with payment gateway UI for secure transactions.

### Phase 5: Secure Link & Password Reset
-   Implement backend logic for generating and validating password reset tokens.
-   Develop frontend components for password reset request and reset form.
-   Integrate email sending for invite links and password resets.

### Phase 6: UI/UX Enhancements & Mobile Responsiveness
-   Apply branding (logo, colors).
-   Refine navigation and layout for optimal user experience.
-   Ensure full responsiveness across devices.
-   Implement clear visual status indicators for invoices.

### Phase 7: Testing and Deployment
-   Conduct comprehensive unit, integration, and end-to-end testing.
-   Perform security audits.
-   Prepare for deployment.

---
**Next Step:** Create a detailed TODO list based on this plan for step-by-step implementation.

## 8. Deployment Considerations

### 8.1. Environment Variables
Ensure all necessary environment variables are set in your production environment (`.env` file or deployment platform settings). These include:

*   **Backend:**
    *   `DATABASE_URL`: Production database connection string.
    *   `SECRET_KEY`: A strong, unique secret key for JWTs.
    *   `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SERVER`, `MAIL_PORT`, `MAIL_FROM_NAME`: SMTP credentials for sending emails (e.g., password reset).
    *   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`: Production Razorpay API keys.
    *   `RAZORPAY_WEBHOOK_SECRET`: A secure webhook secret for Razorpay webhook validation.
    *   `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`: Production PayPal API credentials.
    *   `PAYPAL_BASE_URL`: For production, this should be `https://api-m.paypal.com`.
    *   `ALLOWED_ORIGINS`: Frontend URL(s) (e.g., `https://your-frontend.com`).
    *   `FRONTEND_PORTAL_URL`: The base URL for the client portal frontend (e.g., `https://your-frontend.com/portal`). This is used for constructing password reset links.

*   **Frontend:**
    *   `REACT_APP_API_BASE_URL`: Base URL of your deployed backend API (e.g., `https://your-backend.com/api`).
    *   `REACT_APP_RAZORPAY_KEY_ID`: Production Razorpay Key ID (if used directly in frontend).
    *   `REACT_APP_PAYPAL_CLIENT_ID`: Production PayPal Client ID (if used directly in frontend or for Smart Buttons).

### 8.2. Database Migrations
Apply pending database migrations to your production database:
```bash
cd backend
alembic upgrade head
```

### 8.3. Backend Deployment
Deploy the FastAPI backend application. This typically involves:
1.  Creating a production-ready environment (e.g., a virtual environment with `gunicorn`).
2.  Installing dependencies (`pip install -r requirements.txt`).
3.  Configuring environment variables.
4.  Running the application with a WSGI server (e.g., `gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`).
5.  Setting up a reverse proxy (e.g., Nginx) if needed, to handle SSL and serve static files.

### 8.4. Frontend Deployment
Deploy the React frontend application. This typically involves:
1.  Building the production bundle:
    ```bash
    cd frontend
    npm install
    npm run build
    ```
2.  Serving the static files from the `build` directory using a web server (e.g., Nginx, Apache) or a static site hosting service (e.g., Vercel, Netlify).

### 8.5. Webhook Configuration
*   **Razorpay Webhook:**
    1.  Go to your Razorpay Dashboard -> Webhooks.
    2.  Add a new webhook.
    3.  Set the URL to your deployed backend webhook endpoint (e.g., `https://your-backend.com/webhooks/razorpay`).
    4.  Configure the secret (`RAZORPAY_WEBHOOK_SECRET`) to match the one in your backend environment variables.
    5.  Select `payment.captured` event and any other relevant events.
*   **PayPal Webhook:** (Optional, if full webhook integration is desired beyond immediate capture responses)
    1.  Go to your PayPal Developer Dashboard -> My Apps & Credentials.
    2.  Select your application.
    3.  Under "Webhook events," add a webhook.
    4.  Set the URL to your deployed backend webhook endpoint (e.g., `https://your-backend.com/webhooks/paypal` - *Note: A PayPal webhook endpoint needs to be implemented in the backend if this is used.*).
    5.  Subscribe to relevant events (e.g., `PAYMENT.CAPTURE.COMPLETED`).

### 8.6. Email Service Configuration
Ensure your configured SMTP server is correctly set up and accessible from your backend deployment environment.

### 8.7. Security Hardening
*   Always use HTTPS for both frontend and backend.
*   Review CORS settings in production to restrict `ALLOWED_ORIGINS` to only your frontend URL(s).
*   Regularly update dependencies.
*   Implement robust logging and monitoring.