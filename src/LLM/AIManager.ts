import { 
  ChatModels, 
  entriesGenerationSchema,EntryItemGeneration,
  MAX_CHARACTERS,
} from "@/constants";
import { ChatMessage } from "@/chatMessage";
import { errorMessage } from "@/utils/errorMessage";
import { IncompleteJsonParser } from "@/utils/incomplete-json-parser";
import { APIUserAbortError } from "openai/error";
import OpenAI from "openai";

export default class AIManager {
  private static instance: AIManager;
  private client: OpenAI;
  private assistant;
  private thread;
  private parser;
  public chatModel: ChatModels;

  constructor(chatModel: ChatModels, apiKey: string) {
    this.chatModel = chatModel;  
    this.parser = new IncompleteJsonParser();
    this.checkApiKey(apiKey)
    .then((valid) => {
      if (valid) {
        this.client = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true
        });
      }
    })
  }

  // Gets singleton instance
  static getInstance(chatModel: ChatModels, apiKey: string): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager(chatModel, apiKey);
    }
    return AIManager.instance;
  }

  async checkApiKey(apiKey: string) {
    const tempClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    const response = await tempClient.chat.completions.create({
      messages: [{ role: 'user', content: 'this is a test' }],
      model: this.chatModel,
    })
    return !!response.choices[0].message.content;
  }

  async setApiKey(apiKey: string) {
    const valid = await this.checkApiKey(apiKey);
    if (valid) {
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
      return true;
    }
    return false;
  }

  // Sets the chat model
  setModel(newModel: ChatModels) {
    this.chatModel = newModel;
  }

  // A new thread is set when a new conversation starts or when a user backtracks to a previous message in the conversation history
  async setNewThread(messages?: ChatMessage[]) {
    this.thread = await this.client.beta.threads.create();
    if (messages) {
      for (const msg of messages) {
        await this.client.beta.threads.messages.create(
          this.thread.id,
          {
            role: "user",
            content: msg.modifiedMessage!,
          }
        );

        await this.client.beta.threads.messages.create(
          this.thread.id,
          {
            role: "assistant",
            content: `${msg.aiString}\n\n${msg.aiEntries?.join('\n')} `
          }
        );
      }
    }
  }

  // Docs: https://platform.openai.com/docs/assistants/tools/function-calling
  async streamAIResponse(
    newMessageModded: string,
    abortController: AbortController,
    setAIString: (response: string) => void,
    setAIEntries: (response: EntryItemGeneration[]) => void
    ): Promise<{ str: string; entries: EntryItemGeneration[] }> {
    
      if (newMessageModded.length > MAX_CHARACTERS) {
      setAIString(`Oops! Your message context is too long. Please keep it under about ${MAX_CHARACTERS/5} words.`);
      return { str: '', entries: [] };
    }
    
    try { 
      if (!this.assistant) {
        this.assistant = await this.client.beta.assistants.create({
          name: "Flashcard Generator",
          instructions: "You are the world's best teacher. Respond naturally to help your student learn.",
          tools: [{ 
            type: "function",
            function: {
              name: "generateFlashcards",
              description: "Generate spaced repetition flashcards based on reference materials. An item may be a simple question with an answer, or a cloze deletion, or a spelling test, or more general stimulus-response pair. In incremental reading, items can be generated on a massive scale with cloze deletion tools (usually with a single keystroke). Items should be distinguished from topics which are learning materials intended for passive review or processing (e.g. articles from the web). Items are subject to active recall while topics are the prime source of new items.",
              parameters: entriesGenerationSchema,
              // strict: true,
            }
          }],
          model: this.chatModel
        });
      }

      if (!this.thread) {
        this.thread = await this.client.beta.threads.create();
      }

      await this.client.beta.threads.messages.create(
        this.thread.id,
        {
          role: "user",
          content: newMessageModded,
        }
      );
                 
      const stream = this.client.beta.threads.runs.stream(
        this.thread.id, 
        { assistant_id: this.assistant.id },
        { signal: abortController.signal }
      );
      let aiString = '';
      let aiEntriesString = '';
      let entries: EntryItemGeneration[] = [];

      for await (const event of stream) {
        if (abortController.signal.aborted) break;

        if (event.event === 'thread.message.delta') {
          const content = event.data.delta.content?.[0];
          if (content && 'text' in content) {
            aiString += content.text?.value;
            setAIString(aiString);
          }
        } else if (event.event === 'thread.run.step.delta') {
          const delta = event.data.delta.step_details?.tool_calls?.[0]?.function?.arguments;
          if (delta) {
            aiEntriesString += delta;
            const result = this.parser.parse(aiEntriesString);
            if (result.cardsSummary) {
              setAIString(result.cardsSummary);
            }
            if (result.cards) {
              entries = result.cards.map((c: any) => ({
                ...c,
                front: c.front ? c.front.replace(/\\n/g, '\n') : '',
                back: c.back ? c.back.replace(/\\n/g, '\n') : '',
              }));
              setAIEntries(entries);
            }
          }
        } else if (event.event === 'thread.run.requires_action') {
          await this.client.beta.threads.runs.cancel(
            this.thread.id,
            event.data.id
          );
        }
      }

      return { str: aiString, entries };
    } catch(e) {
      if (!(e instanceof APIUserAbortError)) {
        errorMessage(`Streaming AI response ${e}`);
      }
      return { str: '', entries: [] };
    }

  }

}