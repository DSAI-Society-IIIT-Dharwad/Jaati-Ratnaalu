# Complete ML Pipeline with Semantic Search

This document describes the complete implementation of your high-level design for fetching news, running ML analysis, and building a semantic search chatbot.

## 🎯 System Overview

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  • TrendChatbot (Semantic Search Interface)                 │
│  • TopicSearch (Trend Exploration)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Routes (Next.js)                       │
│  • /api/chat - Chat interface                                │
│  • /api/semantic-search - Semantic search                    │
│  • /api/live-search - Real-time trends                       │
│  • /api/all-trends - Get all trends                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Python ML Pipeline                        │
│  • news_fetcher.py - Google Search + newspaper3k             │
│  • analyze.py - BERTopic + Sentiment Analysis                │
│  • semantic_search.py - Semantic search with embeddings      │
│  • fetch_trends.py - Trend fetching                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                            │
│  • posts - Analyzed posts with embeddings                    │
│  • news_articles - Extracted news articles                   │
│  • live_trends - Real-time trends                            │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Components

### 1. News Fetching (`news_fetcher.py`)

**What it does:**
- Uses Google Custom Search JSON API to find news URLs
- Extracts full article text using newspaper3k
- Stores articles in MongoDB

**Usage:**
```bash
# Fetch news articles for a query
python news_fetcher.py "artificial intelligence" 10

# Or integrate with other scripts
python news_fetcher.py "climate change" 20
```

