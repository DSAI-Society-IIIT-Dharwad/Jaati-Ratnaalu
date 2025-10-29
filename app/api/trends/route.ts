import { MongoClient } from "mongodb";

export async function GET() {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      // Return empty array instead of error
      console.log("MONGO_URI not set, returning empty array");
      return Response.json([]);
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db("trenddb");
    const posts = await db.collection("posts").find({}).limit(1000).toArray();
    await client.close();

    return Response.json(posts);
  } catch (error) {
    console.error("Error fetching trends:", error);
    // Return empty array instead of error object
    return Response.json([]);
  }
}

