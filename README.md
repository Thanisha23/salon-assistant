# StyleDesk AI

**StyleDesk AI** is an intelligent salon assistant platform that automates customer support using an AI-powered agent and enables human supervisors to manage complex inquiries through a dedicated dashboard.

## 🧠 Overview

StyleDesk AI consists of three main components:

1. **Python AI Agent**  
   Handles incoming customer questions using a knowledge base and escalates unresolved queries.

2. **Express/Node.js Backend**  
   Manages help requests, stores knowledge base entries, and handles real-time communication.

3. **Next.js Frontend**  
   A supervisor dashboard to monitor, review, and respond to customer inquiries.

## 🚀 Features

- AI agent answers frequently asked salon questions (e.g. pricing, services, hours)
- Unanswered questions are escalated to human supervisors
- Supervisor responses automatically enrich the knowledge base
- Real-time request updates via WebSockets
- Clean and interactive UI with status filters and animations

## ⚙️ Setup Instructions

### 📦 Prerequisites

- **Node.js** 
- **Python** 
- **PostgreSQL** 
- **pnpm** (recommended package manager)

---

```bash
# Clone the repository
git clone https://github.com/Thanisha23/salon-assistant.git

# Navigate to project directory
cd salon-assistant
```
### 🔧 Backend Setup

```bash
cd backend

pnpm install

touch .env
# DATABASE_URL="postgresql://username:password@localhost:5432/stylesdesk"

pnpx prisma migrate dev

pnpm run dev
```

### 🔧 AI Agent Setup

```bash
cd ai-agent

touch config.py
#add the following variables to config.py
HOST = "your-livekit-host"      
API_KEY = "your-api-key"        
API_SECRET = "your-api-secret" 
ROOM_NAME = "salon"            

# Create virtual environment
python -m venv venv
source venv/bin/activate 

pip install websockets requests livekit

# IMPORTANT: Start components in this specific order

# 1. First, start the WebSocket server for communication
python ws_server.py
# (Keep this running in a terminal)

# 2. In a new terminal, start the AI agent
source venv/bin/activate 
python livekit_agent.py

# 3. Optional: In a third terminal, run the test client
source venv/bin/activate 
python livekit_client.py
```

### 🔧 Frontend Setup

```bash
cd frontend

pnpm install

pnpm run dev
```
### Project Structure

```bash

styledesk-ai/
│
├── ai-agent/ 
├── backend/  
└── frontend/ 
```
<div align="center"><strong>Thank you!</strong></div>

