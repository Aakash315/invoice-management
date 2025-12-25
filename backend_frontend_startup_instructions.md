### Backend Server Instructions

The `ModuleNotFoundError: No module named 'app'` when running `uvicorn` indicates that your Python environment isn't configured to find the `app` module within the `backend` directory.

Please ensure you are following these steps:

**1. Navigate to the `backend` directory:**
   ```bash
   cd backend
   ```

**2. Run `uvicorn` from there:**
   ```bash
   uvicorn app.main:app --reload
   ```
   (Alternatively, if you prefer running from the project root, ensure your `PYTHONPATH` is set correctly: `PYTHONPATH=./backend uvicorn backend.app.main:app --reload`)

**Frontend Server Instructions**

Once your backend server is running without errors:

**1. Navigate to the `frontend` directory:**
   ```bash
   cd frontend
   ```

**2. Start the frontend development server:**
   ```bash
   npm start
   ```

After both are running, please refresh your frontend application and try accessing `/api/invoices` and the client portal routes. This should resolve the `ResponseValidationError` and allow you to proceed with manual end-to-end testing.