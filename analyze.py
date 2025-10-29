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
import torch

# Check for GPU availability
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device} ({'GPU' if torch.cuda.is_available() else 'CPU'})")

# Try to import snscrape (optional, has compatibility issues with Python 3.12)
sntwitter = None
try:
    import snscrape.modules.twitter as sntwitter
except (ImportError, AttributeError):
    # snscrape has compatibility issues with Python 3.12+
    print("Warning: snscrape not available (Python 3.12+ compatibility issue)")
    print("Using sample data instead")


def scrape_twitter_data(queries: List[str], limit: int = 500) -> List[str]:
    """Scrape tweets from Twitter using snscrape with multiple queries"""
    if sntwitter is None:
        print("Using expanded sample data (snscrape not available)")
        return get_expanded_sample_data()
    
    print(f"Scraping {len(queries)} different topics with {limit} posts each...")
    all_data = []
    
    for query in queries:
        print(f"\n📡 Query: {query}")
        data = []
        try:
            for i, tweet in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
                if i >= limit:
                    break
                data.append(tweet.rawContent)
                if (i + 1) % 50 == 0:
                    print(f"   Scraped {i + 1} tweets...")
            print(f"   ✅ Got {len(data)} tweets from this query")
            all_data.extend(data)
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"\n🎯 Total scraped: {len(all_data)} tweets across all queries")
    return all_data if all_data else get_expanded_sample_data()


def get_sample_data() -> List[str]:
    """Generate sample AI/ML related data for testing"""
    data = [
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
    ]
    return data * 4  # Multiply to get ~200 items

def get_expanded_sample_data() -> List[str]:
    """Generate expanded diverse sample data for testing - multiple topics"""
    all_data = []
    
    # AI & Technology
    ai_data = [
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
        "Quantum computing combined with AI will solve complex problems.",
        "AI chatbots are getting too realistic and it's concerning.",
        "Machine learning helps doctors diagnose diseases faster.",
    ] * 2
    
    # Climate & Environment
    climate_data = [
        "Climate change is the biggest threat to humanity right now.",
        "Renewable energy adoption is increasing globally which is great!",
        "Deforestation is destroying ecosystems at an alarming rate.",
        "Electric vehicles are becoming more affordable and popular.",
        "Carbon emissions need to be reduced immediately.",
        "Plastic pollution in oceans is a serious environmental crisis.",
        "Solar and wind power are now cheaper than fossil fuels.",
        "Rising sea levels will displace millions of coastal residents.",
        "Climate activists are protesting for urgent government action.",
        "Sustainable farming practices can help fight climate change.",
        "Green energy transition is creating millions of new jobs.",
        "Extreme weather events are becoming more frequent worldwide.",
        "Biodiversity loss threatens global food security.",
        "Reducing meat consumption helps lower carbon footprint.",
        "COP summits are failing to deliver meaningful climate action.",
    ] * 2
    
    # Politics & Elections
    politics_data = [
        "The election results will shape the future of the country.",
        "Political polarization is dividing communities and families.",
        "Voter turnout needs to increase for true democracy.",
        "Campaign finance reform is essential for fair elections.",
        "Social media influences political opinions significantly.",
        "Young voters are becoming more politically engaged.",
        "Gerrymandering undermines democratic representation.",
        "Debates between candidates provide important insights.",
        "Political parties are announcing their manifestos this week.",
        "The promise of creating jobs is resonating with voters.",
        "Healthcare policies are a key election issue.",
        "Economic policies differ significantly between candidates.",
        "International relations affect domestic politics greatly.",
        "Truth in political advertising is often questionable.",
        "Grassroots movements are changing political landscapes.",
    ] * 2
    
    # Healthcare & Medical
    healthcare_data = [
        "New breakthrough in cancer treatment shows promising results.",
        "Mental health awareness is improving globally.",
        "Telemedicine is making healthcare more accessible.",
        "Vaccine development saved millions during the pandemic.",
        "Healthcare costs are rising beyond many people's means.",
        "Artificial intelligence is revolutionizing medical diagnostics.",
        "Preventive healthcare is better than treating diseases.",
        "Medical research into rare diseases is underfunded.",
        "Singapore has an excellent public healthcare system.",
        "Mental health stigma prevents people from seeking help.",
        "Generic drugs make treatment affordable for patients.",
        "Health insurance coverage gaps leave many vulnerable.",
        "Nutrition and exercise prevent chronic diseases.",
        "Medical technology advances are saving more lives.",
        "Healthcare worker shortages affect patient care quality.",
    ] * 2
    
    # Business & Economics
    business_data = [
        "Startup funding reached record levels this quarter.",
        "The tech industry is seeing major layoffs recently.",
        "E-commerce grew exponentially during and after pandemic.",
        "Remote work is becoming the new norm for many.",
        "Inflation rates are affecting household budgets globally.",
        "Cryptocurrency markets are highly volatile and risky.",
        "Supply chain disruptions impact global commerce.",
        "Sustainability is becoming a key business priority.",
        "Small businesses struggle with high interest rates.",
        "Corporate taxes are being debated in many countries.",
        "Innovation drives economic growth significantly.",
        "Monopoly concerns in tech industry are rising.",
        "Entrepreneurship education should be part of curricula.",
        "Fair trade practices benefit developing countries.",
        "Economic inequality continues to widen worldwide.",
    ] * 2
    
    # Education & Learning
    education_data = [
        "Online learning platforms are transforming education.",
        "Student loan debt is a burden for young graduates.",
        "STEM education prepares students for future jobs.",
        "Teachers deserve better pay and working conditions.",
        "Accessibility in education should be a priority.",
        "Critical thinking skills are more important than memorization.",
        "Technology integration in classrooms enhances learning.",
        "Education gaps between rich and poor are widening.",
        "Vocational training provides valuable career alternatives.",
        "Research universities drive innovation and discovery.",
        "Learning multiple languages opens career opportunities.",
        "Educational resources should be freely available online.",
        "Mental health support in schools is crucial.",
        "Education reform is needed to modernize curricula.",
        "Lifelong learning is essential in changing job markets.",
    ] * 2
    
    all_data = ai_data + climate_data + politics_data + healthcare_data + business_data + education_data
    print(f"Generated {len(all_data)} diverse sample posts across 6 topic categories")
    return all_data


