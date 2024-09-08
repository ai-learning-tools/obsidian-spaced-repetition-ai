import { SRSettings } from "@/settings";
import { z } from 'zod';


const entryItem = z.object({
  front: z.string().describe("The front side of the card containing the question or prompt"),
  back: z.string().describe("The back side of the card containing the answer or explanation")
});

const entriesGeneration = z.object({
  cardsSummary: z.string().describe("Let the user know what the cards cover, don't cover, and how they relate to the source material."),
  cards: z.array(entryItem).describe("An array of question-answer pairs representing spaced repetition cards")
});

export type EntriesGeneration = z.infer<typeof entriesGeneration>;

export type EntryItemGeneration = z.infer<typeof entryItem>;


export enum ViewTypes {
  CHAT = "sr-chat-view",
  REVIEW = "sr-review-view",
}

export const DEFAULT_SYSTEM_PROMPT = "You are Obsidian Spaced Repetition Copilot, a helpful assistant that creates and edits spaced repetition flashcards from Obsidian notes."

export const PROXY_SERVER_PORT = 53001;

export enum ChatModels {
  GPT_35_TURBO = "gpt-3.5-turbo",
  GPT_4 = "gpt-4",
  GPT_4_TURBO = "gpt-4-turbo-preview",
  GPT_4_32K = "gpt-4-32k",
  GPT_4o = "gpt-4o",
  GPT_4o_MINI = "gpt-4o-mini"
}

export enum ChatModelDisplayNames {
  GPT_35_TURBO = "GPT-3.5 Turbo",
  GPT_4 = "GPT-4",
  GPT_4_TURBO = "GPT-4 Turbo",
  GPT_4_32K = "GPT-4 32k",
  GPT_4o = "GPT-4o",
  GPT_4o_MINI = "GPT-4o Mini"
}

export const OPENAI_MODELS = [
  ChatModelDisplayNames.GPT_35_TURBO,
  ChatModelDisplayNames.GPT_4,
  ChatModelDisplayNames.GPT_4_TURBO,
  ChatModelDisplayNames.GPT_4_32K,
  ChatModelDisplayNames.GPT_4o,
  ChatModelDisplayNames.GPT_4o_MINI
];

export const DISPLAY_NAME_TO_MODEL: Record<ChatModelDisplayNames, ChatModels> = {
  [ChatModelDisplayNames.GPT_35_TURBO]: ChatModels.GPT_35_TURBO,
  [ChatModelDisplayNames.GPT_4]: ChatModels.GPT_4,
  [ChatModelDisplayNames.GPT_4_TURBO]: ChatModels.GPT_4_TURBO,
  [ChatModelDisplayNames.GPT_4_32K]: ChatModels.GPT_4_32K,
  [ChatModelDisplayNames.GPT_4o]: ChatModels.GPT_4o,
  [ChatModelDisplayNames.GPT_4o_MINI]: ChatModels.GPT_4o_MINI,
};

export const MODEL_TO_DISPLAY_NAME: Record<ChatModels, ChatModelDisplayNames> = Object.fromEntries(
  Object.entries(DISPLAY_NAME_TO_MODEL).map(([displayName, model]) => [model, displayName as ChatModelDisplayNames])
) as Record<ChatModels, ChatModelDisplayNames>;

export const DEFAULT_SETTINGS: SRSettings = {
  defaultModel: ChatModels.GPT_4,
  defaultModelDisplayName: ChatModelDisplayNames.GPT_4,
  openAIApiKey: "",
  convertFoldersToDecks: true,
	noteFoldersToIgnore: [],
	flashcardTags: [],
	tagsToReview: [],
};

// From here https://github.com/open-spaced-repetition/fsrs4anki/blob/main/fsrs4anki_scheduler.js#L108
export const DEFAULT_FSRS_WEIGHTS = [0.41, 1.18, 3.04, 15.24, 7.14, 0.64, 1.00, 0.06, 1.65, 0.17, 1.11, 2.02, 0.09, 0.30, 2.12, 0.24, 2.94, 0.48, 0.64];