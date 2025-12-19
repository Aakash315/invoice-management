# 🚀 Step-by-Step Deployment Guide: Invoice System to Vercel

## 📋 Overview
This guide deploys your full-stack invoice system:
- **Frontend**: React app → Vercel (static hosting)
- **Backend**: FastAPI → Railway (cloud hosting)

## 🔧 Part 1: Prepare Backend for Production

### Step 1: Update Backend Configuration
Create production configuration files:

1. **backend/requirements.txt** (ensure it's complete):
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
email-validator==2.1.0
psycopg2-binary==2.9.9
python-dotenv==1.0.0
```

2. **backend/app/config.py** (update for production):
```python
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./invoice_system.db")
    
    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    allowed_origins: list = [
        "http://localhost:3000",
        "https://your-frontend-domain.vercel.app"
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

3. **backend/.env.example**:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/invoice_system
SECRET_KEY=your-super-secret-jwt-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Step 2: Update Main App Configuration
Update **backend/app/main.py** for production:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base
from app.routers import auth, invoices, clients, payments, dashboard
from app.config import settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Invoice Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

@app.get("/")
async def root():
    return {"message": "Invoice Management System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## 🗄️ Part 2: Deploy Backend to Railway

### Step 3: Create Railway Account & Project
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### Step 4: Configure Railway Environment

1. **Add Environment Variables in Railway Dashboard**:
   ```
   DATABASE_URL=postgresql://postgres:password@host:5432/railway
   SECRET_KEY=your-super-secret-jwt-key
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

2. **Update Database URL in Railway**:
   - Railway provides a PostgreSQL database automatically
   - Copy the DATABASE_URL from Railway dashboard

### Step 5: Deploy Backend
Railway will automatically deploy your FastAPI app. You'll get a URL like:
`https://your-app-name.railway.app`

## ⚛️ Part 3: Deploy Frontend to Vercel

### Step 6: Update Frontend for Production

1. **Create .env.production**:
```env
REACT_APP_API_URL=https://your-app-name.railway.app/api
```

2. **Update API service** (verify **frontend/src/services/api.js**):
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Step 7: Deploy Frontend to Vercel

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? invoice-system-frontend
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. **Configure Project**:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
6. **Environment Variables**:
   - Add `REACT_APP_API_URL` with your Railway backend URL
7. Click "Deploy"

### Step 8: Update CORS in Backend
Add your Vercel domain to allowed origins in **backend/app/config.py**:

```python
allowed_origins: list = [
    "http://localhost:3000",
    "https://your-frontend-domain.vercel.app",
    "https://your-frontend-domain.vercel.app"  # Add without trailing slash
]
```

## 🔄 Part 4: Test Production Deployment

### Step 9: Verify Deployment
1. **Backend**: Visit `https://your-app-name.railway.app/docs` to test API
2. **Frontend**: Visit `https://your-frontend-domain.vercel.app`
3. **Full System Test**:
   - Register a new user
   - Create a client
   - Create an invoice
   - Test PDF download

### Step 10: Custom Domain (Optional)
1. **Backend**: Add custom domain in Railway settings
2. **Frontend**: Add custom domain in Vercel settings
3. Update CORS settings accordingly

## 📝 Summary
- ✅ Backend: FastAPI deployed to Railway
- ✅ Frontend: React app deployed to Vercel  
- ✅ Database: PostgreSQL provided by Railway
- ✅ Production URL: `https://your-app-name.railway.app/api`
- ✅ Frontend URL: `https://your-frontend-domain.vercel.app`

## 🆘 Troubleshooting
- **CORS Errors**: Check allowed_origins in backend config
- **API Connection**: Verify REACT_APP_API_URL environment variable
- **Database Issues**: Check DATABASE_URL and run migrations
- **Build Failures**: Check build logs in Vercel/Railway dashboards
