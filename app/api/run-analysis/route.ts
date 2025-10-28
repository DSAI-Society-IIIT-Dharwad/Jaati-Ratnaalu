import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Run the actual Python analysis script
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      return NextResponse.json(
        { error: "MONGO_URI not configured" },
        { status: 500 }
      );
    }

    // Run the analysis
    const { stdout, stderr } = await execAsync(
      `python analyze.py`,
      { 
        maxBuffer: 1024 * 1024 * 10,
        env: { ...process.env, MONGO_URI: mongoUri }
      }
    );
    
    // Parse the output to extract key information
    const output = stdout + stderr;
    
    // Extract topic information
    const topicMatches = output.match(/Detected (\d+) topics/);
    const topicCount = topicMatches ? topicMatches[1] : "unknown";
    
    // Extract processed count
    const processedMatch = output.match(/Processed (\d+) posts/);
    const processedCount = processedMatch ? processedMatch[1] : "unknown";
    
    // Extract sentiment counts
    const positiveMatch = output.match(/Positive: (\d+)/);
    const positive = positiveMatch ? positiveMatch[1] : "0";
    const negativeMatch = output.match(/Negative: (\d+)/);
    const negative = negativeMatch ? negativeMatch[1] : "0";
    
    // Extract topics if available
    const topicInfoLines = [];
    const lines = output.split('\n');
    let inTopicSection = false;
    
    for (const line of lines) {
      if (line.includes('Topic  Count')) {
        inTopicSection = true;
        topicInfoLines.push(line);
      } else if (inTopicSection && line.trim() && !line.startsWith('---') && line.includes('Topic')) {
        topicInfoLines.push(line);
      } else if (inTopicSection && line.trim() === '') {
        inTopicSection = false;
      }
    }
    
    return NextResponse.json({
      status: "success",
      message: "ML models ran successfully!",
      results: {
        topics: topicCount,
        processed: processedCount,
        positive: parseInt(positive),
        negative: parseInt(negative),
        topicInfo: topicInfoLines.join('\n'),
        rawOutput: output.split('\n').slice(-30).join('\n') // Last 30 lines
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: "Failed to run analysis",
      error: error.message,
      suggestion: "Make sure Python and dependencies are installed"
    }, { status: 500 });
  }
}

