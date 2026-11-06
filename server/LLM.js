import "dotenv/config";
import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";

export const llm = new ChatOllama({
  model: process.env.OLLAMA_MODEL ?? "qwen3:8b",
  baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  temperature: 0,
  numCtx: 8192,
  think: process.env.OLLAMA_THINK === "true",
  keepAlive: process.env.OLLAMA_KEEP_ALIVE ?? "30m",
});

export const agent = createAgent({
  model: llm,
});

export default agent;
