"""
Enhanced Sentiment Classifier
Based on the working mobile app implementation
Uses TensorFlow Lite model with proper confidence scoring
"""

import json
import sys
import numpy as np
from typing import Dict, List, Tuple, Optional

# TensorFlow Lite imports
try:
    import tensorflow as tf
    TFLITE_AVAILABLE = True
except ImportError:
    TFLITE_AVAILABLE = False

class EnhancedSentimentClassifier:
    """
    Enhanced sentiment classifier matching the working mobile app
    Uses TensorFlow Lite model with confidence scoring
    """
    
    def __init__(self, model_path: str = "text_classifier.tflite"):
        self.model_path = model_path
        self.interpreter = None
        
        if TFLITE_AVAILABLE:
            try:
                self.interpreter = tf.lite.Interpreter(model_path=model_path)
                self.interpreter.allocate_tensors()
                self.input_details = self.interpreter.get_input_details()
                self.output_details = self.interpreter.get_output_details()
            except Exception as e:
                print(f"Warning: Could not load TFLite model: {e}")
                self.interpreter = None
    
    def classify(self, text: str) -> Dict[str, float]:
        """
        Classify text sentiment - matches mobile app behavior
        Returns: {'positive': float, 'negative': float, 'confidence': float}
        """
        if not self.interpreter:
            return self._fallback_sentiment(text)
        
        try:
            # Prepare input - the model expects string input
            try:
                input_data = np.array([text.encode('utf-8')], dtype=np.bytes_)
            except TypeError:
                # Fallback for older NumPy versions
                input_data = np.array([text.encode('utf-8')], dtype=np.string_)
            
            # Set input tensor
            self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
            
            # Run inference
            self.interpreter.invoke()
            
            # Get output
            output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
            
            # Process classification results (matching Kotlin TextClassifierHelper)
            positive_score = 0.0
            negative_score = 0.0
            
            # Parse the output - expect classification results
            if output_data.ndim >= 2:
                # Get the first classification (top result)
                categories = output_data[0] if len(output_data) > 0 else []
                
                for item in categories:
                    # Parse category name and score
                    if isinstance(item, (list, np.ndarray)) and len(item) >= 2:
                        category_name = str(item[0]).lower()
                        score = float(item[1]) if len(item) > 1 else 0.0
                        
                        if 'positive' in category_name:
                            positive_score = score
                        elif 'negative' in category_name:
                            negative_score = score
            
            # If no valid classification, use fallback
            if positive_score == 0.0 and negative_score == 0.0:
                return self._fallback_sentiment(text)
            
            # Calculate confidence
            confidence = max(positive_score, negative_score)
            
            return {
                'positive': positive_score,
                'negative': negative_score,
                'confidence': confidence
            }
            
        except Exception as e:
            print(f"Error in ML classification: {e}")
            return self._fallback_sentiment(text)
    
    def analyze_topic_sentiment(
        self, 
        news_items: List[Dict[str, str]]
    ) -> Dict:
        """
        Analyze sentiment for multiple news items - matches mobile app
        Returns comprehensive analysis like TopicAnalysisResult in Kotlin
        """
        total_positive = 0.0
        total_negative = 0.0
        analyzed_count = 0
        sentiment_breakdown = []
        confidence_scores = []
        
        for item in news_items:
            title = item.get('title', '')
            content = item.get('content', '')
            combined_text = f"{title}. {content}"
            
            # Only analyze substantial content (matching mobile app threshold)
            if len(combined_text) > 20:
                try:
                    result = self.classify(combined_text)
                    pos = result['positive']
                    neg = result['negative']
                    confidence = result.get('confidence', 0.0)
                    
                    # Only count confident classifications (threshold 0.3)
                    if confidence > 0.3:
                        total_positive += pos
                        total_negative += neg
                        analyzed_count += 1
                        confidence_scores.append(confidence)
                        
                        sentiment_breakdown.append({
                            'title': title,
                            'positive_score': pos,
                            'negative_score': neg,
                            'preview': combined_text[:80] + "...",
                            'confidence': confidence
                        })
                except Exception as e:
                    print(f"Error analyzing item: {e}")
                    continue
        
        # Calculate averages
        avg_positive = total_positive / analyzed_count if analyzed_count > 0 else 0.0
        avg_negative = total_negative / analyzed_count if analyzed_count > 0 else 0.0
        avg_confidence = np.mean(confidence_scores) if confidence_scores else 0.0
        
        # Sort by sentiment for top insights
        top_positive = sorted(
            sentiment_breakdown, 
            key=lambda x: x['positive_score'], 
            reverse=True
        )[:3]
        
        top_negative = sorted(
            sentiment_breakdown, 
            key=lambda x: x['negative_score'], 
            reverse=True
        )[:3]
        
        return {
            'average_positive': avg_positive,
            'average_negative': avg_negative,
            'items_analyzed': analyzed_count,
            'breakdown': sentiment_breakdown,
            'top_positive': top_positive,
            'top_negative': top_negative,
            'average_confidence': avg_confidence
        }
    
    def _fallback_sentiment(self, text: str) -> Dict[str, float]:
        """
        Fallback keyword-based sentiment (matching mobile app quickSentimentAnalysis)
        """
        lower_text = text.lower()
        
        # Positive words (matching mobile app)
        positive_words = [
            "good", "great", "excellent", "positive", "win", 
            "success", "happy", "best", "amazing", "wonderful",
            "love", "brilliant", "fantastic", "perfect", "outstanding"
        ]
        
        # Negative words (matching mobile app)
        negative_words = [
            "bad", "terrible", "negative", "loss", "fail", 
            "sad", "worst", "crisis", "horrible", "awful",
            "hate", "disaster", "failure", "disappointed"
        ]
        
        positive_score = 0.0
        negative_score = 0.0
        
        for word in positive_words:
            if word in lower_text:
                positive_score += 0.3
        
        for word in negative_words:
            if word in lower_text:
                negative_score += 0.3
        
        # Normalize
        positive_score = min(positive_score, 1.0)
        negative_score = min(negative_score, 1.0)
        
        # If no sentiment detected, give neutral scores
        if positive_score == 0.0 and negative_score == 0.0:
            positive_score = 0.5
            negative_score = 0.5
        
        return {
            'positive': positive_score,
            'negative': negative_score,
            'confidence': max(positive_score, negative_score)
        }


def analyze_sentiment(text: str, model_path: str = "text_classifier.tflite") -> Dict[str, float]:
    """
    Main function to analyze sentiment
    Returns JSON-compatible result
    """
    classifier = EnhancedSentimentClassifier(model_path)
    result = classifier.classify(text)
    return result


if __name__ == "__main__":
    # Command line usage
    if len(sys.argv) < 2:
        print("Usage: python enhanced_sentiment_classifier.py <text>")
        sys.exit(1)
    
    text = sys.argv[1]
    result = analyze_sentiment(text)
    
    # Output JSON for API
    print(json.dumps(result))


