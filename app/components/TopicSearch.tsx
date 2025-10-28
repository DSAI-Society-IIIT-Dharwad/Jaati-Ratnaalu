"use client";
import { useState } from "react";

interface SearchResult {
  query: string;
  relatedTopics: Array<{
    name: string;
    count: number;
    positive: number;
    negative: number;
    neutral: number;
    positivePercent: string;
    negativePercent: string;
  }>;
  sentimentSummary: {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
  };
  examplePosts: Array<{
    text: string;
    topic: string;
    sentiment: string;
    similarity: string;
  }>;
  message?: string;
  suggestions?: string[];
}

export default function TopicSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for trending topics (e.g., AI, healthcare, startups)..."
          className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "Searching..." : "🔍 Search"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              🔍 Results for "{result.query}"
            </h2>
            {result.sentimentSummary && (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {result.sentimentSummary.total} matches
              </span>
            )}
          </div>

          {/* No Results */}
          {result.message && (
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-400 mb-3">{result.message}</p>
              {result.suggestions && (
                <ul className="list-disc list-inside text-sm">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-yellow-700 dark:text-yellow-500">{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Related Topics */}
          {result.relatedTopics && result.relatedTopics.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                📊 Related Trending Topics
              </h3>
              <div className="space-y-3">
                {result.relatedTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {topic.name}
                      </h4>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {topic.count} posts
                      </span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-green-600">
                        ✓ {topic.positive} positive ({topic.positivePercent}%)
                      </div>
                      <div className="text-red-600">
                        ✗ {topic.negative} negative ({topic.negativePercent}%)
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400">
                        ○ {topic.neutral} neutral
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment Summary */}
          {result.sentimentSummary && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                💭 Overall Sentiment
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {result.sentimentSummary.positive}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-500">
                    {((result.sentimentSummary.positive / result.sentimentSummary.total) * 100).toFixed(1)}% Positive
                  </div>
                </div>
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                  <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                    {result.sentimentSummary.neutral}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {((result.sentimentSummary.neutral / result.sentimentSummary.total) * 100).toFixed(1)}% Neutral
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {result.sentimentSummary.negative}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-500">
                    {((result.sentimentSummary.negative / result.sentimentSummary.total) * 100).toFixed(1)}% Negative
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Example Posts */}
          {result.examplePosts && result.examplePosts.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                💬 Example Mentions
              </h3>
              <div className="space-y-3">
                {result.examplePosts.map((post, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-700/30"
                  >
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">{post.text}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium">{post.topic}</span>
                      <span className={`px-2 py-1 rounded ${
                        post.sentiment === "POSITIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        post.sentiment === "NEGATIVE" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {post.sentiment}
                      </span>
                      <span>Relevance: {(parseFloat(post.similarity) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

