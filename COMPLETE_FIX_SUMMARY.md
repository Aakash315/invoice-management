All reported issues have been addressed. The application should now be working correctly. Please verify on your end.

**Summary of fixes:**

1.  **Frontend Infinite Loop (Maximum update depth exceeded):**
    *   **Cause:** The `useApi` hook in `frontend/src/hooks/useApi.js` was creating new function references on every render, causing `useEffect` hooks that depended on them (e.g., in `InvoiceView.jsx`) to re-run indefinitely.
    *   **Fix:** Memoized the returned API functions and the `useApi` hook's return object using `useMemo` to ensure stable references across renders.

2.  **Frontend 404 Not Found Errors (Double `/api` prefix):**
    *   **Cause:** The `REACT_APP_API_URL` environment variable in `frontend/.env` already contained the `/api` prefix (e.g., `http://localhost:8000/api`). Several API calls in `InvoiceView.jsx` and `ReminderSettings.jsx` were prepending an additional `/api` (e.g., `/api/reminders/...`), resulting in URLs like `/api/api/reminders/...`, which led to 404s.
    *   **Fix:** Removed the redundant `/api` prefix from all API calls within `InvoiceView.jsx` and `ReminderSettings.jsx` to ensure the correct relative paths were used.

3.  **Backend 500 Internal Server Errors (ResponseValidationError):**
    *   **Cause:** In `backend/app/routers/reminders.py`, `remind_before_due` and `remind_after_due` fields were stored as JSON strings in the database. When retrieved or created/updated, the `ReminderSetting` response model expected them as Python lists, leading to validation errors.
    *   **Fix:** Added `json.loads()` calls in `get_user_reminder_settings`, `create_user_reminder_settings`, and `update_user_reminder_settings` functions within `backend/app/routers/reminders.py` to deserialize these JSON strings back into Python lists before the response was sent.

4.  **Improved Frontend Error Reporting for 400 Bad Request:**
    *   **Cause:** When a `400 Bad Request` occurred (e.g., due to disabled reminders), the frontend's `toast.error` message was generic and didn't convey the specific reason provided by the backend.
    *   **Fix:** Modified `InvoiceView.jsx` to extract and display the detailed error message (`error.response.data.detail`) from the backend response, providing users with actionable feedback.

**Current Status:**

The application is now technically sound regarding the errors reported. The last observed `400 Bad Request` with the message "Reminders are not enabled for this user. Please enable them in the settings." is an intended application behavior and not a bug. To proceed with sending reminders, you need to enable them in the UI settings.