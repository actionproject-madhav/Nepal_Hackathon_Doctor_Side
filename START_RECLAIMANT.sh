#!/bin/bash

# VoiceCanvas Reclaimant - Quick Start Script

echo "=========================================="
echo "VoiceCanvas Reclaimant - Quick Start"
echo "=========================================="
echo ""

# Check if MongoDB is running
echo "Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB not running. Starting it..."

    # Try to start MongoDB based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mongodb-community 2>/dev/null || echo "❌ Failed to start MongoDB. Install it: brew install mongodb-community"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mongodb 2>/dev/null || echo "❌ Failed to start MongoDB. Install it: sudo apt-get install mongodb"
    fi

    sleep 2

    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB started"
    else
        echo "❌ Could not start MongoDB automatically"
        echo "   Please start it manually:"
        echo "   macOS: brew services start mongodb-community"
        echo "   Linux: sudo systemctl start mongodb"
        exit 1
    fi
else
    echo "✅ MongoDB is running"
fi

echo ""
echo "Starting backend server..."
echo ""

# Check if Python dependencies are installed
cd backend
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Run setup verification
echo "Running setup verification..."
python3 test_setup.py

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "Starting Flask Backend on port 5001..."
    echo "=========================================="
    echo ""
    python3 app.py
else
    echo ""
    echo "❌ Setup verification failed!"
    echo "Please fix the issues above before starting."
    exit 1
fi
