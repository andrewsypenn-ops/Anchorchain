# Anchorchain — Deploy Guide

This is your daily ops task tracker, ready to deploy to Vercel.

## How to publish (one time, ~15 min)

### Step 1 — Make a GitHub account
Go to https://github.com/signup and sign up (free).

### Step 2 — Make a Vercel account
Go to https://vercel.com/signup and click "Continue with GitHub".

### Step 3 — Upload this project to GitHub
1. Go to https://github.com/new
2. Name it "anchorchain", click "Create repository"
3. On the next page, click "uploading an existing file"
4. Drag ALL the files/folders from this unzipped folder into the upload box
   (package.json, vite.config.js, index.html, and the src folder)
5. Click "Commit changes"

### Step 4 — Deploy on Vercel
1. Go to https://vercel.com/new
2. Find your "anchorchain" repo, click "Import"
3. Leave all settings as default (Vercel auto-detects Vite)
4. Click "Deploy"
5. Wait ~1 minute — you'll get a live URL like anchorchain.vercel.app

### Step 5 — Share it
Send that URL to anyone. It works on phones and computers.

## Notes
- Right now data saves per-device (in the browser). 
- To make the whole team share ONE live board with logins, the next step is adding Supabase.
- The Google Sheets sync (New Patients card) will work once this is live on Vercel.

## To run it on your own computer first (optional)
```
npm install
npm run dev
```
