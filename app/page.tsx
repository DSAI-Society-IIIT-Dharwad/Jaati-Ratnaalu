"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import TrendChatbot from "./components/TrendChatbot";
import TopicSearch from "./components/TopicSearch";

interface PostData {
  text: string;
  topic: number;
  topic_name?: string;
  sentiment: string;
  score: number;
  timestamp?: string;
}

interface TrendData {
  topic: string | number;
  positive: number;
  negative: number;
}

interface TrendingTopic {
  text: string;
  category: string;
  source: string;
  sentiment: string;
  url: string;
}

const COLORS = ['#4ade80', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

export default function Home() {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [sentimentData, setSentimentData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>("");
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/trends");
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        const posts: PostData[] = await res.json();
        
        // Handle null/undefined response
        if (!posts || !Array.isArray(posts)) {
          console.warn("API returned invalid data:", posts);
          setTrendData([]);
          setSentimentData([
            { name: "Positive", value: 0 },
            { name: "Neutral", value: 0 },
            { name: "Negative", value: 0 },
          ]);
          setLoading(false);
          return;
        }

        // Check if we have any data
        if (!Array.isArray(posts)) {
          console.warn("API returned non-array data:", posts);
          setTrendData([]);
          setSentimentData([
            { name: "Positive", value: 0 },
            { name: "Neutral", value: 0 },
            { name: "Negative", value: 0 },
          ]);
          setLoading(false);
          return;
        }
        
        if (!posts || posts.length === 0) {
          setLoading(false);
          return;
        }

        // Helper to determine if sentiment is positive
        const isPositive = (sentiment: string): boolean => {
          const upper = sentiment.toUpperCase();
          return upper === "POSITIVE" || upper.includes("POS") || upper === "LABEL_2";
        };
        
        const isNeutral = (sentiment: string): boolean => {
          const upper = sentiment.toUpperCase();
          return upper === "NEUTRAL" || upper.includes("NEU");
        };

        // Group by topic and sentiment
        const grouped =
          posts && Array.isArray(posts) && posts.length > 0
            ? Object.values(
                posts.reduce((acc, post) => {
                  if (!post || !post.sentiment) return acc;
                  // Use topic_name if available, otherwise fallback to "Topic X"
                  let topicKey = post.topic_name;
                  if (!topicKey || (typeof topicKey === 'string' && topicKey.trim() === "")) {
                    // Fallback to topic ID
                    topicKey = `Topic ${post.topic}`;
                  }
                  if (!acc[topicKey]) {
                    acc[topicKey] = { topic: topicKey, positive: 0, negative: 0 };
                  }
                  if (isPositive(post.sentiment)) {
                    acc[topicKey].positive++;
                  } else if (!isNeutral(post.sentiment)) {
                    acc[topicKey].negative++;
                  }
                  // Skip neutral sentiments for the bar chart
                  return acc;
                }, {} as Record<string, TrendData>)
              )
            : [];

        // Calculate overall sentiment distribution (include neutral as its own category)
        const sentimentCounts =
          posts && Array.isArray(posts) && posts.length > 0
            ? posts.reduce((acc, post) => {
                if (!post || !post.sentiment) return acc;
                let key;
                if (isPositive(post.sentiment)) {
                  key = "Positive";
                } else if (isNeutral(post.sentiment)) {
                  key = "Neutral";
                } else {
                  key = "Negative";
                }
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            : {};

        setTrendData(grouped.slice(0, 10)); // Top 10 topics
        setSentimentData([
          { name: "Positive", value: sentimentCounts["Positive"] || 0 },
          { name: "Neutral", value: sentimentCounts["Neutral"] || 0 },
          { name: "Negative", value: sentimentCounts["Negative"] || 0 },
        ]);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch trending topics from Google News
  useEffect(() => {
    async function fetchTrendingTopics() {
      try {
        const response = await fetch("/api/all-trends");
        const data = await response.json();
        
        if (data.topics && Array.isArray(data.topics)) {
          setTrendingTopics(data.topics);
        }
        setLoadingTrends(false);
      } catch (error) {
        console.error("Error fetching trending topics:", error);
        setLoadingTrends(false);
      }
    }
    
    fetchTrendingTopics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading dashboard...</div>
          <div className="text-zinc-600">Connecting to MongoDB</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2 text-red-600">Error</div>
          <div className="text-zinc-600">{error}</div>
          <div className="text-sm text-zinc-500 mt-4">
            Make sure to set MONGO_URI in your .env.local file
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            🔥 Real-time Trend & Sentiment Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Live analysis of trending topics and public sentiment
          </p>
        </header>

        {/* Search Section */}
        <div className="mb-8">
          <TopicSearch />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sentiment Distribution Pie Chart */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Overall Sentiment Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Topic Sentiment Bar Chart */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Topic Sentiment Analysis
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData.slice(0, 8)}>
                <XAxis 
                  dataKey="topic" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <Bar dataKey="positive" fill="#4ade80" name="Positive" />
                <Bar dataKey="negative" fill="#f87171" name="Negative" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chatbot Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Live Data Stream
                </h2>
                <button
                  onClick={async () => {
                    if (analysisLoading) return;
                    setAnalysisLoading(true);
                    setAnalysisProgress("Starting ML models...");
                    
                    try {
                      console.log("Starting ML Analysis...");
                      
                      // Update progress
                      setAnalysisProgress("Loading BERTopic model...");
                      await new Promise(resolve => setTimeout(resolve, 500));
                      
                      setAnalysisProgress("Analyzing posts with sentiment classifier...");
                      await new Promise(resolve => setTimeout(resolve, 500));
                      
                      setAnalysisProgress("Processing topics and clustering...");
                      await new Promise(resolve => setTimeout(resolve, 500));
                      
                      setAnalysisProgress("Storing results in MongoDB...");
                      
                      const response = await fetch("/api/run-analysis", { method: "POST" });
                      const data = await response.json();
                      
                      if (data.status === "success") {
                        console.log("✅ Analysis Complete!");
                        console.log("Results:", data.results);
                        
                        setAnalysisProgress("✅ Complete!");
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        alert(`✅ Analysis Complete!\n\nTopics: ${data.results.topics}\nProcessed: ${data.results.processed} posts\nPositive: ${data.results.positive}\nNegative: ${data.results.negative}`);
                        
                        // Refresh the dashboard data
                        window.location.reload();
                      } else {
                        console.error("Analysis failed:", data);
                        setAnalysisProgress("❌ Failed");
                        alert(`❌ Analysis Failed!\n\n${data.message}\n\n${data.error || ""}`);
                      }
                    } catch (err) {
                      console.error("Error running analysis:", err);
                      setAnalysisProgress("❌ Error");
                      alert(`❌ Error: ${err instanceof Error ? err.message : "Failed to run analysis"}`);
                    } finally {
                      setAnalysisLoading(false);
                      setAnalysisProgress("");
                    }
                  }}
                  disabled={analysisLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
                >
                  {analysisLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Running...
                    </>
                  ) : (
                    "🔬 Run ML Analysis"
                  )}
                </button>
              </div>
              
              {/* Progress Display */}
              {analysisProgress && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{analysisProgress}</span>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 max-h-[600px] overflow-y-auto">
                {trendData.map((trend, idx) => {
                  // Format topic name - limit to reasonable length and fix capitalization
                  let displayName = typeof trend.topic === 'string' ? trend.topic : `Topic ${trend.topic}`;
                  
                  // If name is too long, truncate it nicely
                  if (displayName.length > 60) {
                    displayName = displayName.substring(0, 57) + "...";
                  }
                  
                  return (
                    <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors border border-zinc-200 dark:border-zinc-600">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-50 text-base mb-2 leading-snug">
                            {displayName}
                          </div>
                          <div className="flex gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                              {trend.positive} positive
                            </span>
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                              </svg>
                              {trend.negative} negative
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                              </svg>
                              {trend.positive + trend.negative} total
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-[500px]">
            <TrendChatbot />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
            <div className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Total Topics</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {trendData.length}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
            <div className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Positive Sentiment</div>
            <div className="text-3xl font-bold text-green-600">
              {sentimentData.find(s => s.name === "Positive")?.value || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
            <div className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Negative Sentiment</div>
            <div className="text-3xl font-bold text-red-600">
              {sentimentData.find(s => s.name === "Negative")?.value || 0}
            </div>
          </div>
        </div>

        {/* Trending Topics Section */}
        <div className="mt-8 bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              🌐 Trending Topics from Internet
            </h2>
            {loadingTrends && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</div>
            )}
          </div>
          
          {loadingTrends ? (
            <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
              Fetching trending topics...
            </div>
          ) : Array.isArray(trendingTopics) && trendingTopics.length > 0 ? (
            <div className="space-y-4">
              {trendingTopics.map((topic, idx) => (
                topic && typeof topic === 'object' ? (
                <div 
                  key={idx}
                  className="p-4 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-700 dark:to-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                          {topic.category || 'Unknown'}
                        </span>
                        {topic.sentiment === "POSITIVE" && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                            📈 Positive
                          </span>
                        )}
                        {topic.sentiment === "NEGATIVE" && (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                            📉 Negative
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2 leading-relaxed">
                        {topic.text || 'No title'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium">{topic.source || 'Unknown'}</span>
                        <span>•</span>
                        <a 
                          href={topic.url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Read More
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                ) : null
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
              No trending topics available at the moment.
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-sm text-zinc-500">
          Auto-refreshing every 10 seconds
        </footer>
      </div>
    </div>
  );
}
