import ChainManager from '@/LLM/ChainManager';
import { Notice, TFile, Vault } from 'obsidian';

export type Role = 'assistant' | 'user' | 'system';

export const getAIResponse = async (
  userMessage: string, // todo @bmo
  // vault: Vault,
  // contextFiles: TFile[] = [],
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
      userMessage,
      // contextFiles, // todo @bmo
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