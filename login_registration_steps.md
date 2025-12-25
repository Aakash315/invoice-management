### Steps for User Login and Register:

**1. User Registration (if not already registered):**
   *   Access the frontend at `http://localhost:3000/register`.
   *   Fill out the registration form with desired credentials (e.g., email: `admin@example.com`, password: `adminpassword`).
   *   Click "Register".
   *   You should be redirected to the login page or dashboard.

**2. User Login:**
   *   Access the frontend at `http://localhost:3000/login`.
   *   Enter your registered email and password.
   *   Click "Sign in".
   *   You should be redirected to the main dashboard (`/`).

### Steps for Client Login and Register:

**1. Client Account Creation (via User/Admin portal):**
   *   Log in as an internal user (admin/staff) at `http://localhost:3000/login`.
   *   Navigate to the "Clients" section (usually `/clients`).
   *   Create a new client or edit an existing one.
   *   **Crucially**: When creating/editing, ensure you:
       *   Provide a unique `email` for the client (e.g., `client@example.com`).
       *   Set a `password` for the client (e.g., `clientpassword`).
       *   Enable `is_portal_enabled` for this client.
   *   Save the client changes. Remember the client's email and password.

**2. Client Registration (Self-service via Forgot Password flow - initial setup):**
   *   Currently, there is no direct self-service client registration endpoint. New client accounts are created by internal users.
   *   However, if a client forgets their initial password or was provided a temporary one, they can use the "Forgot Password" flow.
   *   Access the client portal forgot password page at `http://localhost:3000/portal/forgot-password`.
   *   Enter the client's email address (e.g., `client@example.com`) and request a reset link.
   *   Check the email sent to `client@example.com` (this would be your configured SMTP server's logs or inbox).
   *   Click the password reset link in the email, which will take you to `http://localhost:3000/portal/reset-password?token=XYZ`.
   *   Set a new password for the client account.

**3. Client Login:**
   *   Access the client portal login page at `http://localhost:3000/portal/login`.
   *   Enter the client's email and the password (either initial or newly reset).
   *   Click "Sign in".
   *   You should be redirected to the client dashboard (`/portal/dashboard`).