import { MongoClient } from "mongodb";

export async function GET() {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      return Response.json(
        { error: "MONGO_URI environment variable is not set" },
        { status: 500 }
      );
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db("trenddb");
    const posts = await db.collection("posts").find({}).limit(1000).toArray();
    await client.close();

    return Response.json(posts);
  } catch (error) {
    console.error("Error fetching trends:", error);
    return Response.json(
      { error: "Failed to fetch trends data" },
      { status: 500 }
    );
  }
}

