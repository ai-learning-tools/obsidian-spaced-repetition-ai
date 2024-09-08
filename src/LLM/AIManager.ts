import { ChatModels } from "@/constants";
import { ChatMessage } from "@/chatMessage";
import { errorMessage } from "@/utils/errorMessage";

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

  async getAIResponse(
    modifiedMessage: string,
    messages: ChatMessage[],
    abortController: AbortController,
    setAIResponse: (response: string) => void,
  ): Promise<string> {
    try {
      setAIResponse('meowwwwwwww');
      return 'meowww';
    } catch (e) {
      errorMessage(`Error in getAIResponse: ${e}`);
    }
    return '';
  }

}