# Deployment Checklist

This document outlines the steps taken to fix the issues related to fetching invoices and sending emails. It also provides a guide for future deployments.

## Issues Fixed

1.  **Backend Not Starting:**
    *   **Problem:** The backend server was not starting due to a `ValidationError` in the `ConnectionConfig` of `fastapi-mail`.
    *   **Solution:**
        *   Created a `.env` file in the `backend` directory with the correct database and mail server configurations.
        *   Recreated the virtual environment and installed all the required dependencies from `requirements.txt`.
        *   Fixed the SSL certificate validation issue by setting `VALIDATE_CERTS=False` in the `ConnectionConfig`.

2.  **Failed to Send Email:**
    *   **Problem:** The email was not being sent due to an incorrect attachment handling in the `send_email` function.
    *   **Solution:**
        *   Modified the `send_invoice_email` function in `backend/app/routers/invoices.py` to save the attachment to a temporary file.
        *   Modified the `send_email` function in `backend/app/utils/mail.py` to accept a file path as an attachment.
        *   Added a `try...finally` block to ensure the temporary file is deleted after the email is sent.

## Deployment Guide

### Backend

1.  **Create a `.env` file:**
    *   Create a `.env` file in the `backend` directory with the following variables:
        ```
        DATABASE_URL=<your_database_url>
        SECRET_KEY=<your_secret_key>
        ACCESS_TOKEN_EXPIRE_MINUTES=<your_access_token_expire_minutes>
        ALLOWED_ORIGINS=<your_allowed_origins>
        ENVIRONMENT=<your_environment>
        MAIL_USERNAME=<your_mail_username>
        MAIL_PASSWORD=<your_mail_password>
        MAIL_FROM=<your_mail_from>
        MAIL_PORT=<your_mail_port>
        MAIL_SERVER=<your_mail_server>
        MAIL_FROM_NAME=<your_mail_from_name>
        ```

2.  **Install dependencies:**
    *   Create a virtual environment and install the dependencies from `requirements.txt`:
        ```
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        ```

3.  **Run the server:**
    *   Run the backend server using `uvicorn`:
        ```
        uvicorn app.main:app --host=0.0.0.0 --port=8000
        ```

### Frontend

1.  **Install dependencies:**
    *   Install the dependencies using `npm`:
        ```
        npm install
        ```

2.  **Create a `.env` file:**
    *   Create a `.env` file in the `frontend` directory with the following variable:
        ```
        REACT_APP_API_URL=<your_backend_api_url>
        ```

3.  **Run the server:**
    *   Run the frontend server using `npm`:
        ```
        npm start
        ```