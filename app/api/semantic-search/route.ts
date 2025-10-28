import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { query, numResults } = await request.json();
    
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Please provide a search query" },
        { status: 400 }
      );
    }

    console.log(`🔍 Semantic search for: "${query}"`);
    
    try {
      // Call Python semantic search script
      const { stdout, stderr } = await execAsync(
        `python "${process.cwd()}/semantic_search.py" "${query}" ${numResults || 5}`,
        { 
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10,
          timeout: 30000
        }
      );
      
      if (stdout && stdout.trim()) {
        // Parse JSON output from Python
        const output = stdout.trim();
        const jsonStart = output.indexOf('{');
        const jsonStr = output.substring(jsonStart);
        const data = JSON.parse(jsonStr);
        
        console.log(`✅ Found ${data.results?.length || 0} results`);
        
        return NextResponse.json({
          query,
          results: data.results || [],
          sentiment: data.sentiment || {},
          success: true
        });
      } else {
        throw new Error("No output from semantic search");
      }
      
    } catch (error: any) {
      console.error("Error in semantic search:", error);
      
      return NextResponse.json({
        error: "Failed to perform semantic search",
        message: error.message,
        success: false
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Semantic search route error:", error);
    return NextResponse.json(
      { error: "Failed to process search request" },
      { status: 500 }
    );
  }
}

