import { ChatModels, ChatModelDisplayNames } from "@/constants";

export interface SRSettings {
  defaultModel: ChatModels;
  defaultModelDisplayName: ChatModelDisplayNames;
  openAIApiKey: string;
	inlineSeparator: string;
	multilineSeparator: string;
}
