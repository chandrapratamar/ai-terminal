import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { APICallError } from "ai";

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

      return result.toDataStreamResponse({
        getErrorMessage: (error) => {
          // No logging
          if (error == null) {
            return 'Unknown error.';
          }
          if (typeof error === 'string') {
            return error;
          }
          if (error instanceof Error) {
            // Forward specific messages for quota and invalid key
            if (error.message.toLowerCase().includes('quota')) {
              return 'Quota exceeded. Please check your plan or API usage.';
            }
            if (error.message.toLowerCase().includes('invalid api key')) {
              return 'Invalid API key. Please check your key.';
            }
            return error.message;
          }
          return JSON.stringify(error);
        }
      });
    } else if (provider === "anthropic") {
      const anthropic = createAnthropic({
        apiKey
      });

      const result = streamText({
        model: anthropic(model),
        messages
      });

      return result.toDataStreamResponse({
        getErrorMessage: (error) => {
          // No logging
          if (error == null) {
            return 'Unknown error.';
          }
          if (typeof error === 'string') {
            return error;
          }
          if (error instanceof Error) {
            // Forward specific messages for quota and invalid key
            if (error.message.toLowerCase().includes('quota')) {
              return 'Quota exceeded. Please check your plan or API usage.';
            }
            if (error.message.toLowerCase().includes('invalid api key')) {
              return 'Invalid API key. Please check your key.';
            }
            return error.message;
          }
          return JSON.stringify(error);
        }
      });
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

      return result.toDataStreamResponse({
        getErrorMessage: (error) => {
          // No logging
          if (error == null) {
            return 'Unknown error.';
          }
          if (typeof error === 'string') {
            return error;
          }
          if (error instanceof Error) {
            // Forward specific messages for quota and invalid key
            if (error.message.toLowerCase().includes('quota')) {
              return 'Quota exceeded. Please check your plan or API usage.';
            }
            if (error.message.toLowerCase().includes('invalid api key')) {
              return 'Invalid API key. Please check your key.';
            }
            return error.message;
          }
          return JSON.stringify(error);
        }
      });
    }

    return new Response("Invalid provider", { status: 400 });
  } catch (error: any) {
    if (APICallError && APICallError.isInstance && APICallError.isInstance(error)) {
      if (error.statusCode === 400) {
        return new Response("Invalid API key. Please check your key.", { status: 400 });
      }
      if (error.statusCode === 429) {
        return new Response("Quota exceeded. Please check your plan or API usage.", { status: 429 });
      }
    }
    return new Response(error.message || "An error occurred during your request.", {
      status: error.status || 500,
    });
  }
} 