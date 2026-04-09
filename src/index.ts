import "dotenv/config";
import * as readline from "readline";
import { Brain, OpenAICompatibleAdapter } from "@the-brain/core";
import { SQLiteStorageAdapter } from "@the-brain/adapter-sqlite";
import { COPYRIGHT_PERSONALITY } from "./personality.js";
import { copyrightActions } from "./actions.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const LLM_URL = process.env.LLM_API_URL ?? "http://localhost:11434/v1/chat/completions";
const LLM_MODEL = process.env.LLM_MODEL ?? "llama3.2";
const LLM_API_KEY = process.env.LLM_API_KEY ?? "local";
const USER_ID = process.env.USER_ID ?? "default";

// ─── Brain ────────────────────────────────────────────────────────────────────

const brain = new Brain(
  new OpenAICompatibleAdapter(LLM_URL, LLM_MODEL, LLM_API_KEY),
  new SQLiteStorageAdapter("./.brain"),
  undefined,
  {
    systemPrompt: COPYRIGHT_PERSONALITY,
    llm: {
      responseMaxTokens: 2000,
    },
    memory: {
      synapseTreeDepth: 6,
      decayWindowMs: 60 * 24 * 60 * 60 * 1000, // 60 days
    },
    chat: {
      maintenanceEveryN: 30,
    },
  }
);

await brain.loadActions();

for (const { name, description, handler } of copyrightActions) {
  await brain.registerAction(name, description, handler);
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("⚖️  Copyright Agent — powered by @the-brain/core");
console.log("   Ask about copyright law, fair use, licenses, or describe your situation.");
console.log("   Ctrl+C to exit.\n");

const spin = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
let si = 0;

const ask = () => {
  rl.question("\x1b[36mTy:\x1b[0m ", async (input) => {
    const text = input.trim();
    if (!text) { ask(); return; }

    const t = setInterval(() => process.stdout.write(`\r\x1b[33m${spin[si++ % 10]}\x1b[0m Myślę...`), 80);

    try {
      const result = await brain.process(USER_ID, text);
      clearInterval(t);
      process.stdout.write("\r\x1b[2K");
      console.log(`\x1b[32mAgent\x1b[0m [${result.action}]: ${result.answer}\n`);
    } catch (err) {
      clearInterval(t);
      process.stdout.write("\r\x1b[2K");
      console.error("Error:", err);
    }

    ask();
  });
};

rl.on("close", () => {
  console.log("\nBye.");
  process.exit(0);
});

ask();
