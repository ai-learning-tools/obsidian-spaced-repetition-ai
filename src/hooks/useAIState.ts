import ChainManager from "@/LLM/ChainManager";
import { useState } from "react";
import { ChatModelDisplayNames } from "@/constants";

// React hook to manage state related to model and memory in Chat component.
export function useAIState(
  chainManager: ChainManager,
): [
  string,
  (model: string) => void,
] {
  const { langChainParams } = chainManager;
  const [currentModel, setCurrentModel] = useState<ChatModelDisplayNames>(langChainParams.modelDisplayName);

  const setModel = (newModelDisplayName: ChatModelDisplayNames) => {
    chainManager.setModel(newModelDisplayName);
    setCurrentModel(newModelDisplayName);
  }

  return [
    currentModel,
    setModel,
  ];
}