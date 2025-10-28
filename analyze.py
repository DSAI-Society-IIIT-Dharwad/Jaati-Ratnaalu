"""
Real-time Trend & Sentiment Analysis Script
Scrapes data, analyzes sentiment and topics, stores in MongoDB
"""
import os
import datetime
import time
import json
from typing import List, Dict
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from pymongo import MongoClient

# Try to import snscrape (optional, has compatibility issues with Python 3.12)
sntwitter = None
try:
    import snscrape.modules.twitter as sntwitter
except (ImportError, AttributeError):
    # snscrape has compatibility issues with Python 3.12+
    print("Warning: snscrape not available (Python 3.12+ compatibility issue)")
    print("Using sample data instead")


def scrape_twitter_data(query: str, limit: int = 200) -> List[str]:
    """Scrape tweets from Twitter using snscrape"""
    if sntwitter is None:
        print("Using sample data (snscrape not available)")
        return get_sample_data()
    
    print(f"Scraping tweets with query: {query}")
    data = []
    try:
        for i, tweet in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
            if i >= limit:
                break
            data.append(tweet.rawContent)
            if (i + 1) % 50 == 0:
                print(f"   Scraped {i + 1} tweets...")
        print(f"Scraped {len(data)} tweets")
        return data
    except Exception as e:
        print(f"Error scraping: {e}")
        print("Falling back to sample data...")
        return get_sample_data()


def get_sample_data() -> List[str]:
    """Generate sample AI/ML related data for testing"""
    return [
        "AI is revolutionizing healthcare with predictive analytics and diagnostics!",
        "Machine learning will transform every industry in the next decade.",
        "I'm worried about AI taking over jobs and causing unemployment.",
        "Artificial intelligence is the future of technology and innovation.",
        "AI ethics need to be discussed more seriously by policymakers.",
        "Love how AI helps with daily tasks and productivity tools!",
        "Concerned about AI privacy issues and data security.",
        "Neural networks and deep learning are fascinating technologies.",
        "AI automation scares me but also excites me for possibilities.",
        "GPT models are amazing for productivity and creative tasks.",
        "The potential of AGI is both exciting and terrifying.",
        "AI in education could personalize learning for every student.",
        "Worried about bias in AI algorithms affecting minority groups.",
        "Self-driving cars powered by AI will make roads safer.",
        "AI-generated art is beautiful but raises copyright questions.",
        "Quantum computing combined with AI will solve complex problems.",
        "AI chatbots are getting too realistic and it's concerning.",
        "Machine learning helps doctors diagnose diseases faster.",
        "AI voice assistants make life so much more convenient.",
        "The singularity might be closer than we think.",
        "AI can help fight climate change through optimization.",
        "Deepfakes created by AI are becoming a serious problem.",
        "AI-powered recommendation systems know us too well.",
        "Robots with AI could help elderly people at home.",
        "AI safety should be prioritized over AI capabilities.",
        "Large language models like GPT are changing everything.",
        "AI in finance can detect fraud better than humans.",
        "The AI arms race between countries is concerning.",
        "AI tools for coding have improved my workflow dramatically.",
        "Human-AI collaboration is the future of work.",
        "AI can process medical images faster than radiologists.",
        "The black box problem in AI needs more research.",
        "AI is being used in warfare and that's dangerous.",
        "Personalized AI tutors could democratize education worldwide.",
        "AI-generated content is flooding the internet.",
        "The GPU shortage is caused by AI training demands.",
        "AI can help translate languages in real-time.",
        "I'm excited about AI discovering new drugs and treatments.",
        "AI moderation on social platforms is too aggressive sometimes.",
        "Edge AI enables privacy-preserving device processing.",
        "AI helping farmers optimize crop yields is amazing.",
        "Algorithmic trading AI can destabilize markets.",
        "AI for mental health support shows promising results.",
        "The carbon footprint of training AI models is massive.",
        "AI companions for lonely people could be beneficial.",
        "Deep learning breakthroughs happen almost daily now.",
        "AI-generated music sounds surprisingly creative!",
        "Facial recognition AI raises serious privacy concerns.",
        "AI could solve protein folding problems for biology.",
        "Open source AI models are democratizing access to technology.",
    ] * 4  # Multiply to get ~200 items


def analyze_sentiment(texts: List[str]) -> List[Dict]:
    """Analyze sentiment using pre-trained BERT model"""
    print("Analyzing sentiment...")
    sentiment_model = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
    sentiments = []
    
    for i, text in enumerate(texts):
        try:
            # Truncate to model's max length
            truncated = text[:512]
            result = sentiment_model(truncated)[0]
            sentiments.append({
                "label": result["label"],
                "score": float(result["score"])
            })
        except Exception as e:
            print(f"   Error analyzing sentiment for text {i}: {e}")
            sentiments.append({"label": "NEUTRAL", "score": 0.5})
    
    print(f"Analyzed sentiment for {len(sentiments)} texts")
    return sentiments


def detect_topics(texts: List[str]) -> tuple:
    """Detect topics using BERTopic"""
    print("Detecting topics...")
    
    # Use lightweight embedding model for speed
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Initialize BERTopic with fewer topics for faster processing
    topic_model = BERTopic(
        embedding_model=embedding_model,
        nr_topics="auto",
        verbose=True
    )
    
    # Fit and transform
    topics, probs = topic_model.fit_transform(texts)
    
    print(f"Detected {len(set(topics))} topics")
    return topics, topic_model


