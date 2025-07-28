# ritualll - Your Daily YouTube Digest

A minimalist, newspaper-style daily digest of YouTube videos from your subscriptions. Every day at 8 AM (your local time), get a curated, summarized feed of new uploads from your subscribed YouTube channels.

## 🎯 Vision

Build a quiet, editorial experience — calm, simple, finite, static-feeling. No noise, no bloat. The homepage is the product. There is no dashboard, no settings, no interactivity beyond viewing the summaries or clicking to watch the video.

## 🏗 Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth with YouTube scope
- **LLM**: Groq (LLaMA3-8B-Instruct) for summarization
- **APIs**: YouTube Data API + RSS feeds
- **Deployment**: Vercel (free tier)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- A Google Cloud Project with YouTube Data API enabled
- A Supabase project
- A Groq API account

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Groq API
GROQ_API_KEY=your_groq_api_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Setup Instructions

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo-url>
   cd youonlysubs
   npm install
   ```

2. **Set up Supabase database**:
   - Create a new Supabase project
   - Run the SQL commands in `supabase/schema.sql` in your Supabase SQL editor
   - Copy your project URL and anon key to `.env.local`

3. **Configure Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000` to authorized origins
   - Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
   - Copy client ID and secret to `.env.local`

4. **Get YouTube API Key**:
   - In the same Google Cloud project, create an API key
   - Restrict it to YouTube Data API v3
   - Copy to `.env.local`

5. **Get Groq API Key**:
   - Sign up at [Groq](https://groq.com/)
   - Generate an API key
   - Copy to `.env.local`

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 📱 Features

### Current Implementation (Milestones 1-5)

- ✅ **Project Setup**: Next.js 14 with App Router, Tailwind CSS, TypeScript
- ✅ **Authentication**: Google OAuth with YouTube scope
- ✅ **Database**: Supabase with user, subscription, and video tables
- ✅ **Mobile-First UI**: Login and loading screens optimized for mobile
- ✅ **YouTube Integration**: Ready for subscription and video fetching

### Upcoming Features

- 📺 **Subscription Sync**: Fetch and store user's YouTube subscriptions
- 🎥 **Daily Video Collection**: Gather new videos from subscribed channels
- 🤖 **AI Summaries**: Generate concise summaries using Groq LLM
- 📰 **Newspaper Layout**: Clean, editorial-style homepage
- ⏰ **Daily Reset**: Automatic refresh at 8 AM local time
- 🔄 **CRON Jobs**: Automated daily digest generation

## 🏗 Architecture

### Directory Structure

```
youonlysubs/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── login/             # Login page
│   ├── loading/           # Loading/onboarding page
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication helpers
│   ├── youtube.ts        # YouTube API wrapper
│   ├── supabase.ts       # Database client
│   ├── db/               # Database operations
│   └── utils/            # Utility functions
├── types/                 # TypeScript definitions
├── supabase/             # Database schema
└── components/           # React components (future)
```

### Design Principles

- **Mobile-First**: Every component designed for mobile, enhanced for desktop
- **Static Feel**: No hover effects, animations, or unnecessary interactions
- **Editorial Layout**: Clean, newspaper-like presentation
- **Performance**: Optimized for speed and minimal resource usage
- **Modularity**: Files under 200 lines, clear separation of concerns

## 🔒 Security

- Row Level Security (RLS) enabled on all Supabase tables
- HTTP-only cookies for session management
- Environment variables for all sensitive data
- HTTPS enforced in production

## 📈 Scalability

- Designed for 100+ users on Vercel free tier
- Efficient YouTube API usage with RSS feeds
- Optimized database queries with proper indexing
- Serverless architecture for automatic scaling

## 🤝 Contributing

This project follows strict engineering standards:

- **Code Quality**: SOLID and DRY principles
- **Modularity**: Concise, focused files
- **React Best Practices**: Functional components and hooks only
- **TypeScript**: Strict type checking enabled

## 📄 License

MIT License - see LICENSE file for details