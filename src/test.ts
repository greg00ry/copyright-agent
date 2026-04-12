import "dotenv/config";
import { rmSync } from "fs";
import { Brain, OpenAICompatibleAdapter, OpenAICompatibleEmbeddingAdapter, SavingPlugin, MemoryPlugin } from "@the-brain/core";
import { SQLiteStorageAdapter } from "@the-brain/adapter-sqlite";
import { COPYRIGHT_PERSONALITY } from "./personality.js";

rmSync("./.brain-test", { recursive: true, force: true });

const LLM_URL = process.env.LLM_API_URL ?? "http://localhost:11434/v1/chat/completions";
const LLM_MODEL = process.env.LLM_MODEL ?? "llama3.2";
const LLM_API_KEY = process.env.LLM_API_KEY ?? "local";
const USER_ID = "test-user";

const brain = new Brain(
  new OpenAICompatibleAdapter(LLM_URL, LLM_MODEL, LLM_API_KEY),
  new SQLiteStorageAdapter("./.brain-test"),
  new OpenAICompatibleEmbeddingAdapter(
    process.env.EMBEDDING_API_URL ?? "http://localhost:11434/v1/embeddings",
    process.env.EMBEDDING_MODEL ?? "nomic-embed-text",
  ),
  { systemPrompt: COPYRIGHT_PERSONALITY, llm: { responseMaxTokens: 500 } }
);

await brain.use(new SavingPlugin(), new MemoryPlugin());
await brain.loadActions();

const questions: string[] = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
    "how long does copyright last after the author dies?",  // RESEARCH_BRAIN — pytanie o prawo
    "is a logo I designed automatically protected?",        // RESEARCH_BRAIN — praktyczny case
    "remember: copyright registration is not required in the US", // SAVE_ONLY — zapis faktu
    "what did I just note about copyright registration?",   // RESEARCH_BRAIN — recall zapisanego
  ];

let passed = 0;

for (const q of questions) {
  console.log(`\n\x1b[36mQ:\x1b[0m ${q}`);
  const result = await brain.process(USER_ID, q);
  console.log(`\x1b[32m[${result.action}]\x1b[0m ${result.answer}`);
  passed++;
}

console.log(`\n✅ ${passed}/${questions.length} pytań przetworzonych`);
process.exit(0);
