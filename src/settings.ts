import { ChatModels, ChatModelDisplayNames } from "@/constants";

export interface SRSettings {
  defaultModel: ChatModels;
  defaultModelDisplayName: ChatModelDisplayNames;
  openAIApiKey: string;
  anthropicApiKey: string;
	convertFoldersToDecks: boolean;
	noteFoldersToIgnore: string[],
	flashcardTags: string[],
	tagsToReview: string[],
}
