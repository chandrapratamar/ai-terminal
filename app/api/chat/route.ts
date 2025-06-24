import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, model, provider, apiKey } = await req.json();

  if (!apiKey) {
    return new Response("API key is required", { status: 401 });
  }

  try {
    if (provider === "openai") {
      const openai = createOpenAI({
        apiKey
      });

      const result = streamText({
        model: openai(model),
        messages
      });

      return result.toDataStreamResponse();
    } else if (provider === "anthropic") {
      const anthropic = createAnthropic({
        apiKey
      });

      const result = streamText({
        model: anthropic(model),
        messages
      });

      return result.toDataStreamResponse();
    } else if (provider === "deepseek") {
      // Deepseek uses the OpenAI-compatible API, so we can use the OpenAI provider
      // but with a custom baseURL pointing to Deepseek's API
      const deepseek = createOpenAI({
        apiKey,
        baseURL: "https://api.deepseek.com/v1"
      });

      const result = streamText({
        model: deepseek(model),
        messages
      });

      return result.toDataStreamResponse();
    }

    return new Response("Invalid provider", { status: 400 });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return new Response(error.message || "An error occurred during your request.", {
      status: error.status || 500,
    });
  }
} 