import { ChatModels, ChatModelDisplayNames, OnboardingStatus } from "@/constants";

export interface SRSettings {
  defaultModel: ChatModels;
  defaultModelDisplayName: ChatModelDisplayNames;
  openAIApiKey: string;
	inlineSeparator: string;
	multilineSeparator: string;
  includeCurrentFile: boolean;
  onboardingStatus: OnboardingStatus;
}
