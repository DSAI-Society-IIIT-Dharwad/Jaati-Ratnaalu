# 🔥 Real-time Trend & Sentiment Detection - Hackathon MVP

A 2-3 hour hackathon project that scrapes live data, analyzes sentiment and topics using pre-trained AI models, and displays insights in a beautiful Next.js dashboard.

# Mobile version also available

A kotlin app present in the mobile-version branch.

## ✨ Features

- 📡 Scrapes live Twitter data (or uses sample data)
- 🎭 Sentiment analysis using RoBERTa models
- 🔍 Topic detection using BERTopic
- 💾 Stores results in MongoDB Atlas
- 📊 Beautiful real-time dashboard with Recharts
- 🔄 Auto-refreshes every 10 seconds
- 🔎 **NEW:** Keyword search with semantic similarity
- 💬 **NEW:** Interactive chatbot assistant
- 📈 **NEW:** Trending topic explorer with sentiment breakdown

## 🚀 Quick Start (3 Steps)

### 1️⃣ Set up MongoDB

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) (free tier available)
2. Create a cluster and get your connection string
3. Create a file `.env.local` in the project root:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### 2️⃣ Run Python Analysis Script

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the analysis (set MONGO_URI as environment variable)
# Windows:
set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
python analyze.py

# Mac/Linux:
export MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
python analyze.py
```

This will:
- Scrape 200 tweets about AI
- Analyze sentiment and topics
- Store results in MongoDB

### 3️⃣ Start Next.js Dashboard

```bash
npm install  # If you haven't already
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your dashboard!

## 🎯 New Features

### 🔍 Topic Search
Search for any keyword to find:
- Related trending topics (with semantic similarity)
- Sentiment breakdown per topic
- Example mentions with relevance scores
- Real-time sentiment analysis

### 💬 Chatbot
Ask natural language questions:
- "What's the sentiment on AI?"
- "Which topics are trending?"
- "Show me positive topics"

### 📊 Enhanced Dashboard
- Descriptive topic names (not just "Topic 1")
- Live data stream
- Multi-chart visualization
- Real-time updates

## 📁 Project Structure

```
├── app/
│   ├── api/trends/route.ts    # Next.js API route (fetches from MongoDB)
│   └── page.tsx                # Dashboard UI with charts
├── analyze.py                  # Python script for data scraping & analysis
├── requirements.txt            # Python dependencies
└── package.json               # Node.js dependencies
```

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- Recharts for visualizations
- TypeScript

**Backend Analysis:**
- Python
- snscrape (Twitter scraping)
- BERTopic (topic modeling)
- Transformers (sentiment analysis)
- pymongo (MongoDB)

**Database:**
- MongoDB Atlas

## 🎯 How It Works

1. **Python Script (`analyze.py`)**:
   - Scrapes 200 tweets about AI/ML
   - Analyzes sentiment using `cardiffnlp/twitter-roberta-base-sentiment`
   - Detects topics using BERTopic
   - Stores results in MongoDB

2. **Next.js Dashboard**:
   - Fetches data from MongoDB via API route
   - Displays sentiment distribution (pie chart)
   - Shows topic sentiment analysis (bar chart)
   - Auto-refreshes every 10 seconds

## 🚢 Deploy to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add `MONGO_URI` environment variable in Vercel settings
4. Deploy!

## 💡 Tips

- First run might take a few minutes (downloading ML models)
- If Twitter scraping fails, the script falls back to sample data
- Update the query in `analyze.py` to analyze different topics
- Schedule the Python script to run hourly (cron job, Render, Railway)

## 📊 Next Steps (Optional Enhancements)

- Add time-based filtering
- Implement topic detail view
- Add more data sources (Reddit, news APIs)
- Real-time WebSocket updates
- Export to CSV/PDF

## ⚠️ Troubleshooting

**"MONGO_URI not set" error:**
- Create `.env.local` file with your MongoDB connection string

**Import errors:**
- Run `pip install -r requirements.txt`
- Make sure you have Python 3.8+

**No data showing:**
- Run `python analyze.py` first to populate MongoDB
- Check MongoDB Atlas for inserted documents

---

Built in ~3 hours for hackathon demo 🏆


#Screeenshots

![Dashboard Screenshot](prev)
