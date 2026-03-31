# AI Woman Chat - Complete Setup Guide

This guide will walk you through setting up the AI Woman chat application from scratch.

## Step 1: Prerequisites

Make sure you have installed:
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

Verify installations:
```bash
node --version
npm --version
git --version
```

## Step 2: Supabase Setup

### Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with email or GitHub

### Create a New Project
1. Click "New Project"
2. Choose a name (e.g., "ai-woman-chat")
3. Set a database password
4. Select a region closest to you
5. Click "Create new project" (this takes ~2 minutes)

### Get Your API Credentials
1. Go to Settings > API
2. Copy your project URL
3. Copy your anon public key
4. Save these somewhere safe

### Create Database Tables
1. In your Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Paste this SQL:

```sql
-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in own conversations" ON messages
  FOR INSERT WITH CHECK (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  ));
```

4. Click "Run"
5. You should see "Success" messages

## Step 3: Project Setup

### Clone the Repository
```bash
git clone https://github.com/shixuka10en/shixuka10en.github.io.git
cd shixuka10en.github.io
```

### Install Dependencies
```bash
npm install
```

This will install:
- React
- Vite
- Supabase client
- React Router
- Lucide Icons
- Tailwind CSS

### Configure Environment Variables
1. Create a file named `.env.local` in the project root
2. Add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace:
- `your-project` with your actual project name
- `your_anon_key_here` with the key you copied earlier

## Step 4: Run the Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

The browser will open automatically. If not, visit `http://localhost:3000`

## Step 5: Test the Application

### Create an Account
1. Click "Create an account"
2. Enter an email and password
3. Click "Sign Up"
4. You should receive a confirmation email from Supabase
5. Confirm your email (check spam if needed)
6. Log in with your credentials

### Start Chatting
1. Click "New Chat"
2. Type a message
3. Click the send button

## Step 6: Connect to AI API (Optional)

To integrate with ChatGPT, Grok, Claude, etc.:

### Using OpenAI API:

1. Get an API key from [openai.com](https://openai.com)
2. Add to `.env.local`:
```
VITE_OPENAI_API_KEY=sk-your-key-here
```

3. Update `src/pages/ChatDashboard.jsx`:
```javascript
const simulateAIResponse = async () => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000
    })
  })
  
  const data = await response.json()
  const aiMessage = {
    id: Date.now(),
    content: data.choices[0].message.content,
    role: 'assistant',
    created_at: new Date()
  }
  setMessages(prev => [...prev, aiMessage])
}
```

## Troubleshooting

### "Cannot find module" error
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Supabase connection fails
- Check your `.env.local` file has correct URL and key
- Verify Supabase project is active
- Check browser console for error details

### Authentication not working
- Confirm email verification in Supabase > Authentication > Users
- Check Row Level Security policies are enabled

## Next Steps

- Customize the UI in `src/components/` and CSS files
- Add more AI models
- Implement file upload
- Add conversation naming/management
- Deploy to Vercel, Netlify, or GitHub Pages

## Support

Check the main README.md for more information and examples.