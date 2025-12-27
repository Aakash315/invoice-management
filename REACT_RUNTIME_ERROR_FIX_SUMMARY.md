I have resolved the "Maximum update depth exceeded" error and the associated 404 Not Found error.

Here’s a summary of the changes:

- In `frontend/src/hooks/useApi.js`, I’ve memoized the returned object to prevent the infinite loop that was causing the "Maximum update depth exceeded" error.
- In `frontend/src/components/invoices/InvoiceView.jsx`, I’ve corrected the API endpoint for fetching reminder history, which was causing a 404 error.
- In `frontend/src/components/settings/ReminderSettings.jsx`, I’ve corrected the API endpoints for fetching, creating, and updating reminder settings, which were causing 404 errors.

These changes should resolve the issues you were observing.
