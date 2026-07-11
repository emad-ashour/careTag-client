---
name: run on IOS
description: The skill runs the current react native application on IOS by pushing local changes, handling first-time repository cloning, managing a local Mac Metro bundler, and triggering a remote build via SSH.
---

# Skill: Run on iOS (Remote Mac Build with Auto-Clone & Local Metro)

## Objective
Automate syncing the local Ubuntu codebase with the remote Mac. The script will detect if the Mac has the repository; if not, it will clone it via SSH and install dependencies. Finally, it will manage its own Metro bundler and launch the iOS simulator.

## Prerequisites
- Local Ubuntu machine must have `sshpass` installed.
- Mac (`192.168.1.45`) must be awake with the iOS simulator running.
- Mac must have SSH keys configured for Git access.

## Command Execution Script

Execute the following bash sequence to perform the skill:

```bash
#!/bin/bash

echo "🚀 [Step 1] Syncing local changes to Git..."
git add .
git commit -m "chore: auto-sync for remote iOS build"
git push

# Dynamically extract the repo URL and project name from the local Ubuntu environment
REPO_URL=$(git config --get remote.origin.url)
PROJECT_NAME=$(basename "$PWD")

echo "🌐 [Step 2] Initiating remote connection to Mac build server..."

# SSH into the Mac and pass the variables
sshpass -p '1234' ssh -o StrictHostKeyChecking=no fhs@192.168.1.45 << EOF
  echo "✅ Connected to Mac successfully!"
  
  # Ensure the projects directory exists
  mkdir -p ~/projects
  
  echo "📂 [Step 3] Checking repository status on Mac..."
  if [ -d "~/projects/$PROJECT_NAME" ]; then
    echo "🔄 Repository found. Pulling latest code..."
    cd ~/projects/$PROJECT_NAME
    git pull
  else
    echo "🌱 First-time setup detected! Cloning repository..."
    cd ~/projects
    git clone $REPO_URL $PROJECT_NAME
    cd $PROJECT_NAME
    
    echo "📦 Installing Node dependencies (this may take a minute)..."
    npm install
    
    echo "🍎 Installing iOS Pods..."
    cd ios && pod install && cd ..
  fi
  
  echo "🧹 [Step 4] Cleaning up old Metro processes on Port 8081..."
  lsof -t -i:8081 | xargs -r kill -9
  
  echo "🚂 [Step 5] Starting fresh Metro bundler in the background..."
  nohup npx react-native start > metro_mac.log 2>&1 &
  sleep 5
  
  echo "🔨 [Step 6] Compiling and launching iOS app..."
  npx react-native run-ios --no-packager
  
  echo "🎉 Remote iOS build triggered successfully! Metro is running in the background."
EOF