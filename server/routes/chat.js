import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import agent, { llm } from "../LLM.js";
import {
  getCachedResponse,
  setCachedResponse,
} from "../lib/responseCache.js";

const model = llm?.model ?? "unknown";
const timeoutMs = Number(process.env.CHAT_TIMEOUT_MS ?? 60000);

const withTimeout = (promise, ms, message, onTimeout) => {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      onTimeout?.();
      reject(new Error(message));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const startEventStream = (res) => {
  res.status(200).set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
};

const sendEvent = (res, event, data) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

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

  const cached = getCachedResponse(userId, history);
  if (cached) {
    console.log(
      `[chat] served from cache model=${model} user=${userId} history=${
        history.length
      } exact=${cached.exact} score=${cached.score.toFixed(2)} chars=${
        cached.content.length
      } prompt="${lastUserMessage.slice(0, 120)}"`,
    );

    startEventStream(res);
    sendEvent(res, "chunk", { content: cached.content });
    sendEvent(res, "done", {});
    return res.end();
  }

  console.log(
    `[chat] generating model=${model} user=${userId} history=${
      history.length
    } prompt="${lastUserMessage.slice(0, 120)}"`,
  );

  const startedAt = Date.now();
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });
  startEventStream(res);

  try {
    const result = await withTimeout(
      (async () => {
        let content = "";
        const stream = await agent.stream(
          { messages: history },
          { streamMode: "messages", signal: controller.signal },
        );

        for await (const [chunk] of stream) {
          const text = messageText(chunk?.content);
          if (!text) continue;

          content += text;
          sendEvent(res, "chunk", { content: text });
        }

        return content.trim();
      })(),
      timeoutMs,
      `Chat timed out after ${timeoutMs}ms`,
      () => controller.abort(),
    );
    const content = result;

    if (!content) {
      console.warn(
        `[chat] empty response model=${model} user=${userId} duration=${
          Date.now() - startedAt
        }ms`,
      );
      sendEvent(res, "error", {
        message: "The assistant returned an empty response",
      });
      return res.end();
    }

    setCachedResponse(userId, history, content);

    console.log(
      `[chat] reply model=${model} user=${userId} duration=${
        Date.now() - startedAt
      }ms chars=${content.length}`,
    );

    sendEvent(res, "done", {});
    return res.end();
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    const timedOut = text.includes("timed out");
    const rateLimited = /quota|rate limit|429|resource_exhausted/i.test(text);

    console.error(
      `[chat] failed model=${model} user=${userId} duration=${
        Date.now() - startedAt
      }ms${timedOut ? " reason=timeout" : ""}${
        rateLimited ? " reason=rate_limited" : ""
      }`,
      error,
    );

    let message = "Failed to generate a response. Please try again.";
    if (timedOut) {
      message = "The assistant took too long to respond. Please try again.";
    } else if (rateLimited) {
      message =
        "The AI service is rate-limited right now. Please try again later.";
    }

    if (!res.destroyed) {
      sendEvent(res, "error", { message });
      return res.end();
    }
  }
});

export default router;
