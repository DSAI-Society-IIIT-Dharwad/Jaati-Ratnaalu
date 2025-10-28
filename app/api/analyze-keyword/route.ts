import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return NextResponse.json(
        { error: "Please provide a keyword" },
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
    
    // Find posts related to the keyword
    const posts = await db.collection("posts")
      .find({ 
        $or: [
          { text: { $regex: keyword, $options: "i" } },
          { topic_name: { $regex: keyword, $options: "i" } }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    // Also find similar topics
    const allPosts = await db.collection("posts")
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    await client.close();

    if (posts.length === 0) {
      return NextResponse.json({
        keyword,
        message: `No posts found about "${keyword}". Try re-running the analysis script or use a different keyword.`,
        suggestions: [
          "Run: python analyze.py to generate new data",
          "Try keywords: AI, healthcare, climate, startup",
          "Check the dashboard for available topics"
        ]
      });
    }

    // Group by topic_name
    const topicGroups: Record<string, any[]> = {};
    posts.forEach((post: any) => {
      const topicName = post.topic_name || `Topic ${post.topic}`;
      if (!topicGroups[topicName]) {
        topicGroups[topicName] = [];
      }
      topicGroups[topicName].push(post);
    });

    // Calculate sentiment per topic
    const topicSentiments = Object.entries(topicGroups).map(([topic, postsInTopic]) => {
      const sentiments = postsInTopic.map((p: any) => p.sentiment?.toUpperCase() || "NEUTRAL");
      return {
        topic,
        total: postsInTopic.length,
        positive: sentiments.filter(s => s === "POSITIVE").length,
        negative: sentiments.filter(s => s === "NEGATIVE").length,
        neutral: sentiments.filter(s => s === "NEUTRAL").length,
        posts: postsInTopic.slice(0, 3).map((p: any) => ({
          text: p.text,
          sentiment: p.sentiment,
          score: p.score,
          url: p.url || null
        }))
      };
    });

    // Overall sentiment
    const allSentiments = posts.map((p: any) => p.sentiment?.toUpperCase() || "NEUTRAL");
    const overallPositive = allSentiments.filter(s => s === "POSITIVE").length;
    const overallNegative = allSentiments.filter(s => s === "NEGATIVE").length;
    const overallNeutral = allSentiments.filter(s => s === "NEUTRAL").length;

    return NextResponse.json({
      keyword,
      topicSentiments,
      overallSentiment: {
        total: posts.length,
        positive: overallPositive,
        negative: overallNegative,
        neutral: overallNeutral,
        positivePercent: ((overallPositive / posts.length) * 100).toFixed(1),
        negativePercent: ((overallNegative / posts.length) * 100).toFixed(1)
      },
      samplePosts: posts.slice(0, 5).map((p: any) => ({
        text: p.text,
        sentiment: p.sentiment,
        topic: p.topic_name || `Topic ${p.topic}`,
        score: p.score?.toFixed(2),
        url: p.url || null
      }))
    });

  } catch (error) {
    console.error("Analyze keyword error:", error);
    return NextResponse.json(
      { error: "Failed to analyze keyword" },
      { status: 500 }
    );
  }
}

