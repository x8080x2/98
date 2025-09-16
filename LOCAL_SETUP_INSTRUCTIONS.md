# Windows Local Development Setup

This guide shows you how to run your XEN Email Sender frontend locally on Windows while using your Replit server as the backend.

## What You'll Have
- **Frontend**: Running locally on your Windows machine (faster development)
- **Backend**: Running on Replit (always accessible, no setup needed)
- **Data**: All stored on Replit (accessible from anywhere)

## Setup Steps

### 1. Remove Server Folder (Optional)
You can safely delete the `server` folder from your Windows copy since it will only run on Replit:
```
rmdir /s server
```

### 2. Update Your Replit URL
Edit the `.env.local` file and replace the URL with your current Replit URL:
```
VITE_REMOTE_SERVER_URL=https://your-actual-replit-url.replit.dev
```

### 3. Start Local Development
Run the provided batch file:
```
windows-local-dev.bat
```

This will:
- Install dependencies if needed
- Start your frontend on `http://localhost:5173`
- Connect all API calls to your Replit backend

## How It Works

- Your React app runs locally for fast development
- All API calls (`/api/*`) automatically go to your Replit server
- Your data and email configurations stay on Replit
- You get the best of both worlds: local speed + cloud reliability

## When Your Replit Goes to Sleep

If you see connection errors:
1. Go to replit.com
2. Open your XEN project  
3. Click "Run" to wake it up
4. Refresh your local app

## Benefits

✅ **Faster Development**: Local React hot-reload  
✅ **Always Available Backend**: Replit handles server uptime  
✅ **No Local Server Setup**: No need to configure SMTP, databases, etc.  
✅ **Same Features**: Full access to all email sender functionality  
✅ **Shared Data**: Access your leads and configs from anywhere