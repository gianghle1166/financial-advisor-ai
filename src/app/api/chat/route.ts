import { NextRequest, NextResponse } from "next/server";

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface ChatRequestBody {
  messages: ChatMessage[];
  context?: {
    profile?: Record<string, unknown>;
    projection?: Record<string, unknown>;
    allocation?: Record<string, unknown>;
  };
  useGrounding?: boolean;
}

const SYSTEM_PROMPT = `You are a helpful, cautious financial planning assistant embedded in a retirement planning app. The user has already received their initial financial plan and is now asking follow-up questions.

Rules:
- Provide concise, actionable answers about retirement planning, savings, investing, and tax strategy.
- Avoid specific stock picks or crypto recommendations.
- When the user asks "what if" scenarios, use the financial context provided to give personalized estimates.
- If asked about current market conditions, use the search grounding results if available.
- Keep answers under 200 words unless the user asks for detail.
- Always include a brief disclaimer that this is not professional financial advice when giving specific recommendations.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, context, useGrounding } = (await request.json()) as ChatRequestBody;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        { error: "Chat requires a Google API key. Add GOOGLE_API_KEY to .env.local." },
        { status: 503 }
      );
    }

    // Build context string from financial data
    let contextText = SYSTEM_PROMPT;
    if (context) {
      contextText += "\n\nUser's financial context:\n";
      if (context.profile) contextText += `Profile: ${JSON.stringify(context.profile)}\n`;
      if (context.projection) contextText += `Projections: ${JSON.stringify(context.projection)}\n`;
      if (context.allocation) contextText += `Allocation: ${JSON.stringify(context.allocation)}\n`;
    }

    // Prepend system context as the first user message + model acknowledgment
    const contents: ChatMessage[] = [
      { role: "user", parts: [{ text: contextText }] },
      { role: "model", parts: [{ text: "Understood. I have your financial context and I'm ready to help with follow-up questions about your retirement plan." }] },
      ...messages,
    ];

    // Build request body with optional Google Search grounding
    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    if (useGrounding) {
      requestBody.tools = [{ googleSearch: {} }];
    }

    const models = ["gemini-2.5-flash", "gemini-2.5-flash-preview-05-20", "gemini-1.5-flash"];
    let res: Response | null = null;

    for (const model of models) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (res.ok) break;

      const errorBody = await res.text();
      console.warn(`Gemini chat model ${model} failed (${res.status}):`, errorBody);
    }

    if (!res || !res.ok) {
      throw new Error(`Gemini API error: all models failed`);
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string") {
      throw new Error("Unexpected Gemini response format");
    }

    // Extract grounding metadata if present
    const groundingMetadata = json?.candidates?.[0]?.groundingMetadata;

    return NextResponse.json({
      reply: text.trim(),
      grounded: !!groundingMetadata,
      sources: groundingMetadata?.groundingChunks?.map(
        (chunk: { web?: { uri?: string; title?: string } }) => ({
          url: chunk.web?.uri,
          title: chunk.web?.title,
        })
      ) || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Chat error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
