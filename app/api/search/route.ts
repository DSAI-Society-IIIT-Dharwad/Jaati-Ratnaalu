import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Please provide a search query" },
        { status: 400 }
      );
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      return NextResponse.json(
        { error: "MONGO_URI not configured" },
        { status: 500 }
      );
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db("trenddb");
    const posts = await db.collection("posts").find({}).toArray();
    await client.close();

    // Find similar posts using simple cosine similarity
    const scoredPosts = posts.map((post) => ({
      ...post,
      similarity: calculateSimilarity(query.toLowerCase(), (post.text || "").toLowerCase()),
    }));

    // Sort by similarity and get top results
    const topPosts = scoredPosts
      .sort((a, b) => b.similarity - a.similarity)
      .filter((p) => p.similarity > 0.1)
      .slice(0, 20);

    if (topPosts.length === 0) {
      return NextResponse.json({
        query,
        message: "No matching topics found",
        suggestions: [
          "Try different keywords",
          "Check spelling",
          "Search for a broader topic",
        ],
      });
    }

    // Get unique topics from results
    const topicsMap = new Map<string, { count: number; totalSentiment: { pos: number; neg: number; neu: number } }>();
    
    topPosts.forEach((post: any) => {
      const topic = post.topic_name || `Topic ${post.topic}`;
      if (!topicsMap.has(topic)) {
        topicsMap.set(topic, { count: 0, totalSentiment: { pos: 0, neg: 0, neu: 0 } });
      }
      const stats = topicsMap.get(topic)!;
      stats.count++;
      
      const sentiment = post.sentiment?.toUpperCase() || "NEUTRAL";
      if (sentiment === "POSITIVE") stats.totalSentiment.pos++;
      else if (sentiment === "NEGATIVE") stats.totalSentiment.neg++;
      else stats.totalSentiment.neu++;
    });

    // Convert to list format
    const relatedTopics = Array.from(topicsMap.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      positive: stats.totalSentiment.pos,
      negative: stats.totalSentiment.neg,
      neutral: stats.totalSentiment.neu,
      positivePercent: ((stats.totalSentiment.pos / stats.count) * 100).toFixed(1),
      negativePercent: ((stats.totalSentiment.neg / stats.count) * 100).toFixed(1),
    }));

    // Calculate overall sentiment for all matching posts
    const allPosts = topPosts.map((p: any) => {
      const sentiment = p.sentiment?.toUpperCase() || "NEUTRAL";
      return { sentiment, text: p.text };
    });

    const sentimentCounts = {
      positive: allPosts.filter((p) => p.sentiment === "POSITIVE").length,
      negative: allPosts.filter((p) => p.sentiment === "NEGATIVE").length,
      neutral: allPosts.filter((p) => p.sentiment === "NEUTRAL").length,
      total: allPosts.length,
    };

    return NextResponse.json({
      query,
      relatedTopics,
      sentimentSummary: sentimentCounts,
      examplePosts: topPosts.slice(0, 5).map((p: any) => ({
        text: p.text,
        topic: p.topic_name || `Topic ${p.topic}`,
        sentiment: p.sentiment,
        url: p.url || null,
        similarity: p.similarity.toFixed(2),
      })),
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search topics" },
      { status: 500 }
    );
  }
}

