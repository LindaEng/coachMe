import { openai } from "../infra/openai";

export async function summarize(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
            You are a professional executive coach.
            Summarize the following coaching conversation.
            Return:

            1. A short summary
            2. 3–5 key insights
            3. Clear action items
        `.trim(),
      },
      {
        role: "user",
        content: transcript,
      },
    ],
    temperature: 0.2,
    max_tokens: 400
  });
  return response.choices[0]?.message?.content ?? "";
}