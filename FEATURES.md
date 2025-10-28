# 🚀 Real-Time Trend Chatbot Features

## ✨ What's New

### 1. **Interactive Chatbot** 💬
- Ask natural language questions about trends
- Get instant insights on sentiment, topics, and trends
- Located on the right side of the dashboard

**Example Questions:**
- "What's the overall sentiment?"
- "Which topics are trending?"
- "How many positive posts are there?"
- "Give me a summary"

### 2. **Real-Time Updates** 🔄
- Dashboard auto-refreshes every 10 seconds
- Live data stream showing latest topics
- Continuous analysis mode (runs every 5 minutes)

### 3. **Enhanced Dashboard**
- **Pie Chart**: Overall sentiment distribution (Positive/Neutral/Negative)
- **Bar Chart**: Topic sentiment breakdown
- **Live Stream**: Real-time topic updates
- **Stats Cards**: Quick metrics at a glance

## 🎯 How to Use

### Setup
```bash
# 1. Install dependencies
npm install
pip install -r requirements.txt

# 2. Set MongoDB URI in .env.local
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/

# 3. Run initial analysis
python analyze.py

# 4. Start dashboard
npm run dev
```

### Real-Time Mode
Run analysis continuously:
```bash
python analyze.py --realtime
```

This will:
- Run analysis every 5 minutes
- Update MongoDB continuously
- Dashboard will show new data automatically

## 📊 Dashboard Components

### Main View
- **Left Panel**: Live sentiment charts
- **Middle Panel**: Live data stream
- **Right Panel**: Chatbot interface

### Chatbot Features
- Answer questions about current trends
- Provide sentiment insights
- Explain topic distribution
- Give summary statistics

## 🔧 Technical Stack

**Backend:**
- Python with BERTopic & Transformers
- MongoDB for data storage
- Next.js API routes for chatbot

**Frontend:**
- Next.js 16 with App Router
- Recharts for visualizations
- Real-time polling (10s intervals)
- TypeScript for type safety

## 💡 Tips for Hackathon

### Quick Demo (2 hours)
1. ✅ Run `python analyze.py` once (populates DB)
2. ✅ Start Next.js server
3. ✅ Show dashboard with charts
4. ✅ Demo chatbot with sample questions

### Production Deploy (3 hours)
1. Deploy Next.js to Vercel
2. Run Python script on Render/Replit/Railway
3. Set up MongoDB Atlas
4. Add custom domain (optional)

## 🎨 Features to Demo

1. **Multi-Chart Dashboard**: Show sentiment pie chart and topic bar chart
2. **Chatbot Interaction**: Ask "What's the sentiment?" or "Which topics are trending?"
3. **Real-Time Updates**: Wait 10 seconds and see data refresh
4. **Live Stream**: Show topics updating with positive/negative counts
5. **Stats Cards**: Highlight total topics and sentiment breakdown

## 🚀 Deployment

### Vercel (Frontend)
```bash
vercel --prod
```

### Python Script (Backend)
Deploy to:
- **Render**: Web service (runs continuously)
- **Replit**: Background script
- **Railway**: Task runner
- **Local**: For development/demos

### Environment Variables
- `MONGO_URI`: MongoDB connection string
- Set in Vercel dashboard for production

## 📱 Next Steps (Optional Enhancements)

- [ ] Add more chat prompts
- [ ] Export data to CSV
- [ ] Filter by date range
- [ ] Compare sentiment over time
- [ ] Add more visualization types
- [ ] WebSocket for instant updates

---

Built with ❤️ for hackathon success! 🏆

