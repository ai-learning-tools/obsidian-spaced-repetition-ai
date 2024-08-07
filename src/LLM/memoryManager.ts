import { LangChainParams } from "@/aiParams";
import { BaseChatMemory, BufferWindowMemory } from "langchain/memory";

export default class MemoryManager {
  private static instance: MemoryManager;
  private memory: BaseChatMemory;

  private constructor(
    private langChainParams: LangChainParams
  ) {
    this.memory = new BufferWindowMemory({
      k: this.langChainParams.chatContextTurns * 2,
      memoryKey: 'history',
      inputKey: 'input',
      returnMessages: true,
    })
  }

  static getInstance(
    langChainParams: LangChainParams
  ): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager(langChainParams);
    }
    return MemoryManager.instance;
  }

  getMemory() {
    return this.memory;
  }

  clearChatMemory() {
    console.log('Clearing chat memory');
    this.memory.clear();
  }
}