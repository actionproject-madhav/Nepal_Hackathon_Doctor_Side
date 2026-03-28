#!/bin/bash

# Start Patient API Server
# This API handles patient profiles, sessions, and clinical notes

echo "🚀 Starting VoiceCanvas Patient API..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."

    # Try to start MongoDB based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mongodb-community 2>/dev/null || mongod --config /usr/local/etc/mongod.conf --fork
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mongodb 2>/dev/null || sudo service mongodb start
    else
        echo "❌ Could not start MongoDB automatically. Please start it manually."
        exit 1
    fi

    sleep 2
fi

# Check if MongoDB is accessible
if mongo --eval "db.version()" > /dev/null 2>&1 || mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  Could not connect to MongoDB. Make sure it's running on localhost:27017"
    echo "   Or update MONGODB_URI in .env to use MongoDB Atlas"
fi

# Check if required Python packages are installed
python3 -c "import pymongo, flask, flask_cors" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing required Python packages..."
    pip3 install pymongo flask flask-cors
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env"
fi

# Start the API
echo ""
echo "🌐 Patient API starting on http://localhost:5002"
echo "📖 API Documentation:"
echo "   GET  /api/patients              - List all patients"
echo "   POST /api/patients              - Create patient"
echo "   GET  /api/patients/:id          - Get patient details"
echo "   GET  /api/patients/:id/sessions - Get patient sessions"
echo "   POST /api/sessions              - Create session"
echo "   GET  /api/dashboard/stats       - Get dashboard stats"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 patient_api.py
