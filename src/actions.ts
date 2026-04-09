import type { ActionHandler } from "@the-brain/core";

export const copyrightActions: { name: string; description: string; handler: ActionHandler }[] = [
  {
    name: "ANALYZE_COPYRIGHT",
    description: "user describes a situation, work, or case and wants to know if copyright applies or what their rights are",
    handler: async (userId, text, { synapticTree, hasContext }, llm) => {
      const context = hasContext
        ? `\nRelevant knowledge from memory:\n${synapticTree}`
        : "";

      const answer = await llm.complete({
        userPrompt: `Analyze this copyright situation:\n"${text}"${context}\n\nProvide: (1) what copyright principles apply, (2) what the likely outcome is, (3) what the user should do next.`,
        temperature: 0.3,
        maxTokens: 1500,
      });
      return answer ?? "Could not analyze the situation.";
    },
  },
  {
    name: "EXPLAIN_CONCEPT",
    description: "user asks what a copyright term or concept means (e.g. fair use, DMCA, public domain, derivative work)",
    handler: async (userId, text, { synapticTree, hasContext }, llm) => {
      const context = hasContext ? `\nRelated notes:\n${synapticTree}` : "";

      const answer = await llm.complete({
        userPrompt: `Explain this copyright concept clearly:\n"${text}"${context}\n\nInclude a practical example.`,
        temperature: 0.5,
        maxTokens: 1000,
      });
      return answer ?? "Could not explain the concept.";
    },
  },
  {
    name: "CHECK_LICENSE",
    description: "user asks about a specific license (MIT, CC BY, GPL, etc.) and what it allows or requires",
    handler: async (userId, text, { synapticTree, hasContext }, llm) => {
      const context = hasContext ? `\nRelated license notes:\n${synapticTree}` : "";

      const answer = await llm.complete({
        userPrompt: `Explain what this license allows, requires, and prohibits:\n"${text}"${context}\n\nBe specific about commercial use, attribution, and derivatives.`,
        temperature: 0.2,
        maxTokens: 800,
      });
      return answer ?? "Could not analyze the license.";
    },
  },
];