def analyze_sentiment(texts: List[str]) -> List[Dict]:
    """Analyze sentiment using pre-trained BERT model"""
    print("Analyzing sentiment...")
    sentiment_model = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest", device=0 if torch.cuda.is_available() else -1)
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
    
    # Use lightweight embedding model for speed with GPU if available
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2", device=device)
    
    # Initialize BERTopic - let it automatically determine optimal topic count
    topic_model = BERTopic(
        embedding_model=embedding_model,
        nr_topics="auto",  # Auto-detect optimal number
        min_topic_size=10,  # Minimum 10 posts per topic
        verbose=True
    )
    
    # Fit and transform
    topics, probs = topic_model.fit_transform(texts)
    
    print(f"Detected {len(set(topics))} topics")
    return topics, topic_model


def store_in_mongodb(posts: List[Dict], mongo_uri: str, database: str = "trenddb", collection: str = "posts", clear_old: bool = True):
    """Store analyzed data in MongoDB"""
    print(f"Storing data in MongoDB...")
    
    try:
        client = MongoClient(mongo_uri)
        db = client[database]
        col = db[collection]
        
        # Clear old data if requested
        if clear_old:
            deleted_count = col.delete_many({}).deleted_count
            print(f"Cleared {deleted_count} old documents")
        
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
    
    # Step 1: Scrape data from multiple topics for diversity
    queries = [
        "AI OR artificial intelligence OR machine learning lang:en since:2025-01-01",
        "climate change OR global warming OR environment lang:en since:2025-01-01", 
        "election OR politics OR candidate lang:en since:2025-01-01",
        "healthcare OR medical OR treatment lang:en since:2025-01-01",
        "business OR economy OR startup lang:en since:2025-01-01",
        "education OR learning OR school lang:en since:2025-01-01"
    ]
    data = scrape_twitter_data(queries, limit=300)  # Increased limit per query
    
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
            
            # Try to get better name from actual topic keywords
            if topic_id != -1:  # Skip the outlier topic
                try:
                    # Get the top words for this topic
                    topic_words = topic_model.get_topic(topic_id)
                    if topic_words and len(topic_words) > 0:
                        # Take first 8 keywords and create a name
                        keywords = [word for word, prob in topic_words[:8]]
                        # Remove very common words
                        common_words = {'is', 'are', 'and', 'or', 'the', 'a', 'an', 'with', 'for', 'to', 'of', 'in', 'on', 'at'}
                        keywords = [k for k in keywords if k.lower() not in common_words]
                        # Take first 5-6 meaningful keywords
                        meaningful_keywords = keywords[:6]
                        if meaningful_keywords:
                            # Capitalize and join
                            clean_name = " ".join(meaningful_keywords).title()
                            topic_names[topic_id] = clean_name
                        else:
                            # Fallback to original name processing
                            if topic_name and isinstance(topic_name, str):
                                # Clean up the name
                                words = topic_name.split('_')[1:] if len(topic_name.split('_')) > 1 else topic_name.split()
                                clean_words = [w for w in words if w and not w.isdigit()]
                                clean_name = " ".join(clean_words).title()
                                topic_names[topic_id] = clean_name if clean_name else f"Topic {topic_id}"
                            else:
                                topic_names[topic_id] = f"Topic {topic_id}"
                    else:
                        topic_names[topic_id] = f"Topic {topic_id}"
                except Exception as e:
                    # Fallback: use topic info name
                    if topic_name and isinstance(topic_name, str):
                        words = topic_name.split('_')[1:] if len(topic_name.split('_')) > 1 else topic_name.split()
                        clean_words = [w for w in words if w and not w.isdigit()]
                        clean_name = " ".join(clean_words).title()
                        topic_names[topic_id] = clean_name if clean_name else f"Topic {topic_id}"
                    else:
                        topic_names[topic_id] = f"Topic {topic_id}"
            else:
                # Outlier topic
                topic_names[topic_id] = "Outliers / Mixed"
                
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
        
        # Generate URL for the post (search link)
        # Create a search-friendly version of the text for URL generation
        url_keywords = " ".join(text.split()[:5])  # Use first 5 words as keywords
        search_url = f"https://twitter.com/search?q={url_keywords.replace(' ', '%20')}"
        
        docs.append({
            "text": text,
            "topic": int(topic),
            "topic_name": topic_name,
            "sentiment": sentiment_label,
            "score": float(sent["score"]),
            "url": search_url,
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

