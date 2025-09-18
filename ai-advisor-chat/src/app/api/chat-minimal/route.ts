import { streamText, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
  advisorId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    console.log("=== MINIMAL CHAT API START ===");
    console.log("Step 1: Parsing request...");
    
    const body = await req.json();
    const { messages } = requestSchema.parse(body);
    console.log("Step 1 SUCCESS: Request parsed, messages:", messages.length);

    console.log("Step 2: Environment check...");
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("Step 2 FAILED: Missing OPENROUTER_API_KEY");
      return new Response("Missing API key", { status: 500 });
    }
    console.log("Step 2 SUCCESS: API key present, length:", apiKey.length);

    console.log("Step 3: Creating OpenRouter client...");
    const openrouterClient = createOpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "AI Advisor Chat Minimal Test",
      },
    });
    console.log("Step 3 SUCCESS: OpenRouter client created");

    console.log("Step 4: Preparing AI messages...");
    const aiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    console.log("Step 4 SUCCESS: AI messages prepared:", aiMessages.length);

    console.log("Step 5: Testing direct OpenRouter API call...");
    const modelName = "x-ai/grok-code-fast-1"; // Using specified model exclusively
    console.log("Step 5a: Using model:", modelName);

    // Test direct API call first to verify the API key
    try {
      const directResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "AI Advisor Chat Test",
        },
        body: JSON.stringify({
          model: modelName,
          messages: aiMessages,
          temperature: 0.7,
        }),
      });

      console.log("Step 5b: Direct API response status:", directResponse.status);
      console.log("Step 5c: Direct API response headers:", Object.fromEntries(directResponse.headers.entries()));

      const responseText = await directResponse.text();
      console.log("Step 5d: Direct API response text (first 500 chars):", responseText.substring(0, 500));

      if (!directResponse.ok) {
        return new Response(`Direct API test failed: ${directResponse.status} - ${responseText}`, {
          status: 500,
          headers: {
            "X-Error": "direct-api-test-failed",
            "X-Status": directResponse.status.toString(),
          }
        });
      }

      // Parse the successful response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        console.log("Step 5e: Direct API test SUCCESS - parsed response");

        // Extract the AI response text
        const aiResponseText = parsedResponse.choices?.[0]?.message?.content || "No response content";
        console.log("Step 5f: AI response text:", aiResponseText.substring(0, 200));

        return new Response(aiResponseText as string, {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
            "X-Test": "direct-api-success",
            "X-Model": modelName,
          },
        });

      } catch (parseError: any) {
        console.error("Step 5e: Failed to parse successful response:", parseError.message);
        return new Response(`Parse error: ${parseError.message}`, { status: 500 });
      }

    } catch (directError: any) {
      console.error("Step 5b FAILED: Direct API test error:", directError.message);
      return new Response(`Direct API test error: ${directError.message}`, {
        status: 500,
        headers: {
          "X-Error": "direct-api-test-error",
        }
      });
    }

  } catch (error: any) {
    console.error("MINIMAL CHAT ERROR:", error.message);
    console.error("Error stack:", error.stack);

    // Log additional error details if available
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
      console.error("Error response data:", error.response.data);
    }
    if (error.request) {
      console.error("Error request:", error.request);
    }

    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: {
        "X-Error": "minimal-chat-failed",
        "X-Error-Message": error.message,
      }
    });
  }
}
