import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "No API key" });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await res.json();
    const modelNames = data.models?.slice(0, 5).map((m: { name: string }) => m.name) || [];
    return NextResponse.json({
      status: res.status,
      keyPrefix: apiKey.substring(0, 6),
      keyLength: apiKey.length,
      models: modelNames,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Unknown error",
      keyPrefix: apiKey.substring(0, 6),
      keyLength: apiKey.length,
    });
  }
}
