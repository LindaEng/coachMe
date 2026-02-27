import { toFile } from "openai";
import { openai } from "../infra/openai";

export async function transcribe(audio: Buffer): Promise<string> {
  const file = await toFile(audio, "audio.webm", {
    type: "audio/webm"
  })

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1"
  })

  return response.text;
}