import requests
from bs4 import BeautifulSoup
from urllib.robotparser import RobotFileParser
from urllib.parse import urljoin, urlparse
import time
import random
import json
import sys

class AdvancedNewsScraper:
    def __init__(self, delay=2):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.delay = delay
        self.visited_urls = set()
    
    def can_fetch(self, url):
        """Check robots.txt"""
        try:
            parsed = urlparse(url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"
            robots_url = urljoin(base_url, '/robots.txt')
            
            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            return rp.can_fetch('*', url)
        except:
            return True
    
    def scrape_with_retry(self, url, max_retries=3):
        """Scrape with retry mechanism"""
        for attempt in range(max_retries):
            try:
                if not self.can_fetch(url):
                    print(f"Robots.txt disallows: {url}")
                    return None
                
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                
                # Add random delay to be respectful
                time.sleep(self.delay + random.uniform(0.5, 1.5))
                
                return response.content
                
            except requests.RequestException as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    return None
                time.sleep(2 ** attempt)  # Exponential backoff
        
        return None
    
    def extract_news_data(self, html, config):
        """Extract structured news data"""
        soup = BeautifulSoup(html, 'html.parser')
        articles = []
        
        for article_elem in soup.select(config['article_selector']):
            try:
                article_data = {}
                
                # Extract title
                if title_elem := article_elem.select_one(config.get('title_selector', '')):
                    article_data['title'] = title_elem.get_text().strip()
                
                # Extract link
                if link_elem := article_elem.select_one(config.get('link_selector', 'a')):
                    href = link_elem.get('href', '')
                    if href:
                        article_data['url'] = href if href.startswith('http') else urljoin(config['base_url'], href)
                
                # Extract summary
                if summary_elem := article_elem.select_one(config.get('summary_selector', '')):
                    article_data['summary'] = summary_elem.get_text().strip()
                
                # Extract date
                if date_elem := article_elem.select_one(config.get('date_selector', '')):
                    article_data['date'] = date_elem.get_text().strip()
                
                # Extract image
                if img_elem := article_elem.select_one(config.get('image_selector', 'img')):
                    article_data['image_url'] = img_elem.get('src', '')
                
                # Extract source
                if source_elem := article_elem.select_one(config.get('source_selector', '')):
                    article_data['publisher'] = source_elem.get_text().strip()
                
                if article_data.get('title') and article_data.get('url'):
                    articles.append(article_data)
                    
            except Exception as e:
                print(f"Error extracting article: {e}")
                continue
        
        return articles
    
    def search_google_news(self, query, max_results=10):
        """Search Google News and return results"""
        # Suppress print for API usage
        # print(f"Searching Google News for: {query}")
        
        # Create Google News search URL
        search_url = f"https://news.google.com/search?q={query}&hl=en&gl=IN&ceid=IN:en"
        
        try:
            html = self.scrape_with_retry(search_url)
            if not html:
                print("Failed to fetch Google News")
                return []
            
            # Google News configuration - updated selectors for latest Google News HTML
            config = {
                'base_url': 'https://news.google.com',
                'article_selector': 'article',
                'title_selector': 'h3 a, h4 a',
                'link_selector': 'a',
                'summary_selector': '.Y3v8qd, .FCUp0c',
                'date_selector': 'time',
                'image_selector': 'img',
                'source_selector': '.wEwyrc, .NUnG9d'
            }
            
            articles = self.extract_news_data(html, config)
            
            # If no articles found, try alternative selectors
            if not articles:
                print("Primary selectors failed, trying alternative...")
                config_alt = {
                    'base_url': 'https://news.google.com',
                    'article_selector': '.xrnccd',
                    'title_selector': 'h3',
                    'link_selector': 'a',
                    'summary_selector': '.GI74Re',
                    'date_selector': 'time',
                    'source_selector': '.wEwyrc'
                }
                articles = self.extract_news_data(html, config_alt)
            
            # Format for our API
            formatted = []
            for article in articles[:max_results]:
                formatted.append({
                    'title': article.get('title', ''),
                    'description': article.get('summary', ''),
                    'url': article.get('url', ''),
                    'published_date': article.get('date', ''),
                    'publisher': article.get('publisher', 'Google News')
                })
            
            # Suppress print for API usage
            # print(f"Found {len(formatted)} articles")
            return formatted
            
        except Exception as e:
            # Suppress print for API usage
            # print(f"Error searching Google News: {e}")
            # Return empty list on error
            return []


def main():
    """Main function to test the scraper"""
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(1)
    
    # Check for JSON-only output flag
    json_only = "--json" in sys.argv or sys.argv[0].endswith("api")
    
    query = sys.argv[1] if len(sys.argv) >= 2 else ""
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 10
    
    scraper = AdvancedNewsScraper(delay=1)
    articles = scraper.search_google_news(query, max_results)
    
    # Print results as JSON (compact or pretty based on flag)
    if json_only:
        print(json.dumps(articles))
    else:
        print(json.dumps(articles, indent=2))


if __name__ == "__main__":
    main()