def store_in_mongodb(posts: List[Dict], mongo_uri: str, database: str = "trenddb", collection: str = "posts"):
    """Store analyzed data in MongoDB"""
    print(f"Storing data in MongoDB...")
    
    try:
        client = MongoClient(mongo_uri)
        db = client[database]
        col = db[collection]
        
        # Clear old data (optional, comment out if you want to keep history)
        # col.delete_many({})
        
        # Insert new data
        result = col.insert_many(posts)
        print(f"Inserted {len(result.inserted_ids)} documents")
        
        client.close()
    except Exception as e:
        print(f"Error storing in MongoDB: {e}")
        print("   Make sure MONGO_URI is set correctly")


def main():
    # Configuration
    MONGO_URI = os.getenv("MONGO_URI", "")
    
    if not MONGO_URI:
        print("MONGO_URI not set. Using demo mode.")
        print("   Set MONGO_URI environment variable to connect to MongoDB Atlas")
        MONGO_URI = "mongodb://localhost:27017/"  # Fallback to local
    
    # Step 1: Scrape data
    query = "AI OR artificial intelligence OR machine learning lang:en since:2025-01-01"
    data = scrape_twitter_data(query, limit=200)
    
    if not data:
        print("No data scraped. Exiting.")
        return
    
    # Step 2: Analyze sentiment
    sentiments = analyze_sentiment(data)
    
    # Step 3: Detect topics
    topics, topic_model = detect_topics(data)
    
    # Step 3.5: Get topic names from BERTopic
    topic_names = {}
    try:
        topic_info = topic_model.get_topic_info()
        for idx, row in topic_info.iterrows():
            topic_id = int(row['Topic'])
            topic_name = row['Name']
            # Extract just the key terms (first few words)
            if topic_name and isinstance(topic_name, str):
                # Clean up the name - take first 5 words
                words = topic_name.split()[:5]
                topic_names[topic_id] = " ".join(words)
            else:
                topic_names[topic_id] = f"Topic {topic_id}"
    except Exception as e:
        print(f"Warning: Could not extract topic names: {e}")
        # Fallback to default names
        unique_topics = set(topics)
        for topic_id in unique_topics:
            topic_names[topic_id] = f"Topic {topic_id}"
    
    # Step 4: Prepare documents for MongoDB
    docs = []
    for text, topic, sent in zip(data, topics, sentiments):
        # Map sentiment labels to more readable format
        sentiment_label = sent["label"]
        if sentiment_label == "LABEL_0":  # Negative
            sentiment_label = "NEGATIVE"
        elif sentiment_label == "LABEL_1":  # Neutral
            sentiment_label = "NEUTRAL"
        elif sentiment_label == "LABEL_2":  # Positive
            sentiment_label = "POSITIVE"
        elif "NEGATIVE" in sentiment_label.upper():
            sentiment_label = "NEGATIVE"
        elif "POSITIVE" in sentiment_label.upper():
            sentiment_label = "POSITIVE"
        else:
            sentiment_label = "NEUTRAL"
        
        # Get topic name, default to "Topic X" if not found
        topic_name = topic_names.get(int(topic), f"Topic {topic}")
        
        docs.append({
            "text": text,
            "topic": int(topic),
            "topic_name": topic_name,
            "sentiment": sentiment_label,
            "score": float(sent["score"]),
            "timestamp": datetime.datetime.utcnow()
        })
    
    # Step 5: Store in MongoDB
    if MONGO_URI:
        store_in_mongodb(docs, MONGO_URI)
    
    print("\nAnalysis complete!")
    print(f"   Processed {len(docs)} posts")
    print(f"   Topics: {len(set(topics))}")
    print(f"   Positive: {sum(1 for s in sentiments if 'POSITIVE' in s['label'])}")
    print(f"   Negative: {sum(1 for s in sentiments if 'NEGATIVE' in s['label'])}")
    
    # Optionally print topic information
    if hasattr(topic_model, 'get_topic_info'):
        topic_info = topic_model.get_topic_info()
        print("\nTopic Summary:")
        print(topic_info.head(10).to_string(index=False))


def run_realtime_loop(interval=300):
    """Run analysis continuously in a loop"""
    print("🚀 Starting real-time trend analysis...")
    print(f"⏰ Running every {interval // 60} minutes")
    print("Press Ctrl+C to stop\n")
    
    import signal
    import sys
    
    def signal_handler(sig, frame):
        print("\n\n👋 Stopping real-time analysis...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    iteration = 1
    while True:
        try:
            print(f"\n{'='*60}")
            print(f"🔄 Iteration #{iteration} - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*60}\n")
            
            main()
            
            iteration += 1
            print(f"\n✅ Analysis complete. Next run in {interval // 60} minutes...")
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\n\n👋 Stopping...")
            sys.exit(0)
        except Exception as e:
            print(f"\n❌ Error in loop: {e}")
            print("   Continuing after interval...")
            time.sleep(interval)


if __name__ == "__main__":
    import sys
    
    # Check if continuous mode is requested
    if len(sys.argv) > 1 and sys.argv[1] == "--realtime":
        run_realtime_loop(interval=300)  # Run every 5 minutes
    else:
        main()

