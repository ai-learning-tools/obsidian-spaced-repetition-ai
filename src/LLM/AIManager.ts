import { 
  ChatModels, 
  EntryItemGeneration,
  MAX_CHARACTERS,
} from "@/constants";
import { ChatMessage } from "@/chatMessage";
import { errorMessage } from "@/utils/errorMessage";
import { APIUserAbortError } from "openai/error";
import OpenAI from "openai";

const PROMPT = `
<INSTRUCTION>
You are the world's best teacher. You can generate flashcards for review. Respond with the XML response format below, where chat response is your chat response alongside flashcards that contain question answer flashcards.

Best practices for flashcard generation:
1. Focus on a Single Concept: Ensure each card addresses only one idea at a time. Eliminate extra details and break complex topics into multiple smaller cards.
2. Use Clear and Concise Wording: Formulate direct questions or statements. Avoid run-on sentences and redundant phrasing. Clarity is more important than style.
3. Make the Question Precise: Write questions in a way that demands a specific answer. Steer clear of vague prompts like "Discuss..." or "Explain..." in broad terms.
4. Provide Just Enough Context: Include minimal but necessary context so the item is self-contained. Avoid forcing the learner to recall large chunks of text. Keep it short enough for quick review.
5. Use Simple, Direct Answers: The answer should be straightforward and unambiguous. If multiple answers are possible, refine the question or break it into separate cards.
6. Avoid Interference: Refrain from creating multiple cards that ask almost identical questions. If two concepts overlap, merge them or clarify the difference.
7. Favor Active Recall: Design your prompt to force the learner to pull the answer from memory, not guess from context alone. For example, instead of "Fill in the blank," try a direct question: "What is the capital of France?"
8. Personalize When Possible: Tie the prompt to relevant experiences or mnemonics. Personalized elements enhance retention.
9. Keep Items Standalone: Don't rely on external resources during recall. Cards should function independently of each other or outside references.
10. Check for Relevance: Make sure the item is genuinely worth memorizing. Ask: "Will I need to recall this later?" or "Is this fundamental to my understanding?"

Best practices for using reference files
1. Avoid making flashcards about existing flashcards in the file. You can identify them by an embedded flashcard id, like: "What is capital of France? [[SR/memory/r3HHdEhi.md|>>]] Paris"
2. Follow best practices for flashcard generation! :)

</INSTRUCTION>
<RESPONSE FORMAT>
<chat response>
Chat response is here
</chat response>
<flashcards>
  <flashcard>
  <question>Question is here</question><answer>Answer is here</answer>
  </flashcard>
</flashcards>
</RESPONSE FORMAT>
`;

type Message = {
  role: 'user' | 'assistant' | 'developer';
  content: string;
};


export default class AIManager {
  private static instance: AIManager;
  private client: OpenAI;
  private messageHistory: Message[];
  public chatModel: ChatModels;

  constructor(chatModel: ChatModels, apiKey: string) {
    this.chatModel = chatModel;
    this.messageHistory = [];
    this.setNewThread();
    this.checkApiKey(apiKey)
      .then((valid) => {
        if (valid) {
          this.client = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true
          });
        }
      });
  }

  // Gets singleton instance
  static getInstance(chatModel: ChatModels, apiKey: string): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager(chatModel, apiKey);
    }
    return AIManager.instance;
  }

  async checkApiKey(apiKey: string): Promise<boolean> {
    const tempClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    const response = await tempClient.chat.completions.create({
      messages: [{ role: 'user', content: 'this is a test' }],
      model: this.chatModel,
    });
    return !!response.choices[0].message.content;
  }

  async setApiKey(apiKey: string): Promise<boolean> {
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
  setModel(newModel: ChatModels): void {
    this.chatModel = newModel;
  }

  // Sets a new conversation thread with optional index to slice message history
  async setNewThread(index?: number): Promise<void> {
    if (index) {
      const historyToUse = index !== undefined ? this.messageHistory.slice(0, index * 2 + 1) : [];
      this.messageHistory = [
        ...historyToUse
      ];
    } else {
      this.messageHistory = [{ role: 'developer', content: PROMPT }];
    }
  }

  private parseFlashcards(xmlString: string): { chatResponse: string; entries: EntryItemGeneration[] } {
    let chatResponse = '';
    let entries: EntryItemGeneration[] = [];

    // Extract chat response - handle both complete and partial tags
    const chatMatch = xmlString.match(/<chat response>([^]*?)(?:<\/chat response>|$)/);
    if (chatMatch) {
      chatResponse = chatMatch[1].trim();
    }

    // Extract flashcards - only complete flashcard tags
    const flashcardMatches = xmlString.matchAll(/<flashcard>[^]*?<question>([^]*?)<\/question>[^]*?<answer>([^]*?)<\/answer>[^]*?<\/flashcard>/g);
    for (const match of flashcardMatches) {
      entries.push({
        front: match[1].trim(),
        back: match[2].trim()
      });
    }

    return { chatResponse, entries };
  }

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

      console.log('Current chat model:', this.chatModel);
      console.log('Messages:', JSON.stringify(this.messageHistory, null, 2));


      // Push user message into messageHistory
      this.messageHistory.push({ role: 'user' as const, content: newMessageModded });

      const stream = await this.client.chat.completions.create({
        model: this.chatModel,
        messages: this.messageHistory,
        stream: true,
      });

      let fullResponse = '';
      let lastChatResponse = '';
      let lastEntries: EntryItemGeneration[] = [];

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        
        const { chatResponse, entries } = this.parseFlashcards(fullResponse);
        
        // Only update if we have new content
        if (chatResponse && chatResponse !== lastChatResponse) {
          setAIString(chatResponse);
          lastChatResponse = chatResponse;
        }
        
        if (entries.length > lastEntries.length) {
          setAIEntries(entries);
          lastEntries = entries;
        }
      }
      
      const finalParse = this.parseFlashcards(fullResponse);
      
      // Push assistant message response into messageHistory
      this.messageHistory.push({
        role: 'assistant', 
        content: fullResponse
      });

      return { str: finalParse.chatResponse, entries: finalParse.entries };

    } catch (e) {
      if (!(e instanceof APIUserAbortError)) {
        errorMessage(`Streaming AI response ${e}`);
      }
      return { str: '', entries: [] };
    }
  }
}
