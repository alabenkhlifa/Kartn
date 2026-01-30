# Kartn Frontend 🚗💬

AI-powered car recommendation chat interface built with Next.js.

**🌐 Live App:** https://kartn.vercel.app/

## Features
- 💬 Conversational AI chat interface  
- 🚗 Car recommendations for Tunisia market
- 📱 Responsive design (mobile-first)
- ⚡ Real-time chat with typing indicators
- 💰 Cost calculations and import procedures
- 🎨 Modern UI with Tailwind CSS

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Backend:** Supabase Functions
- **AI:** Groq API integration
- **Deployment:** Vercel

## Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
```

## Project Structure
```
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── chat/        # Chat-specific components
│   ├── cars/        # Car listing components
│   └── ui/          # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and constants
└── types/           # TypeScript definitions
```
