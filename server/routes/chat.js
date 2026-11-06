import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import agent from "../LLM.js";

const messageText = (content) => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) =>
      typeof part === "string" ? part : (part?.text ?? part?.content ?? ""),
    )
    .join("");
};

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const { messages } = req.body ?? {};
  const userId = req.user?.sub ?? "unknown";

  console.log(
    `[chat] request from user=${userId} messages=${
      Array.isArray(messages) ? messages.length : "invalid"
    }`,
  );

  if (!Array.isArray(messages) || messages.length === 0) {
    console.warn(`[chat] rejected user=${userId}: messages must be non-empty`);
    return res
      .status(400)
      .json({ message: "messages must be a non-empty array" });
  }

  const history = messages
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    console.warn(
      `[chat] rejected user=${userId}: last message must be from the user`,
    );
    return res
      .status(400)
      .json({ message: "The last message must be from the user" });
  }

  const lastUserMessage = history[history.length - 1].content;
  console.log(
    `[chat] generating user=${userId} history=${history.length} prompt="${lastUserMessage.slice(
      0,
      120,
    )}"`,
  );

  const startedAt = Date.now();

  try {
    const result = await agent.invoke({ messages: history });
    const reply = result.messages.at(-1);
    const content = messageText(reply?.content).trim();

    if (!content) {
      console.warn(
        `[chat] empty response user=${userId} duration=${Date.now() - startedAt}ms`,
      );
      return res
        .status(502)
        .json({ message: "The assistant returned an empty response" });
    }

    console.log(
      `[chat] reply user=${userId} duration=${
        Date.now() - startedAt
      }ms chars=${content.length}`,
    );

    return res.json({ message: { role: "assistant", content } });
  } catch (error) {
    console.error(
      `[chat] failed user=${userId} duration=${Date.now() - startedAt}ms`,
      error,
    );
    return res
      .status(500)
      .json({ message: "Failed to generate a response. Please try again." });
  }
});

export default router;
