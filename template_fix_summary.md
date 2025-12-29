The invoice view now dynamically updates based on the selected design template.

Here's a summary of the changes:

**Backend:**
- The `InvoiceResponse` schema was updated to include a `template_config` field.
- The `get_invoice` endpoint now fetches the invoice's design template and includes its configuration in the response.

**Frontend:**
- The `InvoiceView` component now uses the `template_config` from the API response to dynamically apply styles and conditionally render elements.
- This allows for customized invoice presentation based on the selected template.
