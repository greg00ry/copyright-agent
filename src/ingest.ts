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
const CHUNK_SIZE = 800;
const OVERLAP = 150;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + CHUNK_SIZE).trim());
    start += CHUNK_SIZE - OVERLAP;
  }
  return chunks.filter(c => c.length > 30);
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
