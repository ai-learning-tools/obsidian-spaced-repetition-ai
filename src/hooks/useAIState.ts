import AIManager from "@/LLM/AIManager";
import { useState } from "react";
import { ChatModelDisplayNames, DISPLAY_NAME_TO_MODEL, MODEL_TO_DISPLAY_NAME } from "@/constants";

// React hook to manage state related to model and memory in Chat component.
export function useAIState(
  aiManager: AIManager,
): [
  ChatModelDisplayNames,
  (model: ChatModelDisplayNames) => void,
] {
  const [currentModel, setCurrentModel] = useState<ChatModelDisplayNames>(MODEL_TO_DISPLAY_NAME[aiManager.chatModel]);

  const setModel = (newModelDisplayName: ChatModelDisplayNames) => {
    aiManager.setModel(DISPLAY_NAME_TO_MODEL[newModelDisplayName]);
    setCurrentModel(newModelDisplayName);
  }

  return [
    currentModel,
    setModel,
  ];
}