import "dotenv/config";
import { readFileSync } from "node:fs";
import { Brain, OpenAICompatibleAdapter, OpenAICompatibleEmbeddingAdapter } from "@the-brain/core";
import { SQLiteStorageAdapter } from "@the-brain/adapter-sqlite";
import { COPYRIGHT_PERSONALITY } from "./personality.js";
import { PDFParse } from "pdf-parse";

const LLM_URL = process.env.LLM_API_URL ?? "http://localhost:11434/v1/chat/completions";
const LLM_MODEL = process.env.LLM_MODEL ?? "llama3.2";
const LLM_API_KEY = process.env.LLM_API_KEY ?? "local";
const USER_ID = process.env.USER_ID ?? "default";
const MAX_CHUNK_SIZE = 1500;

function chunkText(text: string): string[] {
  // Split on article boundaries (Art. 1., Art. 23., Art. 231. etc.)
  const parts = text.split(/(?=Art\.\s+\d+[¹²³]?\.\s)/);

  const chunks: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length < 30) continue;
    // If a single article is too long, split it further by character
    if (trimmed.length <= MAX_CHUNK_SIZE) {
      chunks.push(trimmed);
    } else {
      for (let i = 0; i < trimmed.length; i += MAX_CHUNK_SIZE) {
        const sub = trimmed.slice(i, i + MAX_CHUNK_SIZE).trim();
        if (sub.length > 30) chunks.push(sub);
      }
    }
  }
  return chunks;
}

const brain = new Brain(
  new OpenAICompatibleAdapter(LLM_URL, LLM_MODEL, LLM_API_KEY),
  new SQLiteStorageAdapter("./.brain"),
  new OpenAICompatibleEmbeddingAdapter("http://localhost:11434/v1/embeddings", "nomic-embed-text"),
  { systemPrompt: COPYRIGHT_PERSONALITY }
);

await brain.loadActions();

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: tsx src/ingest.ts <file.pdf>");
  process.exit(1);
}

const fileName = filePath.split("/").pop() ?? filePath;
console.log(`\nIngesting: ${fileName}`);

const buffer = readFileSync(filePath);
const parser = new PDFParse({ data: buffer });
const result = await parser.getText();
const text = result.text;
const numpages = result.total;
const chunks = chunkText(text);

console.log(`${numpages} pages → ${chunks.length} chunks`);

for (let i = 0; i < chunks.length; i++) {
  const content = `[PDF: ${fileName}, chunk ${i + 1}/${chunks.length}]\n${chunks[i]}`;
  await brain.save(USER_ID, content, true);
  process.stdout.write(`\rSaved ${i + 1}/${chunks.length}`);
}

console.log(`\nDone. ${chunks.length} chunks ingested as permanent memory.`);
process.exit(0);
