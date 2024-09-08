import { ChatModels, EntriesGeneration, EntryItemGeneration } from "@/constants";
import { ChatMessage } from "@/chatMessage";
import { errorMessage } from "@/utils/errorMessage";
import { dummyEntriesGeneration } from "@/utils/dummyData";

export default class AIManager {
  private static instance: AIManager;
  public chatModel: ChatModels;

  constructor(chatModel: ChatModels) {
    this.chatModel = chatModel;  
  }

  static getInstance(chatModel: ChatModels): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager(chatModel);
    }
    return AIManager.instance;
  }

  setModel(newModel: ChatModels) {
    this.chatModel = newModel;
  }

  async streamAIResponse(
    newMessageModded: string,
    messages: ChatMessage[],
    abortController: AbortController,
    setAIString: (response: string) => void,
    setAIEntries: (response: EntryItemGeneration[]) => void
  ): Promise<void> {
    const entriesGeneration: EntriesGeneration = {
      cardsSummary: '',
      cards: [],
    }
    try {
      setAIString(dummyEntriesGeneration.cardsSummary);
      setAIEntries(dummyEntriesGeneration.cards);
    } catch (e) {
      errorMessage(`Error in streamAIResponse: ${e}`);
    }
  }

}