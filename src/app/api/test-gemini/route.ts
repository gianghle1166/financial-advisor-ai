import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "No API key" });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: "Say hello in one sentence." }] },
          ],
          generationConfig: {
            maxOutputTokens: 50,
          },
        }),
      }
    );

    if (!res.ok) {
      const errorBody = await res.text();
      return NextResponse.json({
        status: res.status,
        statusText: res.statusText,
        error: errorBody,
      });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json({
      status: res.status,
      reply: text,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
