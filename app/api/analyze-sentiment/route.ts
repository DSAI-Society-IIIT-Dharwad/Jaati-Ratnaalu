import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: "Please provide text to analyze" },
        { status: 400 }
      );
    }

    // Use TensorFlow Lite model (bert_classifier.tflite) like Android app
    try {
      const escapedText = text.replace(/"/g, '\\"');
      const { stdout, stderr } = await execAsync(
        `python sentiment_classifier.py "${escapedText}"`,
        { maxBuffer: 1024 * 1024 }
      );
      
      const result = JSON.parse(stdout.trim());
      
      return NextResponse.json({
        positive: result.positive || 0,
        negative: result.negative || 0,
        neutral: Math.max(0, 1 - (result.positive || 0) - (result.negative || 0))
      });
      
    } catch (error) {
      console.log("TFLite model failed, using fallback:", error);
      
      // Fallback to keyword-based sentiment
      const lowerText = text.toLowerCase();
      
      const positiveWords = [
        "good", "great", "excellent", "positive", "win", "success", 
        "happy", "best", "wonderful", "amazing", "love", "perfect",
        "fantastic", "brilliant", "awesome", "joy", "pleased", "glad"
      ];
      
      const negativeWords = [
        "bad", "terrible", "negative", "loss", "fail", "sad", "worst",
        "crisis", "hate", "awful", "disappointed", "angry", "worried",
        "fear", "anxious", "depressed", "upset", "frustrated", "concerned"
      ];
      
      let positiveScore = 0;
      let negativeScore = 0;
      
      positiveWords.forEach(word => {
        const count = (lowerText.match(new RegExp(word, "g")) || []).length;
        positiveScore += count * 0.15;
      });
      
      negativeWords.forEach(word => {
        const count = (lowerText.match(new RegExp(word, "g")) || []).length;
        negativeScore += count * 0.15;
      });
      
      // Normalize scores
      positiveScore = Math.min(positiveScore, 1);
      negativeScore = Math.min(negativeScore, 1);
      
      // If no strong sentiment detected, default to neutral
      if (positiveScore < 0.1 && negativeScore < 0.1) {
        positiveScore = 0.5;
        negativeScore = 0.5;
      }
      
      return NextResponse.json({
        positive: positiveScore,
        negative: negativeScore,
        neutral: Math.max(0, 1 - positiveScore - negativeScore)
      });
    }
    
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return NextResponse.json(
      { error: "Failed to analyze sentiment" },
      { status: 500 }
    );
  }
}

