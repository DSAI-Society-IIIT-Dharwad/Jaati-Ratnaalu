import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Real internet trends fetching
const TRENDING_TOPICS: Record<string, any[]> = {
  "ai": [
    { text: "OpenAI's new GPT model breaks performance records", sentiment: "POSITIVE", source: "Twitter", url: "https://twitter.com/ai" },
    { text: "AI ethics debate heats up at tech conference", sentiment: "NEUTRAL", source: "Reddit", url: "https://reddit.com/r/artificial" },
    { text: "AI automation threatens thousands of jobs", sentiment: "NEGATIVE", source: "News", url: "https://techcrunch.com" },
    { text: "Machine learning breakthrough in healthcare", sentiment: "POSITIVE", source: "LinkedIn", url: "https://linkedin.com" },
  ],
  "crypto": [
    { text: "Bitcoin surges to new all-time high", sentiment: "POSITIVE", source: "Twitter", url: "https://twitter.com" },
    { text: "Cryptocurrency regulations tighten globally", sentiment: "NEGATIVE", source: "News", url: "https://coinbase.com" },
    { text: "Ethereum 2.0 upgrade successful", sentiment: "POSITIVE", source: "Reddit", url: "https://reddit.com" },
  ],
  "climate": [
    { text: "COP28 reaches historic climate agreement", sentiment: "POSITIVE", source: "News", url: "https://un.org" },
    { text: "Renewable energy breaks records worldwide", sentiment: "POSITIVE", source: "Twitter", url: "https://twitter.com" },
  ],
  "startup": [
    { text: "Funding winter hits tech startups", sentiment: "NEGATIVE", source: "TechCrunch", url: "https://techcrunch.com" },
    { text: "AI startups raise billions in Q3", sentiment: "POSITIVE", source: "Crunchbase", url: "https://crunchbase.com" },
  ],
};

function generateTrendingTopics(keyword: string) {
  const lowerKeyword = keyword.toLowerCase();
  
  // Try to find exact match first
  if (TRENDING_TOPICS[lowerKeyword]) {
    return TRENDING_TOPICS[lowerKeyword];
  }
  
  // Generate synthetic trending topics based on keyword
  return [
    { 
      text: `${keyword} adoption grows rapidly across industries`, 
      sentiment: "POSITIVE", 
      source: "Twitter", 
      url: `https://twitter.com/search?q=${keyword}` 
    },
    { 
      text: `Experts debate the future of ${keyword}`, 
      sentiment: "NEUTRAL", 
      source: "Reddit", 
      url: `https://reddit.com/search?q=${keyword}` 
    },
    { 
      text: `${keyword} faces regulatory challenges`, 
      sentiment: "NEGATIVE", 
      source: "News", 
      url: `https://news.google.com/search?q=${keyword}` 
    },
    { 
      text: `New breakthrough in ${keyword} technology`, 
      sentiment: "POSITIVE", 
      source: "Tech", 
      url: `https://techcrunch.com/search?q=${keyword}` 
    },
  ];
}

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return NextResponse.json(
        { error: "Please provide a keyword" },
        { status: 400 }
      );
    }

    let trendingTopics;
    
    // Try to fetch real trends from internet using Python script
    console.log(`Attempting to fetch real trends for keyword: ${keyword}`);
    try {
      // Use absolute path to the script
      const { stdout, stderr } = await execAsync(
        `python "${process.cwd()}/fetch_trends.py" "${keyword}"`,
        { 
          cwd: process.cwd(), // Set working directory
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      console.log("Python script output:", stdout ? stdout.substring(0, 200) : "No stdout");
      
      if (stdout && stdout.trim()) {
        const parsedData = JSON.parse(stdout.trim());
        trendingTopics = parsedData.trendingTopics || [];
        console.log(`Successfully fetched ${trendingTopics.length} trending topics from internet`);
      } else {
        throw new Error("No output from Python script");
      }
    } catch (error: any) {
      console.error("Error fetching real trends:", error.message);
      console.error("Error details:", {
        code: error.code,
        signal: error.signal,
        cmd: error.cmd,
        killed: error.killed,
        stdout: error.stdout,
        stderr: error.stderr
      });
      // Fallback to simulated trends
      console.log("Falling back to simulated trends");
      trendingTopics = generateTrendingTopics(keyword);
      
      // Add a flag to indicate this is simulated data
      return NextResponse.json({
        keyword,
        trendingTopics,
        sentimentSummary: {
          total: trendingTopics.length,
          positive: trendingTopics.filter(t => t.sentiment === "POSITIVE").length,
          negative: trendingTopics.filter(t => t.sentiment === "NEGATIVE").length,
          neutral: trendingTopics.filter(t => t.sentiment === "NEUTRAL").length,
          positivePercent: ((trendingTopics.filter(t => t.sentiment === "POSITIVE").length / trendingTopics.length) * 100).toFixed(1),
          negativePercent: ((trendingTopics.filter(t => t.sentiment === "NEGATIVE").length / trendingTopics.length) * 100).toFixed(1),
        },
        message: `⚠️ Could not fetch real-time data. Showing simulated trends for "${keyword}"`,
        isSimulated: true
      });
    }
    
    // Store in MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri) {
      try {
        const client = await MongoClient.connect(mongoUri);
        const db = client.db("trenddb");
        const collection = db.collection("live_trends");
        
        // Store search results
        const docs = trendingTopics.map((topic, idx) => ({
          keyword,
          ...topic,
          timestamp: new Date(),
          search_id: `${keyword}_${Date.now()}`,
        }));
        
        await collection.insertMany(docs);
        await client.close();
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue without storing
      }
    }

    // Calculate sentiment summary
    const sentimentCounts = trendingTopics.reduce((acc, topic) => {
      const sent = topic.sentiment.toUpperCase();
      acc[sent] = (acc[sent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = trendingTopics.length;
    const positive = sentimentCounts["POSITIVE"] || 0;
    const negative = sentimentCounts["NEGATIVE"] || 0;
    const neutral = sentimentCounts["NEUTRAL"] || 0;

    return NextResponse.json({
      keyword,
      trendingTopics,
      sentimentSummary: {
        total,
        positive,
        negative,
        neutral,
        positivePercent: ((positive / total) * 100).toFixed(1),
        negativePercent: ((negative / total) * 100).toFixed(1),
      },
      message: `Found ${total} trending topics about "${keyword}"`,
      isSimulated: false, // Real data from internet
      source: "Real-time internet trends"
    });

  } catch (error) {
    console.error("Live search error:", error);
    return NextResponse.json(
      { error: "Failed to search trending topics" },
      { status: 500 }
    );
  }
}

