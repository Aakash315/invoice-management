# Invoice & Billing Management System

A full-stack web application for managing invoices, clients, and payments.

## 🚀 Live Demo

- **Frontend:** https://your-app.vercel.app
- **Backend API:** https://invoice-api.onrender.com

## ✨ Features

- 🔐 User Authentication (JWT)
- 👥 Client Management
- 📄 Invoice Creation & Management
- 💰 Payment Tracking
- 📊 Dashboard with Analytics
- 📱 Responsive Design
- 📥 PDF Invoice Download
- ⚡ High Performance (Async Support)

## 🛠️ Tech Stack

**Frontend:**
- React.js 18
- React Router v6
- Axios
- Tailwind CSS
- Recharts
- Formik & Yup
- jsPDF

**Backend:**
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic (Data Validation)
- Alembic (Database Migrations)
- Uvicorn (ASGI Server)
- Python-Jose (JWT)

## 📋 Installation

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Update DATABASE_URL and other secrets

# Apply database migrations (using Alembic)
alembic upgrade head

# Run server
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Update REACT_APP_API_URL

# Run development server
npm start
```

## 🌐 Deployment

### Backend (Render)

1. Create PostgreSQL database on Render
2. Create Web Service
3. Set environment variables (DATABASE_URL, SECRET_KEY, etc.)
4. Set Build Command: pip install -r requirements.txt
5. Set Start Command: uvicorn main:app --host 0.0.0.0 --port 10000
6. Deploy from GitHub

### Frontend (Vercel/Netlify)

1. Connect GitHub repository
2. Set build commands
3. Configure environment variables
4. Deploy

## 📸 Screenshots

[Add screenshots here]

## 🎯 Learning Outcomes

This project demonstrates:
- ✅ Full-stack development (React + FastAPI)
- ✅ RESTful API design with automatic docs (Swagger UI)
- ✅ Modern Python type hinting & Pydantic validation
- ✅ Database design & relationships
- ✅ Authentication & Authorization
- ✅ State management (Context API)
- ✅ Form handling & validation
- ✅ Responsive design
- ✅ PDF generation
- ✅ Cloud deployment

## 👨‍💻 Author

**Aakash**
- Webby Wonder

## 📄 License

MIT License