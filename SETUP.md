# 🚀 Quick Setup Guide

## Step 1: Install Dependencies

### Node.js (for Next.js dashboard)
```bash
npm install
```

### Python (for analysis script)
```bash
pip install -r requirements.txt
```

**Note:** First time installation may take 5-10 minutes as it downloads ML models.

## Step 2: Set up MongoDB

1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster (free tier M0)
3. Add your IP address to IP Access List
4. Create a database user
5. Get your connection string

## Step 3: Configure Environment

Create a file named `.env.local` in the project root:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

Replace with your actual MongoDB Atlas connection string.

## Step 4: Run the Analysis

```bash
# Windows PowerShell
$env:MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/"
python analyze.py

# Mac/Linux
export MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/"
python analyze.py
```

Expected output:
```
📡 Scraping tweets...
✅ Scraped 200 tweets
🎭 Analyzing sentiment...
✅ Analyzed sentiment for 200 texts
🔍 Detecting topics...
✅ Detected 15 topics
💾 Storing data in MongoDB...
✅ Inserted 200 documents
✅ Analysis complete!
```

## Step 5: Start Dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### "Module not found" errors
- For Python: `pip install -r requirements.txt`
- For Node: `npm install`

### "MONGO_URI not set" error
- Make sure `.env.local` exists in project root
- Restart Next.js dev server after adding .env.local

### Twitter scraping doesn't work
- The script will automatically fall back to sample data
- Check your internet connection
- snscrape might need updates: `pip install --upgrade snscrape`

### Empty dashboard
- Run `python analyze.py` first to populate database
- Check MongoDB Atlas to verify documents were inserted

## Next Steps

- Schedule the Python script to run periodically (hourly, daily)
- Customize the query in `analyze.py` to analyze different topics
- Deploy on Vercel for public access

