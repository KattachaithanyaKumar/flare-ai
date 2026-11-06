import "dotenv/config";
import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createAgent } from "langchain";

const provider = (
  process.env.LLM_PROVIDER ??
  (process.env.GEMINI_API_KEY ? "gemini" : "ollama")
).toLowerCase();

const createOllama = () =>
  new ChatOllama({
    model: process.env.OLLAMA_MODEL ?? "qwen3:8b",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    temperature: 0,
    numCtx: 8192,
    think: process.env.OLLAMA_THINK === "true",
    keepAlive: process.env.OLLAMA_KEEP_ALIVE ?? "30m",
  });

const createGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER=gemini");
  }

  return new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    apiKey,
    temperature: 0,
  });
};

export const llm = provider === "gemini" ? createGemini() : createOllama();

export const agent = createAgent({
  model: llm,
});

export default agent;
