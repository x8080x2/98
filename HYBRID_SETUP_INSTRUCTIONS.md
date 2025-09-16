# Hybrid Setup: Local Data + Remote Email Sending

Perfect! I've created your hybrid setup where:
- ✅ **Local data**: Config files, leads.txt, templates read from your Windows machine
- ✅ **Remote email sending**: Only email processing uses your Replit server

## How It Works

Your frontend now has smart routing:
1. **Data loading** (`/api/config/*`, `/api/original/listFiles`, etc.) → Reads your local Windows files
2. **Email sending** (`/api/emails/send`, `/api/original/sendMail`) → Uses your Replit server

## Setup Steps for Windows

### 1. Copy Your Local Files
Copy your Windows files to these locations in your project:

```
📁 Your Project Root/
  📁 client/
    📁 public/
      📁 config/           ← Copy your Windows config folder here
        📄 smtp.ini
        📄 setup.ini
      📁 files/            ← Copy your Windows files folder here
        📄 leads.txt
        📄 template.html
        📄 sample-template.html
        📁 logo/           ← Copy your logo files here
          📄 L1.png
          📄 logo.png
        📄 (all your other templates)
```

⚠️ **SECURITY WARNING**: This setup copies your SMTP credentials to a browser-accessible location. Only use this for local development on your personal machine. Never deploy this to a public server.

### 2. Windows Copy Commands
Open Command Prompt in your project root and run:

```batch
REM Copy config files (WARNING: Contains SMTP passwords)
copy config\*.* client\public\config\

REM Copy files folder contents
xcopy files\*.* client\public\files\ /E /Y

REM Copy logo files specifically
copy files\logo\*.* client\public\files\logo\

REM Individual files if needed
copy files\leads.txt client\public\files\
copy files\*.html client\public\files\
```

### 3. Start Your Hybrid Setup
Run your local development:
```batch
windows-local-dev.bat
```

## What You'll Get

✅ **Fast local development** - React runs on your Windows machine  
✅ **Your local data** - Reads config, leads, templates from Windows files  
✅ **Cloud email processing** - Sends emails through your Replit server  
✅ **No server maintenance** - Backend stays on Replit, always available  

## Verification

1. **Local data loading**: You should see your leads.txt content and SMTP config load automatically
2. **Remote email sending**: When you click "Start Sending", emails process through Replit
3. **Hybrid logs**: Browser console will show local file reads + remote API calls

## File Sync

Whenever you update your Windows files (leads.txt, templates, config), just re-copy them:
```batch
copy files\leads.txt client\public\files\
copy config\smtp.ini client\public\config\
```

Your local development server will automatically pick up the changes!

## Troubleshooting

- **"Could not load local file"**: Check that files are copied to `client/public/` directories
- **SMTP config not loading**: Verify `smtp.ini` is in `client/public/config/`
- **Templates not showing**: Ensure HTML files are in `client/public/files/`
- **Email sending fails**: Check that your Replit server is running

This gives you the perfect balance: fast local development with reliable cloud email processing!