"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import TrendChatbot from "./components/TrendChatbot";

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

const COLORS = ['#4ade80', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];

export default function Home() {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [sentimentData, setSentimentData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/trends");
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        const posts: PostData[] = await res.json();

        // Check if we have any data
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
          posts && posts.length > 0
            ? Object.values(
                posts.reduce((acc, post) => {
                  if (!post || !post.sentiment) return acc;
                  // Use topic_name if available, otherwise fallback to "Topic X"
                  const topicKey = post.topic_name || `Topic ${post.topic}`;
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
          posts && posts.length > 0
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Live Data Stream
              </h2>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                {trendData.slice(0, 5).map((trend, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-700 rounded">
                    <div className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">
                      {typeof trend.topic === 'string' ? trend.topic : `Topic ${trend.topic}`}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs">
                      <span className="text-green-600">✓ {trend.positive} positive</span>
                      <span className="text-red-600">✗ {trend.negative} negative</span>
                    </div>
                  </div>
                ))}
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

        <footer className="mt-8 text-center text-sm text-zinc-500">
          Auto-refreshing every 10 seconds
        </footer>
      </div>
    </div>
  );
}
