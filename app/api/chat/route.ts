import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    
    if (!question || typeof question !== "string") {
      return Response.json(
        { error: "Please provide a question" },
        { status: 400 }
      );
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      return Response.json(
        { error: "MONGO_URI not configured" },
        { status: 500 }
      );
    }

    // Check if this is a search query
    const questionLower = question.toLowerCase();
    const isSearchQuery = questionLower.includes("search") || 
                          questionLower.includes("find") || 
                          questionLower.includes("topics about") ||
                          questionLower.includes("what") ||
                          questionLower.includes("show");

    // Extract keyword from ANY question (try to find meaningful keywords)
    const stopWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "what", "search", "find", "topics", "about", "show", "trending", "trend", "is", "are"];
    const keywords = questionLower.split(/\s+/).filter(w => 
      w.length > 2 && !stopWords.includes(w)
    ).map(w => w.replace(/[?!.,;:]/g, "")); // Remove punctuation
    
    const extractedKeyword = keywords.length > 0 ? keywords.slice(0, 2).join(" ") : "";

    // Fetch recent data from MongoDB
    const client = await MongoClient.connect(mongoUri);
    const db = client.db("trenddb");
    
    // If it's a search query, try to find specific topics
    let posts;
    if (isSearchQuery && extractedKeyword) {
      posts = await db.collection("posts")
        .find({ 
          text: { $regex: extractedKeyword, $options: "i" } 
        })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();
    } else {
      posts = await db.collection("posts")
        .find({})
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();
    }
    
    await client.close();

    // Analyze the data
    const sentimentCounts = posts.reduce((acc: Record<string, number>, post: any) => {
      const sentiment = post.sentiment?.toUpperCase() || "UNKNOWN";
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    const positive = sentimentCounts["POSITIVE"] || 0;
    const negative = sentimentCounts["NEGATIVE"] || 0;
    const neutral = sentimentCounts["NEUTRAL"] || 0;
    const total = posts.length;

    // Extract topics
    const topics = new Set(posts.map((p: any) => `Topic ${p.topic}`));
    const topicList = Array.from(topics).slice(0, 5);

    // Generate response based on question
    let answer = "";

    // Check if this question needs a live search trigger
    const isInfoQuery = questionLower.includes("trending") || 
                       questionLower.includes("trend") || 
                       questionLower.includes("topic") ||
                       questionLower.includes("news") ||
                       questionLower.includes("what") || 
                       questionLower.includes("show") ||
                       questionLower.includes("search") ||
                       questionLower.includes("find");

    if (questionLower.includes("sentiment") || questionLower.includes("feeling") || questionLower.includes("emotion")) {
      const posPercent = ((positive / total) * 100).toFixed(1);
      const negPercent = ((negative / total) * 100).toFixed(1);
      answer = `Based on the latest ${total} posts, the sentiment distribution is: ${posPercent}% positive, ${negPercent}% negative, and the rest neutral. Overall, the sentiment appears to be ${positive > negative ? "positive" : "cautious"}.`;
    } else if (questionLower.includes("topic") || questionLower.includes("trend") || questionLower.includes("what")) {
      answer = `Currently tracking ${topics.size} distinct topics. The main topics being discussed are: ${topicList.join(", ")}. These topics represent the key areas of conversation in the analyzed data.`;
    } else if (questionLower.includes("positive")) {
      answer = `${positive} out of ${total} posts have positive sentiment (${((positive / total) * 100).toFixed(1)}%). The overall mood is ${positive > negative ? "optimistic" : "mixed"}.`;
    } else if (questionLower.includes("negative")) {
      answer = `${negative} out of ${total} posts have negative sentiment (${((negative / total) * 100).toFixed(1)}%). ${negative > positive ? "There's more concern" : "Concerns are balanced"} in the current discussions.`;
    } else if (questionLower.includes("summary") || questionLower.includes("overview")) {
      answer = `📊 **Trend Summary:**\n• Total posts analyzed: ${total}\n• Topics: ${topics.size}\n• Positive: ${positive} (${((positive / total) * 100).toFixed(1)}%)\n• Negative: ${negative} (${((negative / total) * 100).toFixed(1)}%)\n• Neutral: ${neutral} (${((neutral / total) * 100).toFixed(1)}%)\n\nMain topics: ${topicList.join(", ")}`;
    } else {
      answer = `📊 I see ${total} posts in your database with ${topics.size} topics. The sentiment is: ${positive} positive, ${negative} negative, ${neutral} neutral.\n\n💡 **Want to run fresh ML analysis?** Type:\n• "run analysis"\n• "analyze data"\n• "run model"\n\nOr ask about specific topics!`;
    }

    const response: any = {
      answer,
      metadata: {
        total,
        positive,
        negative,
        neutral,
        topics: topics.size
      },
      liveSearch: isInfoQuery && extractedKeyword ? {
        trigger: true,
        keyword: extractedKeyword
      } : undefined
    };

    console.log(`📤 Sending response. Answer length: ${answer.length} chars`);
    return Response.json(response);

  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}

