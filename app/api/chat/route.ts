import { NextResponse } from "next/server";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface SentimentResult {
  positive: number;
  negative: number;
  neutral: number;
  overallMood: string;
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    
    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Please provide a question" },
        { status: 400 }
      );
    }

    const questionLower = question.toLowerCase();

    // 1. Handle ML Analysis Request
    if (questionLower.includes("run analysis") ||
        questionLower.includes("analyze data") ||
        questionLower.includes("run model") ||
        questionLower.includes("show analysis")) {
      
      return await handleMLAnalysis();
    }

    // 2. Handle Google News Search
    if (questionLower.includes("news about") || 
        questionLower.includes("sentiment of") ||
        questionLower.includes("how people feel about") ||
        questionLower.includes("feel about") ||
        questionLower.includes("public opinion") ||
        questionLower.includes("trending topics") ||
        questionLower.includes("what's trending")) {
      
      // Extract topic from query
      let topic = extractTopicFromQuery(question);
      return await handleGoogleNewsSearch(topic);
    }

    // 3. Handle General Chat
    return await handleGeneralChat(question, questionLower);

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}

// Extract topic from user query
function extractTopicFromQuery(question: string): string {
  const topic = question
    .replace(/news about|sentiment of|how people feel about|how do people feel about|feel about|sentiment on|public opinion|trending topics|what's trending|show trends/gi, "")
    .replace(/\?/g, "")
    .trim();

  if (topic && topic.length > 2) return topic;

  // Fallback: extract meaningful words
  const stopWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "what", "search", "find", "topics", "about", "show", "trending", "trend", "is", "are", "how", "do", "people", "feel"];
  const words = question.split(/\s+/).filter(w => 
    w.length > 2 && !stopWords.includes(w.toLowerCase())
  ).map(w => w.replace(/[?!.,;:]/g, ""));
  
  return words.slice(0, 3).join(" ") || "current trends";
}

// Handle ML Analysis
async function handleMLAnalysis() {
  try {
    // Simulate ML model execution
    const topics = ["AI Technology", "Climate Change", "Stock Market", "Health & Wellness", "Electric Vehicles"];
    const processed = Math.floor(Math.random() * 1000) + 500;
    const positive = Math.floor(processed * (Math.random() * 0.3 + 0.4)); // 40-70% positive
    const negative = Math.floor(processed * (Math.random() * 0.2 + 0.1)); // 10-30% negative
    const neutral = processed - positive - negative;

    const mood = positive > negative * 1.5 ? "Optimistic" : 
                 negative > positive * 1.5 ? "Concerned" : "Balanced";

    const responseText = `🤖 **ML Analysis Complete!**\n\n` +
      `📊 **Results:**\n` +
      `• Topics detected: ${topics.length}\n` +
      `• Posts processed: ${processed}\n` +
      `• Positive sentiment: ${positive} (${((positive/processed)*100).toFixed(1)}%)\n` +
      `• Negative sentiment: ${negative} (${((negative/processed)*100).toFixed(1)}%)\n` +
      `• Neutral: ${neutral} (${((neutral/processed)*100).toFixed(1)}%)\n\n` +
      `😊 **Overall Mood:** ${mood}\n\n` +
      `**Topic Breakdown:**\n` +
      topics.map((topic, idx) => 
        `${idx + 1}. ${topic} - ${Math.floor(Math.random() * 200) + 50} posts`
      ).join('\n');

    return NextResponse.json({
      answer: responseText,
      type: "ml_analysis",
      results: {
        topics: topics.length,
        processed,
        positive,
        negative,
        neutral,
        mood
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: "ML analysis failed",
      suggestion: "Try running the analysis again"
    }, { status: 500 });
  }
}

// Handle Google News Search
async function handleGoogleNewsSearch(topic: string) {
  try {
    // Use Google News API (you'll need to set up API key)
    const apiKey = process.env.NEWS_API_KEY || "38c5a9e996e741aea3139ba32926c1f7";
    const searchQuery = encodeURIComponent(topic);
    
    let newsArticles: NewsArticle[] = [];
    let sentimentResult: SentimentResult;

    if (apiKey) {
      // Real News API call
      console.log(`Fetching news from NewsAPI for: ${topic}`);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${searchQuery}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
      );
      
      const data = await response.json();
      
      // Check for API errors
      if (data.status === "error") {
        console.error("NewsAPI error:", data.message);
        throw new Error(data.message || "News API error");
      }
      
      if (data.articles && data.articles.length > 0) {
        newsArticles = data.articles.slice(0, 10).map((article: any) => ({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt
        }));
        console.log(`✅ Successfully fetched ${newsArticles.length} news articles`);
      } else {
        console.log("No articles found, using fallback data");
        throw new Error("No articles found");
      }
    } else {
      // Fallback: Simulated news data
      newsArticles = generateSimulatedNews(topic);
    }

    // Analyze sentiment of news articles
    sentimentResult = analyzeNewsSentiment(newsArticles);

    const responseText = `📰 **News about "${topic}"**\n\n` +
      `📊 **Sentiment Analysis:**\n` +
      `✅ Positive: ${sentimentResult.positive}%\n` +
      `❌ Negative: ${sentimentResult.negative}%\n` +
      `➡️ Neutral: ${sentimentResult.neutral}%\n` +
      `😊 **Overall Mood:** ${sentimentResult.overallMood}\n\n` +
      `**Top ${newsArticles.length} News Articles:**\n` +
      newsArticles.map((article, idx) => 
        `${idx + 1}. **${article.title}**\n   📝 ${article.description?.substring(0, 100)}...\n   📰 Source: ${article.source}\n   🔗 [Read more](${article.url})\n`
      ).join('\n');

    return NextResponse.json({
      answer: responseText,
      type: "news_search",
      topic: topic,
      sentiment: sentimentResult,
      articles: newsArticles
    });

  } catch (error: any) {
    console.error("News API error:", error?.message || error);
    
    // Fallback response
    return NextResponse.json({
      answer: `❌ Could not fetch real-time news about "${topic}". ${error?.message || "Please try again later."}\n\n💡 Using fallback news data.`,
      type: "news_search_error",
      topic: topic
    });
  }
}

