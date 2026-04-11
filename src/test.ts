import "dotenv/config";
import { Brain, OpenAICompatibleAdapter, OpenAICompatibleEmbeddingAdapter } from "@the-brain/core";
import { SQLiteStorageAdapter } from "@the-brain/adapter-sqlite";
import { COPYRIGHT_PERSONALITY } from "./personality.js";
const LLM_URL = process.env.LLM_API_URL ?? "http://localhost:11434/v1/chat/completions";
const LLM_MODEL = process.env.LLM_MODEL ?? "llama3.2";
const LLM_API_KEY = process.env.LLM_API_KEY ?? "local";
const USER_ID = process.env.USER_ID ?? "default";

const brain = new Brain(
  new OpenAICompatibleAdapter(LLM_URL, LLM_MODEL, LLM_API_KEY),
  new SQLiteStorageAdapter("./.brain"),
  new OpenAICompatibleEmbeddingAdapter("http://localhost:11434/v1/embeddings", "nomic-embed-text"),
  { systemPrompt: COPYRIGHT_PERSONALITY, llm: { responseMaxTokens: 500 }, memory: { contextMaxCharsPerEntry: 800 } }
);

await brain.loadActions();
const questions: string[] = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      // Dozwolony użytek
      "co to jest dozwolony użytek?",
      "czy mogę zacytować fragment książki w swojej pracy naukowej?",
      "ile mogę zacytować bez naruszenia praw autorskich?",
      "czy mogę udostępnić znajomym film który kupiłem?",
      "czy szkoła może kserować fragmenty podręcznika dla uczniów?",

      // Autorstwo i prawa osobiste
      "jakie prawa osobiste przysługują twórcy?",
      "czy mogę opublikować utwór anonimowo?",
      "kto jest twórcą jeśli kilka osób razem napisało książkę?",

      // Czas ochrony
      "jak długo trwa ochrona praw autorskich?",
      "kiedy utwór przechodzi do domeny publicznej?",

      // Programy komputerowe
      "czy program komputerowy jest chroniony prawem autorskim?",
      "czy mogę zrobić kopię zapasową kupionego oprogramowania?",

      // Naruszenia i sankcje
      "jakie są kary za naruszenie praw autorskich?",
      "co to jest plagiat w świetle prawa?",

      // Pytanie spoza bazy (test czy agent nie halucynuje)
      "jakie są przepisy o prawie autorskim w USA?",
    ];

for (const q of questions) {
  console.log(`\n\x1b[36mQ:\x1b[0m ${q}`);
  const result = await brain.process(USER_ID, q);
  console.log(`\x1b[32m[${result.action}]\x1b[0m ${result.answer}`);
  await new Promise(r => setTimeout(r, 3000));
}

process.exit(0);
