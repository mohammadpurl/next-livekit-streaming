import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const assistant = await openai.beta.assistants.create({
      name: "English Tutor Assistant",
      instructions: `You are an English tutor. Help students improve their language skills by:
      - Correcting mistakes in grammar and vocabulary
      - Explaining concepts with examples
      - Engaging in conversation practice
      - Providing learning suggestions
      Be friendly, adapt to student's level, and always give concise answers.`,
      tools: [],
      model: "gpt-4-turbo-preview",
    });

    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.createAndPoll(
      thread.id,
      { assistant_id: assistant.id }
    );

    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data.filter((msg) => msg.role === "assistant")[0];

      if (lastMessage && lastMessage.content[0].type === "text") {
        return NextResponse.json({ response: lastMessage.content[0].text.value });
      }
    }

    return NextResponse.json({ response: "Sorry, I couldn't process your request." });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 