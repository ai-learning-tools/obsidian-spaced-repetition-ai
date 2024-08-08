import { LangChainParams } from "@/aiParams";
import { BaseChatMemory, BufferWindowMemory } from "langchain/memory";

export default class MemoryManager {
  private static instance: MemoryManager;
  private memory: BaseChatMemory;

  private constructor(
    private chatContextTurns: number
  ) {
    this.memory = new BufferWindowMemory({
      k: chatContextTurns * 2,
      memoryKey: 'history',
      inputKey: 'input',
      returnMessages: true,
    })
  }

  static getInstance(
    chatContextTurns: number
  ): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager(chatContextTurns);
    }
    return MemoryManager.instance;
  }

  static resetInstance(
    chatContextTurns: number
  ): MemoryManager {
    MemoryManager.instance = new MemoryManager(chatContextTurns);
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