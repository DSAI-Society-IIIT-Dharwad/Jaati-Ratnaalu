"""
News Fetcher using Google Custom Search API and newspaper3k
Fetches article URLs from Google, extracts text using newspaper3k
"""
import os
import json
import requests
from datetime import datetime
from typing import List, Dict
from newspaper import Article
from pymongo import MongoClient

# Google Custom Search API configuration
GOOGLE_CSE_API_KEY = os.getenv("GOOGLE_CSE_API_KEY", "")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID", "")

def search_news_articles(query: str, num_results: int = 10) -> List[Dict]:
    """
    Search for news articles using Google Custom Search API
    Returns list of articles with URL and basic metadata
    """
    if not GOOGLE_CSE_API_KEY or not GOOGLE_CSE_ID:
        print("Warning: Google CSE API credentials not set")
        print("Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID environment variables")
        return []
    
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": GOOGLE_CSE_API_KEY,
        "cx": GOOGLE_CSE_ID,
        "q": query,
        "num": min(num_results, 10),  # API limit is 10 per request
        "dateRestrict": "d",  # Past day only
        "safe": "active"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        articles = []
        for item in data.get("items", []):
            articles.append({
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "source": item.get("displayLink", "")
            })
        
        print(f"Found {len(articles)} articles for query: {query}")
        return articles
        
    except Exception as e:
        print(f"Error searching articles: {e}")
        return []


def extract_article_text(article_dict: Dict) -> Dict:
    """
    Extract full article text using newspaper3k
    Returns article with extracted content
    """
    article = Article(article_dict["url"])
    
    try:
        # Download and parse article
        article.download()
        article.parse()
        
        return {
            "title": article_dict["title"],
            "url": article_dict["url"],
            "source": article_dict["source"],
            "text": article.text,
            "authors": article.authors,
            "publish_date": article.publish_date.isoformat() if article.publish_date else None,
            "summary": article.summary if article.summary else article_dict.get("snippet", ""),
            "keywords": article.keywords,
            "top_image": article.top_image,
            "extracted_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        print(f"Error extracting article from {article_dict['url']}: {e}")
        # Return basic info if extraction fails
        return {
            "title": article_dict["title"],
            "url": article_dict["url"],
            "source": article_dict["source"],
            "text": article_dict.get("snippet", ""),
            "authors": [],
            "publish_date": None,
            "summary": article_dict.get("snippet", ""),
            "keywords": [],
            "top_image": "",
            "extracted_at": datetime.utcnow().isoformat(),
            "extraction_error": str(e)
        }


def fetch_and_extract_news(query: str, num_articles: int = 10) -> List[Dict]:
    """
    Complete pipeline: Search articles and extract text
    """
    print(f"🔍 Searching for news articles: '{query}'")
    
    # Step 1: Search for articles
    articles = search_news_articles(query, num_articles)
    
    if not articles:
        print("No articles found")
        return []
    
    # Step 2: Extract text from each article
    print(f"📄 Extracting text from {len(articles)} articles...")
    extracted_articles = []
    
    for i, article in enumerate(articles):
        print(f"   Extracting {i+1}/{len(articles)}: {article['title'][:50]}...")
        extracted = extract_article_text(article)
        extracted_articles.append(extracted)
    
    return extracted_articles


def store_articles_in_mongodb(articles: List[Dict], mongo_uri: str, database: str = "trenddb", collection: str = "news_articles"):
    """
    Store extracted articles in MongoDB
    """
    if not mongo_uri:
        print("MONGO_URI not set, skipping database storage")
        return
    
    try:
        client = MongoClient(mongo_uri)
        db = client[database]
        col = db[collection]
        
        # Add metadata
        for article in articles:
            article["stored_at"] = datetime.utcnow()
        
        result = col.insert_many(articles)
        print(f"✅ Stored {len(result.inserted_ids)} articles in MongoDB")
        
        client.close()
    except Exception as e:
        print(f"Error storing articles: {e}")


def main():
    """
    Main function to fetch and extract news articles
    Usage: python news_fetcher.py "query string"
    """
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python news_fetcher.py 'query string' [num_articles]")
        sys.exit(1)
    
    query = sys.argv[1]
    num_articles = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    # Fetch and extract
    articles = fetch_and_extract_news(query, num_articles)
    
    if not articles:
        print("No articles extracted")
        sys.exit(1)
    
    # Store in MongoDB if configured
    mongo_uri = os.getenv("MONGO_URI", "")
    if mongo_uri:
        store_articles_in_mongodb(articles, mongo_uri)
    
    # Print results
    print(f"\n{'='*60}")
    print(f"✅ Extracted {len(articles)} articles for: {query}")
    print(f"{'='*60}\n")
    
    for i, article in enumerate(articles[:3], 1):  # Show first 3
        print(f"{i}. {article['title']}")
        print(f"   Source: {article['source']}")
        print(f"   Text length: {len(article['text'])} chars")
        print(f"   URL: {article['url']}\n")
    
    # Output JSON for integration with other scripts
    print("\nJSON output:")
    print(json.dumps(articles, indent=2, default=str))


if __name__ == "__main__":
    main()

