import "dotenv/config";
import { Brain, OpenAICompatibleAdapter } from "@the-brain/core";
import { SQLiteStorageAdapter } from "@the-brain/adapter-sqlite";
import { COPYRIGHT_PERSONALITY } from "./personality.js";
const LLM_URL = process.env.LLM_API_URL ?? "http://localhost:11434/v1/chat/completions";
const LLM_MODEL = process.env.LLM_MODEL ?? "llama3.2";
const LLM_API_KEY = process.env.LLM_API_KEY ?? "local";
const USER_ID = process.env.USER_ID ?? "default";

const brain = new Brain(
  new OpenAICompatibleAdapter(LLM_URL, LLM_MODEL, LLM_API_KEY),
  new SQLiteStorageAdapter("./.brain"),
  undefined,
  { systemPrompt: COPYRIGHT_PERSONALITY, llm: { responseMaxTokens: 2000 } }
);

await brain.loadActions();
const questions: string[] = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "tworze framework ai, nie chce komercyjnego użycia, jaką licencję wybrać?",
      "na podstawie jakiego artykułu to mówisz?",
      "co to jest dozwolony użytek?",
    ];

for (const q of questions) {
  console.log(`\n\x1b[36mQ:\x1b[0m ${q}`);
  const result = await brain.process(USER_ID, q);
  console.log(`\x1b[32m[${result.action}]\x1b[0m ${result.answer}`);
}

process.exit(0);
