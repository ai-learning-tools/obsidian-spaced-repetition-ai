import { ChatPromptTemplate } from 'langchain/prompts';
import { ChatModelDisplayNames, ChatModels } from '../constants';

export interface ModelConfig {
  modelName: ChatModels;
  temperature: number;
  streaming: boolean;
  maxRetries: number;
  maxConcurrency: number;
  maxTokens?: number; 
  openAIApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}

export interface LangChainParams {
  model: ChatModels;
  modelDisplayName: ChatModelDisplayNames;
  temperature: number;
  maxTokens: number; // Max number of output tokens to generate. This number plus the length of your prompt (input tokens) must be smaller than the context window of the model
  openAIApiKey: string;
  anthropicApiKey:  string;
  googleApiKey: string;
  systemMessage: string;
  chatContextTurns: number; // The number of previous conversation turns to include in the context. Default is 15 turns, i.e. 30 messages
  options: SetChainOptions;
}

export interface NoteFile {
  path: string;
  basename: string;
  mtime: number;
  content: string;
  metadata: Record<string, any>;
}

export interface SetChainOptions {
  prompt?: ChatPromptTemplate;
  noteFiles?: NoteFile[];
  forceNewCreation?: boolean;
  abortController?: AbortController;
  debug?: boolean;
}