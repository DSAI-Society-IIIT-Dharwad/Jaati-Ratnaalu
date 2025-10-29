"""
Semantic Search for Chatbot
Uses sentence-transformers embeddings and cosine similarity to find relevant documents
"""
import os
import json
from typing import List, Dict, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import torch

# Load model once
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device} ({'GPU' if torch.cuda.is_available() else 'CPU'})")

# Initialize model
MODEL_NAME = "all-MiniLM-L6-v2"  # Lightweight but effective
model = SentenceTransformer(MODEL_NAME, device=device)

def get_embeddings_for_texts(texts: List[str]) -> np.ndarray:
    """
    Generate embeddings for a list of texts
    Returns numpy array of embeddings
    """
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return embeddings


def cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two embeddings
    """
    dot_product = np.dot(embedding1, embedding2)
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)


def search_similar_documents(
    query: str,
    mongo_uri: str,
    collection_name: str = "posts",
    num_results: int = 5,
    min_score: float = 0.3
) -> List[Dict]:
    """
    Search for documents similar to the query using semantic search
    
    Args:
        query: User query string
        mongo_uri: MongoDB connection string
        collection_name: Name of collection to search
        num_results: Number of results to return
        min_score: Minimum similarity score (0-1)
    
    Returns:
        List of documents with similarity scores
    """
    # Get query embedding
    query_embedding = get_embeddings_for_texts([query])[0]
    
    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    db = client["trenddb"]
    col = db[collection_name]
    
    # Get all documents
    documents = list(col.find({}))
    
    if not documents:
        return []
    
    # Extract texts
    texts = [doc.get("text", "") for doc in documents]
    
    # Get embeddings for all documents
    print(f"Computing embeddings for {len(texts)} documents...")
    embeddings = get_embeddings_for_texts(texts)
    
    # Calculate similarities
    similarities = []
    for i, doc_embedding in enumerate(embeddings):
        similarity = cosine_similarity(query_embedding, doc_embedding)
        similarities.append((documents[i], similarity))
    
    # Sort by similarity
    similarities.sort(key=lambda x: x[1], reverse=True)
    
    # Filter by min_score and return top results
    results = [
        {
            "document": doc,
            "score": float(sim)
        }
        for doc, sim in similarities
        if sim >= min_score
    ][:num_results]
    
    client.close()
    
    return results


def analyze_sentiment_distribution(documents: List[Dict]) -> Dict:
    """
    Analyze sentiment distribution in a set of documents
    """
    sentiments = {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0}
    
    for result in documents:
        doc = result["document"]
        sentiment = doc.get("sentiment", "NEUTRAL")
        if sentiment in sentiments:
            sentiments[sentiment] += 1
    
    total = len(documents)
    
    return {
        "positive": sentiments["POSITIVE"],
        "negative": sentiments["NEGATIVE"],
        "neutral": sentiments["NEUTRAL"],
        "positivePercent": f"{(sentiments['POSITIVE']/total*100):.1f}" if total > 0 else "0",
        "negativePercent": f"{(sentiments['NEGATIVE']/total*100):.1f}" if total > 0 else "0",
        "total": total
    }


def main():
    """
    Main function for semantic search
    Usage: python semantic_search.py "query" [num_results]
    """
    import sys
    
    mongo_uri = os.getenv("MONGO_URI", "")
    
    if not mongo_uri:
        print("MONGO_URI not set")
        sys.exit(1)
    
    if len(sys.argv) < 2:
        print("Usage: python semantic_search.py 'query' [num_results]")
        sys.exit(1)
    
    query = sys.argv[1]
    num_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    print(f"🔍 Searching for: '{query}'\n")
    
    # Perform semantic search
    results = search_similar_documents(query, mongo_uri, num_results=num_results)
    
    if not results:
        print("No similar documents found")
        sys.exit(1)
    
    # Analyze sentiment
    sentiment_dist = analyze_sentiment_distribution(results)
    
    # Print results
    print(f"📊 Found {len(results)} similar documents:")
    print(f"   Positive: {sentiment_dist['positive']}")
    print(f"   Negative: {sentiment_dist['negative']}")
    print(f"   Neutral: {sentiment_dist['neutral']}\n")
    
    print(f"Top {min(5, len(results))} results:\n")
    for i, result in enumerate(results[:5], 1):
        doc = result["document"]
        print(f"{i}. Score: {result['score']:.3f}")
        print(f"   Sentiment: {doc.get('sentiment', 'UNKNOWN')}")
        print(f"   Text: {doc.get('text', '')[:100]}...")
        print(f"   URL: {doc.get('url', 'N/A')}\n")
    
    # Output JSON
    output = {
        "query": query,
        "results": results,
        "sentiment": sentiment_dist
    }
    
    print("\nJSON output:")
    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()