**Requirements:**
- `GOOGLE_CSE_API_KEY` - Get from [Google Cloud Console](https://console.cloud.google.com/)
- `GOOGLE_CSE_ID` - Your Custom Search Engine ID
- `MONGO_URI` - MongoDB connection string

### 2. ML Analysis (`analyze.py`)

**What it does:**
- Scrapes/fetches data (Twitter, Reddit, or sample data)
- Detects topics using BERTopic
- Performs sentiment analysis using RoBERTa
- Stores documents + metadata in MongoDB

**Usage:**
```bash
# One-time analysis
python analyze.py

# Continuous real-time analysis (every 5 minutes)
python analyze.py --realtime
```

**Features:**
- GPU acceleration (automatically uses CUDA if available)
- Topic detection with automatic number of topics
- Sentiment analysis (POSITIVE/NEGATIVE/NEUTRAL)
- MongoDB storage with full metadata

### 3. Semantic Search (`semantic_search.py`)

**What it does:**
- Uses sentence-transformers to compute embeddings
- Performs cosine similarity search
- Returns most relevant documents with scores
- Analyzes sentiment distribution

**Usage:**
```bash
# Search for similar documents
python semantic_search.py "AI ethics" 5

# With more results
python semantic_search.py "climate change" 10
```

**How it works:**
1. Query is converted to embedding using `all-MiniLM-L6-v2`
2. All documents in MongoDB are embedded
3. Cosine similarity is calculated between query and all documents
4. Top N results with minimum similarity score are returned

### 4. Chatbot Integration

**Frontend Component:** `app/components/TrendChatbot.tsx`

**API Routes:**
- `app/api/chat/route.ts` - Main chat interface
- `app/api/semantic-search/route.ts` - Semantic search API
- `app/api/live-search/route.ts` - Live trend fetching

**Features:**
- Natural language chat interface
- Automatic semantic search on relevant queries
- Real-time trend fetching
- Sentiment analysis and topic extraction
- Source links and citation

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```bash
# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Google Custom Search (for news_fetcher.py)
GOOGLE_CSE_API_KEY=your_api_key
GOOGLE_CSE_ID=your_search_engine_id

# Optional: For additional features
GOOGLE_CLOUD_API_KEY=your_cloud_api_key
```

### 3. Get Google Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Custom Search JSON API"
4. Create credentials (API Key)
5. Go to [Google Programmable Search](https://programmablesearchengine.google.com/)
6. Create a new search engine
7. Set to "Search the entire web"
8. Copy your Search Engine ID
9. Set `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` in `.env.local`

### 4. Run the Complete Pipeline

#### Step 1: Fetch News Articles
```bash
python news_fetcher.py "AI machine learning" 20
```

#### Step 2: Run ML Analysis
```bash
python analyze.py
```

#### Step 3: Test Semantic Search
```bash
python semantic_search.py "artificial intelligence" 5
```

#### Step 4: Start the Web App
```bash
npm run dev
```

## 🎨 How to Use the System

### Scenario 1: Analyzing News Articles

1. **Fetch news:**
   ```bash
   python news_fetcher.py "renewable energy" 10
   ```

2. **Run analysis:**
   ```bash
   python analyze.py
   ```

3. **Search in chatbot:**
   - Ask: "What are people saying about renewable energy?"
   - The system will perform semantic search and return relevant posts with sentiment

### Scenario 2: Real-Time Trend Monitoring

1. **Start continuous analysis:**
   ```bash
   python analyze.py --realtime
   ```

2. **Ask in chatbot:**
   - "What's trending?"
   - "Show me sentiment about AI"
   - "What are the latest topics?"

### Scenario 3: Semantic Search

The chatbot automatically detects when a query needs semantic search:

- "What do people think about climate change?"
- "Show me posts about healthcare"
- "Find discussions on AI ethics"

The system will:
1. Extract keywords from your query
2. Compute query embedding
3. Search MongoDB using cosine similarity
4. Return most relevant results with scores
5. Analyze sentiment distribution
6. Provide source links

## 🔧 Technical Details

### ML Models Used

1. **BERTopic** (`bertopic`)
   - Topic detection
   - Automatic number of topics
   - GPU accelerated

2. **Sentence Transformers** (`all-MiniLM-L6-v2`)
   - Document embeddings
   - Semantic search
   - Lightweight and fast

3. **RoBERTa** (`cardiffnlp/twitter-roberta-base-sentiment-latest`)
   - Sentiment analysis
   - Tweet-specific training
   - Three labels: POSITIVE, NEGATIVE, NEUTRAL

### Database Schema

#### Collection: `posts`
```json
{
  "text": "Article or post text",
  "topic": 0,
  "topic_name": "AI Ethics",
  "sentiment": "POSITIVE",
  "score": 0.95,
  "url": "https://...",
  "timestamp": "2025-01-27T..."
}
```

#### Collection: `news_articles`
```json
{
  "title": "Article title",
  "url": "https://...",
  "source": "Domain",
  "text": "Full article text",
  "authors": ["Author 1"],
  "publish_date": "2025-01-27",
  "summary": "Article summary",
  "keywords": ["keyword1", "keyword2"],
  "top_image": "https://...",
  "extracted_at": "2025-01-27T..."
}
```

## 🎯 Key Features

✅ **Google Custom Search API** - Real news discovery  
✅ **newspaper3k** - Fast article extraction  
✅ **Sentence Embeddings** - Semantic understanding  
✅ **BERTopic** - Automatic topic detection  
✅ **Sentiment Analysis** - POSITIVE/NEGATIVE/NEUTRAL  
✅ **Cosine Similarity** - Semantic search  
✅ **MongoDB Storage** - Persistent data  
✅ **Real-time Analysis** - Continuous monitoring  
✅ **Chatbot UI** - Interactive interface  
✅ **Source Citations** - Verifiable results  

## 📊 Example Workflow

```python
# 1. Fetch news
articles = fetch_and_extract_news("AI safety")

# 2. Analyze sentiment
sentiments = analyze_sentiment(articles)

# 3. Detect topics
topics, model = detect_topics(articles)

# 4. Store in MongoDB
store_in_mongodb(articles)

# 5. Search semantically
results = search_similar_documents("AI safety concerns", mongo_uri)
```

## 🐛 Troubleshooting

### Issue: Google Custom Search returns no results
- Check your API key is correct
- Verify your Search Engine ID
- Ensure search engine is set to "Search the entire web"

### Issue: newspaper3k extraction fails
- Some websites block scraping
- Try different URLs
- Check network connectivity

### Issue: GPU not available
- PyTorch will automatically use CPU
- Performance will be slower but works fine

### Issue: Semantic search returns empty results
- Run `analyze.py` first to populate database
- Check `MIN_SCORE` threshold (default 0.3)
- Ensure MongoDB has documents

## 📝 Next Steps

1. **Enhanced Embeddings:** Store embeddings in MongoDB for faster search
2. **Real-time Updates:** Auto-refresh on new articles
3. **Advanced Sentiment:** Multi-class sentiment (joy, fear, anger, etc.)
4. **Topic Summarization:** Generate summaries for each topic
5. **Multi-language Support:** Extend beyond English

## 🔗 Resources

- [Google Custom Search API](https://developers.google.com/custom-search/v1/overview)
- [newspaper3k Documentation](https://newspaper.readthedocs.io/)
- [BERTopic Documentation](https://maartengr.github.io/BERTopic/)
- [Sentence Transformers](https://www.sbert.net/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)