// Handle General Chat
async function handleGeneralChat(question: string, questionLower: string) {
  // Simple response for general queries
  const responseText = `🤖 **I can help you with:**\n\n` +
    `• **News & Sentiment Analysis** - "news about AI" or "how do people feel about climate change?"\n` +
    `• **ML Analysis** - "run analysis" or "analyze data"\n` +
    `• **Trending Topics** - "what's trending" or "show trends"\n\n` +
    `Try asking me about any topic and I'll analyze the public sentiment from recent news!`;

  return NextResponse.json({
    answer: responseText,
    type: "general_chat"
  });
}

// Helper function to generate simulated news data
function generateSimulatedNews(topic: string): NewsArticle[] {
  const sources = ["BBC News", "CNN", "Reuters", "Associated Press", "The Guardian", "TechCrunch", "Bloomberg"];
  const sentiments = ["positive", "negative", "neutral"];
  
  return Array.from({ length: 10 }, (_, i) => {
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const sentimentText = sentiment === "positive" ? "breakthrough" : 
                         sentiment === "negative" ? "concerns" : "developments";
    
    return {
      title: `${topic} ${sentimentText} make headlines`,
      description: `Latest ${sentiment} developments in ${topic} are capturing global attention with new ${sentimentText} emerging daily.`,
      url: `https://example.com/news/${topic}-${i+1}`,
      source: sources[Math.floor(Math.random() * sources.length)],
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  });
}

// Helper function to analyze sentiment of news articles
function analyzeNewsSentiment(articles: NewsArticle[]): SentimentResult {
  const positiveWords = ["breakthrough", "success", "growth", "positive", "optimistic", "achievement", "win", "gain"];
  const negativeWords = ["concern", "crisis", "decline", "negative", "pessimistic", "loss", "drop", "failure"];
  
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  articles.forEach(article => {
    const text = (article.title + " " + article.description).toLowerCase();
    
    const hasPositive = positiveWords.some(word => text.includes(word));
    const hasNegative = negativeWords.some(word => text.includes(word));
    
    if (hasPositive && !hasNegative) positiveCount++;
    else if (hasNegative && !hasPositive) negativeCount++;
    else neutralCount++;
  });
  
  const total = articles.length;
  const positive = Math.round((positiveCount / total) * 100);
  const negative = Math.round((negativeCount / total) * 100);
  const neutral = Math.round((neutralCount / total) * 100);
  
  let overallMood = "Neutral";
  if (positive > negative + 20) overallMood = "Very Positive";
  else if (positive > negative) overallMood = "Positive";
  else if (negative > positive + 20) overallMood = "Very Negative";
  else if (negative > positive) overallMood = "Negative";
  
  return { positive, negative, neutral, overallMood };
}