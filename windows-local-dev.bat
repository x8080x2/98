@echo off
echo ================================================
echo    XEN Email Sender - Local Development
echo ================================================
echo.

echo 🔧 Starting local frontend development...
echo 📡 Backend server: Replit (remote)
echo 🎨 Frontend: Local development server
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Start the development server for frontend only
echo 🚀 Starting local development server...
echo 💡 Your app will open at: http://localhost:5173
echo 🌐 Backend API calls will go to your Replit server
echo.

REM Use vite directly to start only the frontend
npx vite --host 0.0.0.0 --port 5173

echo.
echo Press any key to exit...
pause > nul