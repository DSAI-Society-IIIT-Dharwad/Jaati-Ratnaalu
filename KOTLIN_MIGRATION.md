# Kotlin to Python Migration - News Data Collector

## Overview

This document explains the migration of the `NewsDataCollector.kt` (Android/Kotlin) implementation to Python (`news_data_collector.py`).

## Key Components

### 1. Data Models

All data classes from Kotlin have been replicated in Python:

#### `NewsItem`
```python
class NewsItem:
    - title: str
    - content: str
    - source: str
    - url: str
    - published_at: str
    - positive_score: float
    - negative_score: float
    - sentiment_analyzed: bool
```

#### `TrendingCategory`
```python
class TrendingCategory:
    - name: str
    - news_items: List[NewsItem]
    - average_positive: float
    - average_negative: float
    - total_items: int
```

#### `OverallSentiment`
```python
class OverallSentiment:
    - total_positive: float
    - total_negative: float
    - total_items: int
    - most_positive_category: str
    - most_negative_category: str
```

#### `DashboardData`
```python
class DashboardData:
    - trending_categories: List[TrendingCategory]
    - overall_sentiment: OverallSentiment
    - last_updated: str
```

### 2. Predefined Trending Categories

Same 8 categories as in Kotlin:
```python
TRENDING_CATEGORIES = [
    "Technology", "Politics", "Sports", "Entertainment",
    "Business", "Health", "Science", "Environment"
]
```

### 3. Enhanced Sentiment Analysis

#### Keyword-Based Analysis

**Positive Keywords** (with weights):
- excellent, amazing, wonderful, outstanding (0.8)
- great, positive, success, win, breakthrough (0.7)
- good, achievement, progress, growth, improvement (0.6)
- and many more...

**Negative Keywords** (with weights):
- terrible, awful, horrible, disastrous, crisis, disaster (0.8)
- bad, negative, failure, worst, hate, terrifying (0.7)
- problem, issue, decline, danger, threat (0.6)
- and many more...

#### Features:
1. **Negation Detection**: Detects words like "not", "no", "never" before keywords
2. **Context Words**: Handles words like "but", "however", "although" that affect sentiment
3. **Length Normalization**: Adjusts scores based on text length
4. **Score Normalization**: Ensures positive + negative = 1.0

#### Classification Support

Integrates with TensorFlow Lite model (`bert_classifier.tflite`) if available, with fallback to keyword-based analysis.

### 4. News Scraping Sources

#### Google News
- Scrapes articles from news.google.com
- Extracts title, source, and URL
- Multiple CSS selector fallbacks for robustness
- Takes up to 15 articles per topic

#### Reddit (Optional)
- Searches /r/news for topic
- Can be unreliable due to bot detection

#### Bing News (Optional)
- Searches bing.com/news
- Alternative to Google News

### 5. Main Workflow

```python
collector = NewsDataCollector()
dashboard = collector.fetch_trending_dashboard()
```

This method:
1. Iterates through all trending categories
2. Fetches news from multiple sources
3. Analyzes sentiment for each news item
4. Calculates category averages
5. Determines overall sentiment metrics
6. Returns complete dashboard data

### 6. Usage

#### Single Category
```bash
python news_data_collector.py Technology
```

#### Full Dashboard
```bash
python news_data_collector.py all
```

#### Programmatic
```python
from news_data_collector import NewsDataCollector

collector = NewsDataCollector()
dashboard = collector.fetch_trending_dashboard()
result = dashboard.to_dict()  # JSON-serializable
```

## Differences from Kotlin Version

### 1. Web Scraping
- **Kotlin**: Uses JSoup for HTML parsing
- **Python**: Uses BeautifulSoup (equivalent)

### 2. ML Classifier
- **Kotlin**: Uses Android's TextClassifierHelper (MediaPipe)
- **Python**: Uses TensorFlow Lite with fallback to keyword analysis

### 3. Async Operations
- **Kotlin**: Uses coroutines (suspend functions)
- **Python**: Synchronous by default (can be made async if needed)

### 4. Error Handling
- **Kotlin**: Exception handling with try-catch
- **Python**: Python's try-except (equivalent)

## Integration

### As a Module
```python
from news_data_collector import NewsDataCollector, DashboardData

collector = NewsDataCollector(use_ml_classifier=True)
dashboard = collector.fetch_trending_dashboard()
```

### With API
The data structures are JSON-serializable and can be used in web APIs:

```python
@app.route('/api/dashboard')
def get_dashboard():
    collector = NewsDataCollector()
    dashboard = collector.fetch_trending_dashboard()
    return jsonify(dashboard.to_dict())
```

### Data Flow
```
Trending Categories → News Scraping → Sentiment Analysis → Category Aggregation → Dashboard Data
```

## Testing

Run with different categories:
```bash
python news_data_collector.py Technology
python news_data_collector.py Politics
python news_data_collector.py Health
```

Run full dashboard:
```bash
python news_data_collector.py all
```

## Dependencies

Required packages:
```bash
pip install beautifulsoup4 requests
```

Optional for ML:
```bash
pip install tensorflow
```

## Notes

1. The sentiment analysis closely matches the Kotlin implementation
2. Web scraping may be blocked by some sites - the code includes robust error handling
3. The keyword analysis includes weighted terms exactly as in the Kotlin version
4. All data structures match the Kotlin data classes for consistency

