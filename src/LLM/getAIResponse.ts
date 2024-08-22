import ChainManager from '@/LLM/ChainManager';
import { Notice, TFile, Vault } from 'obsidian';
import { ChatMessage } from '@/chatMessage';

export type Role = 'assistant' | 'user' | 'system';

export const getAIResponse = async (
  modifiedMessage: string,
  messageHistory: ChatMessage[],
  chainManager: ChainManager,
  setCurrentAIResponse: (response: string) => void,
  updateHistory: (response: string) => void,
  updateShouldAbort: (abortController: AbortController | null) => void,
  options: {
    debug?: boolean,
    ignoreSystemMessage?: boolean,
    updateLoading?: (loading: boolean) => void
  } = {},
) => {
  const abortController = new AbortController();
  updateShouldAbort(abortController);
  try {
    await chainManager.runChain(
      modifiedMessage,
      messageHistory,
      abortController,
      setCurrentAIResponse,
      updateHistory,
      options,
    );
  } catch (error) {
    new Notice('Model request failed: ', error);
    console.error('Model request failed: ', error);
  }
};