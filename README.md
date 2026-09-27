# CommandFlow AI 🚀

Voice-to-Action Multi-Channel Automation Platform built with React (Vite), Node.js (Express), MongoDB, Groq AI (Llama 3.3 70B), and n8n Orchestration.

---

## 🌟 Features

- **Voice & Text Command Input**: Hands-free voice automation supporting English, Tamil, and Tanglish (Tamil written in Latin script).
- **Multi-Language AI Engine**: Natural language understanding powered by Groq Llama 3.3 70B for intent parsing, recipient resolution, and document content generation.
- **Supported Communication Channels**:
  - 📧 **Gmail**: Formal emails, leave letters, bonafide requests, and PDF document attachments.
  - ✈️ **Telegram**: Automated instant messages, group alerts, and notifications.
- **Automatic PDF Generation**: Generates official formal letters (leave letters, bonafide requests, permission notes) dynamically into downloadable PDF files.
- **No-Approval Automatic Execution**: Pure natural voice-to-action flow without manual confirmation blocks.
- **n8n Workflow Engine Integration**: Webhook-driven orchestration pipeline.
- **Scheduling & Follow-Up Automation**: Delay execution for future times/dates and schedule automatic follow-up reminders.
- **Contact Directory**: Manage saved contacts with preferred communication channels.
- **Activity & History Logs**: End-to-end execution traces stored in MongoDB.

---

## 🏗️ Architecture Flow

```text
                 COMMANDFLOW AI
                       │
                       ▼
                React Frontend
                       │
              Voice / Text Command
                       │
                       ▼
                Node + Express
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Groq AI      MongoDB       n8n
          │                         │
          │              ┌──────────┴──────────┐
          │              │                     │
          │              ▼                     ▼
          │           Gmail                  Telegram
          │              │                     │
          │              └──────────┬──────────┘
          │                         │
          └─────────────────────────┘
                       │
                       ▼
                Automation Status
                       │
                       ▼
                MongoDB Activity Log
                       │
                       ▼
                 React Dashboard
```

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5000
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://127.0.0.1:27017/commandflow_ai

JWT_SECRET=commandflow_ai_super_secret_jwt_key_2026

GROQ_API_KEY=your_groq_api_key_here

N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=n8n_sec_commandflow_2026

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/integrations/gmail/callback

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

---

## 🚀 Setup & Execution Instructions

### 1. Backend Setup & Run

```bash
cd server
npm install
npm run dev
```

### 2. Frontend Setup & Run

```bash
cd client
npm install
npm run dev
```

### 3. n8n Engine Run

```bash
n8n start
```

---

## 📄 API Documentation

- `POST /api/ai/parse`: Parse command text into structured JSON payload.
- `POST /api/automations`: Create and execute voice/text automation.
- `GET /api/automations`: List all user automations.
- `GET /api/contacts`: Retrieve contact list.
- `POST /api/contacts`: Add new contact recipient.
- `GET /api/integrations`: Service connectivity status.
