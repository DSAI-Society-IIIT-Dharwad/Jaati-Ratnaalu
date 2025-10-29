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

  const analyzePersonalSentiment = async (text: string) => {
    try {
      const response = await fetch("/api/analyze-sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      let responseText = generateSentimentResponse(data.positive || 0, data.negative || 0);
      setMessages(prev => [...prev, { role: "assistant", content: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't analyze your sentiment. Please try again." }]);
    }
  };

  const generateSentimentResponse = (pos: number, neg: number): string => {
    if (pos > 0.8 && neg < 0.2) return "That's wonderful! 😄";
    if (pos > 0.6 && neg < 0.4) return "Glad you're feeling good! 🙂";
    if (pos >= 0.4 && pos <= 0.6 && neg >= 0.4 && neg <= 0.6) return "I'm here for you 😐";
    if (pos < 0.4 && neg > 0.6) return "I'm sorry you're feeling this way 😟";
    if (pos < 0.2 && neg > 0.8) return "Take a deep breath 😠";
    if (pos < 0.3 && neg < 0.3) return "Would you like to talk more? 😕";
    if (pos > 0.7 && neg > 0.3) return "Let's work through this together 😬";
    if (pos < 0.3 && neg > 0.7) return "I'm here with you 😞";
    return "礁Tell me more about how you're feeling";
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    const userQuestion = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      });

      const data = await response.json();

      if (response.ok && data.answer) {
        setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.error || "Sorry, I couldn't process that request." 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Error connecting to the server. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          💬 Friend - Sentiment Chatbot
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Analyze personal mood or public sentiment on topics
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 text-center py-8">
            🤖 Hello! I can:<br/>
            • Analyze your personal mood<br/>
            • Analyze public sentiment on any topic<br/><br/>
            Try: "news about AI" or "how do people feel about climate change?"
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
