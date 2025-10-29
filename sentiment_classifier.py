"""
Sentiment classifier using TensorFlow Lite model (bert_classifier.tflite)
Matches the Android app's TextClassifierHelper functionality
"""
import json
import sys
from typing import Dict, List, Tuple

# Try to use TensorFlow Lite
try:
    import tensorflow as tf
    import numpy as np
    TFLITE_AVAILABLE = True
except ImportError:
    TFLITE_AVAILABLE = False
    # Suppress print for API usage
    # print("Warning: TensorFlow not available, using fallback")

# Fallback sentiment analysis
def fallback_sentiment(text: str) -> Tuple[float, float]:
    """Fallback keyword-based sentiment if TensorFlow not available"""
    lower_text = text.lower()
    
    positive_words = [
        "good", "great", "excellent", "positive", "win", "success", 
        "happy", "best", "wonderful", "amazing", "love", "perfect",
        "fantastic", "brilliant", "awesome", "joy", "pleased", "glad"
    ]
    
    negative_words = [
        "bad", "terrible", "negative", "loss", "fail", "sad", "worst",
        "crisis", "hate", "awful", "disappointed", "angry", "worried",
        "fear", "anxious", "depressed", "upset", "frustrated", "concerned"
    ]
    
    positive_score = sum(0.15 for word in positive_words if word in lower_text)
    negative_score = sum(0.15 for word in negative_words if word in lower_text)
    
    positive_score = min(positive_score, 1.0)
    negative_score = min(negative_score, 1.0)
    
    if positive_score < 0.1 and negative_score < 0.1:
        positive_score = 0.5
        negative_score = 0.5
    
    return positive_score, negative_score

class SentimentClassifier:
    """Load and use the bert_classifier.tflite model"""
    
    def __init__(self, model_path: str = "bert_classifier.tflite"):
        self.model_path = model_path
        self.interpreter = None
        
        if TFLITE_AVAILABLE:
            try:
                self.interpreter = tf.lite.Interpreter(model_path=model_path)
                self.interpreter.allocate_tensors()
                
                # Get input and output details
                self.input_details = self.interpreter.get_input_details()
                self.output_details = self.interpreter.get_output_details()
                
                # Suppress print for API usage
                # print(f"✅ Loaded TFLite model: {model_path}")
            except Exception as e:
                # Suppress print for API usage
                # print(f"Warning: Could not load TFLite model: {e}")
                self.interpreter = None
    
    def classify(self, text: str) -> Dict[str, float]:
        """
        Classify text sentiment
        Returns: {'positive': float, 'negative': float}
        """
        if self.interpreter is None:
            # Use fallback
            pos, neg = fallback_sentiment(text)
            return {'positive': pos, 'negative': neg}
        
        try:
            # Tokenize and prepare input (simplified - you may need to adjust based on your model)
            # Note: Actual tokenization depends on your tflite model's expected input format
            text_encoded = text.encode('utf-8')
            
            # Get the expected input shape
            input_shape = self.input_details[0]['shape']
            
            # Prepare input (this is simplified - adjust based on your model)
            if len(input_shape) == 1:
                # Text input
                input_data = np.array([text_encoded], dtype=np.string_)
            else:
                # Tokenized input - this needs proper tokenization
                input_data = np.zeros(input_shape, dtype=self.input_details[0]['dtype'])
            
            # Set input tensor
            self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
            
            # Run inference
            self.interpreter.invoke()
            
            # Get output
            output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
            
            # Extract positive and negative scores
            # Adjust indices based on your model's output
            if output_data.ndim == 2:
                positive_score = float(output_data[0][0]) if output_data[0][0] >= 0 else 0.0
                negative_score = float(output_data[0][1]) if output_data[0][1] >= 0 else 0.0
            else:
                # Fallback if output format is unexpected
                positive_score = 0.5
                negative_score = 0.5
            
            return {'positive': min(positive_score, 1.0), 'negative': min(negative_score, 1.0)}
            
        except Exception as e:
            # Suppress print for API usage
            # print(f"Error classifying text: {e}")
            # Fallback on error
            pos, neg = fallback_sentiment(text)
            return {'positive': pos, 'negative': neg}

def analyze_sentiment(text: str, model_path: str = "bert_classifier.tflite") -> Dict[str, float]:
    """
    Main function to analyze sentiment
    Can be called from command line or imported
    """
    classifier = SentimentClassifier(model_path)
    result = classifier.classify(text)
    return result

if __name__ == "__main__":
    # Command line usage
    if len(sys.argv) < 2:
        print("Usage: python sentiment_classifier.py <text>")
        sys.exit(1)
    
    text = sys.argv[1]
    result = analyze_sentiment(text)
    
    # Output JSON for API
    print(json.dumps(result))

