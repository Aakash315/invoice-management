To address the persistent "Method Not Allowed" error during client login, we have temporarily modified both the backend and frontend client login logic to use a simple JSON body instead of `OAuth2PasswordRequestForm`. This is a debugging step to isolate the issue.

Please follow these steps carefully:

1.  **Stop your frontend development server completely.**
    *   Go to the terminal window where `npm start` is running and press `Ctrl+C` to stop the server.

2.  **Stop your backend server.**
    *   Go to the terminal window where `uvicorn` is running and press `Ctrl+C` to stop the server.

3.  **Perform a full clean of your frontend project's build artifacts and cache:**
    *   Open your terminal (ensure you are in the `/Users/sozoadmin/Aakash/invoice-management` directory, then navigate to `frontend`).
    *   Execute these commands:
        ```bash
        cd frontend
        rm -rf node_modules build .cache
        npm cache clean --force
        npm install
        ```
    *   These commands will remove all old installed packages, build output, and cached data, ensuring a fresh start.

4.  **Clear Your Browser's Cache and Site Data:**
    *   This is **crucial**. Your browser often aggressively caches JavaScript files.
    *   **Option A (Recommended):** Open your browser's Developer Tools (usually by pressing `F12` or right-clicking on the page and selecting "Inspect").
        *   Go to the "Application" tab.
        *   On the left sidebar, find "Clear storage" (under "Application").
        *   Ensure "Cache storage" and "IndexedDB" are checked, then click "Clear site data".
    *   **Option B (Simpler):** Use a brand new Incognito/Private window. This bypasses most caching.

5.  **Restart your backend server:**
    *   Open your terminal and navigate to the `backend` directory:
        ```bash
        cd backend
        uvicorn app.main:app --reload
        ```
    *   Observe the output for any errors during startup.

6.  **Restart your frontend development server:**
    *   Open your terminal and navigate to the `frontend` directory:
        ```bash
        cd frontend
        npm start
        ```
    *   Wait for the server to compile and open the browser.

7.  **Access the client portal login page directly:**
    *   Go to `http://localhost:3000/portal/login`.

Now, try logging into the client portal again. Please let me know the *exact* error message or behavior you observe. If it works, we can proceed to revert these temporary debugging changes."