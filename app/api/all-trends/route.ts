import { NextResponse } from "next/server";

export async function GET() {
  // Return static trending topics
  const staticData = {
    topics: [
      { text: "Cyclone Montha hits Andhra Pradesh", category: "Climate & Environment", source: "NDTV", sentiment: "NEGATIVE", url: "https://ndtv.com" },
      { text: "Bihar Mahagathbandhan manifesto promises 1 job per family", category: "Politics", source: "Hindustan Times", sentiment: "POSITIVE", url: "https://ht.com" },
      { text: "OpenAI launches GPT-5 with breakthrough capabilities", category: "Technology", source: "TechCrunch", sentiment: "POSITIVE", url: "https://techcrunch.com" },
      { text: "AI automation threatens 40% of jobs by 2030", category: "Technology", source: "Reuters", sentiment: "NEGATIVE", url: "https://reuters.com" },
      { text: "Bitcoin surges to new all-time high", category: "Finance", source: "CoinDesk", sentiment: "POSITIVE", url: "https://coindesk.com" },
      { text: "AI-powered healthcare revolutionizes diagnostics", category: "Healthcare", source: "Nature", sentiment: "POSITIVE", url: "https://nature.com" },
      { text: "Quantum computing breakthrough at MIT", category: "Science", source: "Science Daily", sentiment: "POSITIVE", url: "https://sciencedaily.com" },
      { text: "COP28 reaches historic climate agreement", category: "Climate", source: "BBC", sentiment: "POSITIVE", url: "https://bbc.com" },
      { text: "Electric vehicles adoption breaks records worldwide", category: "Climate & Environment", source: "The Guardian", sentiment: "POSITIVE", url: "https://guardian.com" },
      { text: "INDIA bloc releases joint manifesto in Bihar elections", category: "Politics", source: "NDTV", sentiment: "NEUTRAL", url: "https://ndtv.com/politics" },
      { text: "Google DeepMind announces new AI model", category: "Technology", source: "Wired", sentiment: "POSITIVE", url: "https://wired.com" },
      { text: "New breakthrough in cancer treatment announced", category: "Healthcare", source: "Medical News", sentiment: "POSITIVE", url: "https://medicalnews.com" },
      { text: "Crypto regulations tighten globally", category: "Finance", source: "Financial Times", sentiment: "NEGATIVE", url: "https://ft.com" },
      { text: "NASA discovers new exoplanet with potential for life", category: "Science", source: "NASA", sentiment: "POSITIVE", url: "https://nasa.gov" },
      { text: "Tejashwi Yadav presents Mahagathbandhan promises", category: "Politics", source: "India Today", sentiment: "NEUTRAL", url: "https://indiatoday.in" },
      { text: "Mental health AI support shows promising results", category: "Healthcare", source: "Psychology Today", sentiment: "POSITIVE", url: "https://psychologytoday.com" },
      { text: "AI startups raise $50B in Q3 funding", category: "Finance", source: "Crunchbase", sentiment: "POSITIVE", url: "https://crunchbase.com" },
      { text: "Gene therapy revolutionizes treatment for rare diseases", category: "Science", source: "Science Mag", sentiment: "POSITIVE", url: "https://science.org" },
    ],
    total: 18,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(staticData);
}

