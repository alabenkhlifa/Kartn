# Kartn 🚗

AI-powered car recommendation chat application for the Tunisian market.

## 🌐 Live Application
**Production URL:** https://kartn.vercel.app/

## 🏗️ Architecture
- **Frontend:** Next.js (React, TypeScript, Tailwind CSS)
- **Backend:** Supabase Functions (Edge Functions)
- **Database:** Supabase PostgreSQL
- **AI:** Groq API & HuggingFace models
- **Deployment:** Vercel (Frontend) + Supabase (Backend)

## 📁 Project Structure
```
├── web/           # Next.js frontend application
├── supabase/      # Supabase backend functions and config
└── README.md      # This file
```

## 🚀 Development

### Frontend
```bash
cd web
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`

### Backend (Supabase)
```bash
npx supabase start
npx supabase functions serve chat
```
Backend runs on `http://127.0.0.1:54321`

## 🌍 Deployment
- **Frontend:** Auto-deployed to Vercel on `main` branch push
- **Backend:** Deploy functions with `npx supabase functions deploy chat`

---
*Built with ❤️ for the Tunisian automotive market*