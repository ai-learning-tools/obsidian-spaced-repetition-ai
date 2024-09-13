 import { ChatModels, entriesGenerationSchema,EntryItemGeneration } from "@/constants";
import { ChatMessage } from "@/chatMessage";
import { errorMessage } from "@/utils/errorMessage";
import { IncompleteJsonParser } from "@/utils/incomplete-json-parser";

import OpenAI from "openai";

export default class AIManager {
  private static instance: AIManager;
  private client: OpenAI;
  private parser;
  public chatModel: ChatModels;

  constructor(chatModel: ChatModels, apiKey: string) {
    this.chatModel = chatModel;  
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    this.parser = new IncompleteJsonParser();
  }

  static getInstance(chatModel: ChatModels, apiKey: string): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager(chatModel, apiKey);
    }
    return AIManager.instance;
  }

  setModel(newModel: ChatModels) {
    this.chatModel = newModel;
  }

  // Docs: https://platform.openai.com/docs/assistants/tools/function-calling
  async streamAIResponse(
    newMessageModded: string,
    messages: ChatMessage[],
    abortController: AbortController,
    setAIString: (response: string) => void,
    setAIEntries: (response: EntryItemGeneration[]) => void
  ): Promise<void> {

    console.log(newMessageModded);
    try { 
      const assistant = await this.client.beta.assistants.create({
        name: "Flashcard Generator",
        instructions: "You are a teacher.",
        tools: [{ 
          type: "function",
          function: {
            name: "generateFlashcards",
            description: "Generate spaced repetition flashcards based on reference materials. An item may be a simple question with an answer, or a cloze deletion, or a spelling test, or more general stimulus-response pair. In incremental reading, items can be generated on a massive scale with cloze deletion tools (usually with a single keystroke). Items should be distinguished from topics which are learning materials intended for passive review or processing (e.g. articles from the web). Items are subject to active recall while topics are the prime source of new items.",
            parameters: entriesGenerationSchema,
          }
        }],
        model: this.chatModel
      });
      
      const thread = await this.client.beta.threads.create();
      
      await this.client.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: newMessageModded,
        }
      );
                 
      const stream = this.client.beta.threads.runs.stream(
        thread.id, 
        { assistant_id: assistant.id },
        { signal: abortController.signal }
      );

      let aiString = '';
      let aiEntriesString = '';
      for await (const event of stream) {
        if (abortController.signal.aborted) break;

        console.log(event)
        if (event.event === 'thread.message.delta') {
          aiString += event.data.delta.content[0].text.value;
          setAIString(aiString);
        } else if (event.event === 'thread.run.step.delta') {
          const delta = event.data.delta.step_details.tool_calls[0].function.arguments;
          // console.log(delta)
          if (delta) {
            aiEntriesString += delta
            const result = this.parser.parse(aiEntriesString);
            // this.parser.write(delta);
            // const result = this.parser.getObjects();
            if (result.cardsSummary) {
              setAIString(result.cardsSummary);
            }
            if (result.cards) {
              setAIEntries(result.cards);
            }
          }          
        } else if (event.event === 'thread.run.requires_action') {
          const stream = this.client.beta.threads.runs.submitToolOutputsStream(
            event.data.thread_id,
            event.data.id,
            { tool_outputs: [ this.parser.parse(aiEntriesString) ] },
          );
          // for await (const event of stream) {
          //   this.emit("event", event);
          // }
        }

      };

    } catch(e) {
      errorMessage(`Error while streaming AI response: ${e}`);
    }

  }

}