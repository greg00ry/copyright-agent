import type { ActionHandler } from "@the-brain/core";

const formatHistory = (chatHistory?: { role: string; content: string }[]) =>
  chatHistory?.slice(-6).map(m => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`).join("\n") ?? "";

export const copyrightActions: { name: string; description: string; handler: ActionHandler }[] = [
  {
    name: "ANALYZE_COPYRIGHT",
    description: "user describes a situation, work, or case and wants to know if copyright applies or what their rights are",
    handler: async (userId, text, { synapticTree, hasContext }, llm, chatHistory) => {
      const context = hasContext ? `\nRelevant knowledge from memory:\n${synapticTree}` : "";
      const history = formatHistory(chatHistory);

      const answer = await llm.complete({
        userPrompt: `${history ? `Chat history:\n${history}\n\n` : ""}Analyze this copyright situation:\n"${text}"${context}\n\nProvide: (1) what copyright principles apply, (2) what the likely outcome is, (3) what the user should do next.`,
        temperature: 0.3,
        maxTokens: 1500,
      });
      return answer ?? "Could not analyze the situation.";
    },
  },
  {
    name: "EXPLAIN_CONCEPT",
    description: "user asks what a copyright term or concept means (e.g. fair use, DMCA, public domain, derivative work)",
    handler: async (userId, text, { synapticTree, hasContext }, llm, chatHistory) => {
      const context = hasContext ? `\nRelated notes:\n${synapticTree}` : "";
      const history = formatHistory(chatHistory);

      const answer = await llm.complete({
        userPrompt: `${history ? `Chat history:\n${history}\n\n` : ""}Explain this copyright concept clearly:\n"${text}"${context}\n\nInclude a practical example.`,
        temperature: 0.5,
        maxTokens: 1000,
      });
      return answer ?? "Could not explain the concept.";
    },
  },
];
