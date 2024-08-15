import ChainManager from "@/LLM/ChainManager";
import { SetChainOptions } from "@/aiParams";
import { BaseChatMemory } from "langchain/memory";
import { useState } from "react";
import { ChatModelDisplayNames } from "@/constants";

// React hook to manage state related to model and memory in Chat component.
export function useAIState(
  chainManager: ChainManager,
): [
  string,
  (model: string) => void,
  () => void,
] {
  const { langChainParams } = chainManager;
  const [currentModel, setCurrentModel] = useState<ChatModelDisplayNames>(langChainParams.modelDisplayName);
  const [, setChatMemory] = useState<BaseChatMemory | null>(chainManager.memoryManager.getMemory());

  const clearChatMemory = () => {
    chainManager.memoryManager.clearChatMemory();
    setChatMemory(chainManager.memoryManager.getMemory());
  }

  const setModel = (newModelDisplayName: ChatModelDisplayNames) => {
    chainManager.createChainWithNewModel(newModelDisplayName);
    setCurrentModel(newModelDisplayName);
  }

  return [
    currentModel,
    setModel,
    clearChatMemory,
  ];
}