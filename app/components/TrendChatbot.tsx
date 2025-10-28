"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TrendChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch trending topics on mount
  useEffect(() => {
    async function loadTrendingTopics() {
      try {
        const response = await fetch("/api/all-trends");
        const data = await response.json();
        
        if (data.topics) {
          setTrendingTopics(data.topics);
        }
        
        setLoadingTrends(false);
      } catch (error) {
        console.error("Error loading trends:", error);
        setLoadingTrends(false);
      }
    }
    
    loadTrendingTopics();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    const userQuestion = input;
    setInput("");
    setLoading(true);

    // Check if user wants to run ML analysis
    if (userQuestion.toLowerCase().includes("run analysis") ||
        userQuestion.toLowerCase().includes("analyze") ||
        userQuestion.toLowerCase().includes("run model") ||
        userQuestion.toLowerCase().includes("show analysis")) {
      
      // Run the ML analysis
      try {
        const response = await fetch("/api/run-analysis", {
          method: "POST",
        });

        const data = await response.json();
        
        if (data.status === "success") {
          let responseText = `🤖 **ML Analysis Complete!**\n\n`;
          responseText += `📊 **Results:**\n`;
          responseText += `• Topics detected: ${data.results.topics}\n`;
          responseText += `• Posts processed: ${data.results.processed}\n`;
          responseText += `• Positive sentiment: ${data.results.positive}\n`;
          responseText += `• Negative sentiment: ${data.results.negative}\n`;
          responseText += `• Neutral: ${data.results.processed - data.results.positive - data.results.negative}\n\n`;
          
          if (data.results.topicInfo) {
            responseText += `**Topic Breakdown:**\n\`\`\`\n${data.results.topicInfo}\n\`\`\`\n`;
          }
          
          setMessages(prev => [...prev, { role: "assistant", content: responseText }]);
        } else {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: `Error: ${data.message}\n\nSuggestion: ${data.suggestion || "Try running python analyze.py manually"}` 
          }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Error running ML analysis. Make sure the Python environment is set up correctly." 
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Check if user is asking for trending topics
    if (userQuestion.toLowerCase().includes("trending") || 
        userQuestion.toLowerCase().includes("what's trending") ||
        userQuestion.toLowerCase().includes("show trends") ||
        userQuestion.toLowerCase().includes("latest news")) {
      
      // Fetch trending topics from internet
      try {
        const response = await fetch("/api/all-trends");
        const data = await response.json();
        
        if (data.topics && data.topics.length > 0) {
          let responseText = `🌐 **Here are the latest trending topics from the internet:**\n\n`;
          
          // Group by category
          const categories: Record<string, any[]> = {};
          data.topics.forEach((topic: any) => {
            if (!categories[topic.category]) {
              categories[topic.category] = [];
            }
            categories[topic.category].push(topic);
          });
          
          Object.entries(categories).forEach(([category, topics]) => {
            responseText += `**📰 ${category}:**\n`;
            topics.forEach((topic: any, idx: number) => {
              const emoji = topic.sentiment === "POSITIVE" ? "📈" : topic.sentiment === "NEGATIVE" ? "📉" : "➡️";
              responseText += `${idx + 1}. ${emoji} ${topic.text}\n   Source: ${topic.source} - [Open](${topic.url})\n`;
            });
            responseText += `\n`;
          });
          
          setMessages(prev => [...prev, { role: "assistant", content: responseText }]);
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: "Could not fetch trending topics. Try again." }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { role: "assistant", content: "Error fetching trending topics from the internet." }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      });

      const data = await response.json();
      
      if (response.ok && data.answer) {
        // Add initial response
        setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
        
        // If there's a live search trigger, fetch trending topics from the internet
        if (data.liveSearch && data.liveSearch.trigger && data.liveSearch.keyword) {
          const keyword = data.liveSearch.keyword;
          
          try {
            // Try semantic search first for better results
            const searchResponse = await fetch("/api/semantic-search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: keyword, numResults: 10 }),
            });

            const searchData = await searchResponse.json();
            
            if (searchResponse.ok && searchData.results && searchData.results.length > 0) {
              // Semantic search results
              let resultText = `🔍 **Semantic Search Results** for "${keyword}":\n\n`;
              
              searchData.results.forEach((result: any, idx: number) => {
                const doc = result.document;
                const sentimentEmoji = doc.sentiment === "POSITIVE" ? "📈" : doc.sentiment === "NEGATIVE" ? "📉" : "➡️";
                const textPreview = doc.text.substring(0, 150);
                resultText += `${idx + 1}. ${sentimentEmoji} (Score: ${result.score.toFixed(3)})\n`;
                resultText += `   ${textPreview}...\n`;
                resultText += `   📱 Sentiment: ${doc.sentiment}\n`;
                if (doc.url) {
                  resultText += `   🔗 [View Source ↗](${doc.url})\n`;
                }
                resultText += `\n`;
              });
              
              if (searchData.sentiment) {
                resultText += `📊 **Overall Sentiment:** ${searchData.sentiment.positivePercent}% positive, ${searchData.sentiment.negativePercent}% negative\n`;
                resultText += `📝 **Results found:** ${searchData.results.length}\n`;
              }
              
              setMessages(prev => [...prev, { 
                role: "assistant", 
                content: resultText 
              }]);
            } else if (searchResponse.ok && searchData.trendingTopics) {
              // Fallback to live search
              const dataType = searchData.isSimulated 
                ? "⚠️ **Simulated trending topics**" 
                : "🌐 **Real-time trending topics**";
              const source = searchData.source || "internet";
              
              let resultText = `${dataType} about "${keyword}" from the ${source}:**\n\n`;
              
              searchData.trendingTopics.forEach((topic: any, idx: number) => {
                const sentimentEmoji = topic.sentiment === "POSITIVE" ? "📈" : topic.sentiment === "NEGATIVE" ? "📉" : "➡️";
                resultText += `${idx + 1}. ${sentimentEmoji} **${topic.text}**\n   📱 Source: ${topic.source}\n   🔗 [Open Link ↗](${topic.url})\n\n`;
              });
              
              resultText += `📊 **Overall Sentiment:** ${searchData.sentimentSummary.positivePercent}% positive, ${searchData.sentimentSummary.negativePercent}% negative\n`;
              resultText += `🌐 **Sources:** Twitter, Reddit, News, LinkedIn\n`;
              resultText += `⏰ **Fetched:** ${new Date().toLocaleString()}\n`;
              
              if (searchData.message) {
                resultText += `\n${searchData.message}\n`;
              }
              
              setMessages(prev => [...prev, { 
                role: "assistant", 
                content: resultText 
              }]);
            } else {
              setMessages(prev => [...prev, { 
                role: "assistant", 
                content: "⚠️ Could not fetch trending topics from the internet. Try again or check your connection." 
              }]);
            }
          } catch (searchError) {
            setMessages(prev => [...prev, { 
              role: "assistant", 
              content: "⚠️ Error connecting to internet trends. Make sure Python script is available." 
            }]);
          }
        }
      } else {
        console.error("API returned error:", data);
        setMessages(prev => [...prev, { role: "assistant", content: data.error || "Sorry, I couldn't process that. Try again!" }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to the server. Please check console for details." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          💬 Trend Chatbot
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Ask me about trends, sentiment, or run analysis
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 text-center py-8">
            👋 Hi! Try asking:<br/>
            • "What's trending?"<br/>
            • "Run analysis"<br/>
            • "Show sentiment"
          </div>
        )}
        {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
                }`}
              >
                <div 
                  className="text-sm whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')
                  }}
                />
              </div>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about trends, sentiment, topics..."
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

