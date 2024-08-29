import { SRSettings } from "@/settings";
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";

export const PREFERRED_DATE_FORMAT = "YYYY-MM-DD";
export const ALLOWED_DATE_FORMATS = [PREFERRED_DATE_FORMAT, "DD-MM-YYYY", "ddd MMM DD YYYY"];

export const YAML_FRONT_MATTER_REGEX = /^---\r?\n((?:.*\r?\n)*?)---/;

export const SR_HTML_COMMENT_BEGIN = "<!--SR:";
export const SR_HTML_COMMENT_END = "-->";


export const MULTI_SCHEDULING_EXTRACTOR = /!([\d-]+),(\d+),(\d+)/gm;
export const LEGACY_SCHEDULING_EXTRACTOR = /<!--SR:([\d-]+),(\d+),(\d+)-->/gm;
export const OBSIDIAN_TAG_AT_STARTOFLINE_REGEX = /^#[^\s#]+/gi;
export const OBSIDIAN_BLOCK_ID_ENDOFLINE_REGEX = / (\^[a-zA-Z0-9-]+)$/;
export const TICKS_PER_DAY = 24 * 3600 * 1000;

export enum ViewTypes {
  CHAT = "sr-chat-view",
  REVIEW = "sr-review-view",
}

export const USER_SENDER = "me";
export const AI_SENDER = "ai";

export const DEFAULT_SYSTEM_PROMPT = "You are Obsidian Spaced Repetition Copilot, a helpful assistant that creates and edits spaced repetition flashcards from Obsidian notes."

export const PROXY_SERVER_PORT = 53001;

export enum ChatModels {
  GPT_35_TURBO = "gpt-3.5-turbo",
  GPT_4 = "gpt-4",
  GPT_4_TURBO = "gpt-4-turbo-preview",
  GPT_4_32K = "gpt-4-32k",
  GPT_4o = "gpt-4o",
  GPT_4o_MINI = "gpt-4o-mini",
  CLAUDE_3_SONNET = "claude-3-5-sonnet-20240620",
  CLAUDE_3_OPUS = "claude-3-opus-20240229"
}

export enum ChatModelDisplayNames {
  GPT_35_TURBO = "GPT-3.5 Turbo",
  GPT_4 = "GPT-4",
  GPT_4_TURBO = "GPT-4 Turbo",
  GPT_4_32K = "GPT-4 32k",
  GPT_4o = "GPT-4o",
  GPT_4o_MINI = "GPT-4o Mini",
  CLAUDE_3_OPUS = "Claude 3 Opus",
  CLAUDE_3_SONNET = "Claude 3.5 Sonnet",
}

export const OPENAI_MODELS = [
  ChatModelDisplayNames.GPT_35_TURBO,
  ChatModelDisplayNames.GPT_4,
  ChatModelDisplayNames.GPT_4_TURBO,
  ChatModelDisplayNames.GPT_4_32K,
  ChatModelDisplayNames.GPT_4o,
  ChatModelDisplayNames.GPT_4o_MINI
];

export const ANTHROPIC_MODELS = [
  ChatModelDisplayNames.CLAUDE_3_OPUS,
  ChatModelDisplayNames.CLAUDE_3_SONNET
];
export const DISPLAY_NAME_TO_MODEL: Record<ChatModelDisplayNames, ChatModels> = {
  [ChatModelDisplayNames.GPT_35_TURBO]: ChatModels.GPT_35_TURBO,
  [ChatModelDisplayNames.GPT_4]: ChatModels.GPT_4,
  [ChatModelDisplayNames.GPT_4_TURBO]: ChatModels.GPT_4_TURBO,
  [ChatModelDisplayNames.GPT_4_32K]: ChatModels.GPT_4_32K,
  [ChatModelDisplayNames.GPT_4o]: ChatModels.GPT_4o,
  [ChatModelDisplayNames.GPT_4o_MINI]: ChatModels.GPT_4o_MINI,
  [ChatModelDisplayNames.CLAUDE_3_OPUS]: ChatModels.CLAUDE_3_OPUS,
  [ChatModelDisplayNames.CLAUDE_3_SONNET]: ChatModels.CLAUDE_3_SONNET,
};

export const MODEL_TO_DISPLAY_NAME: Record<ChatModels, ChatModelDisplayNames> = Object.fromEntries(
  Object.entries(DISPLAY_NAME_TO_MODEL).map(([displayName, model]) => [model, displayName as ChatModelDisplayNames])
) as Record<ChatModels, ChatModelDisplayNames>;

export const DEFAULT_SETTINGS: SRSettings = {
  defaultModel: ChatModels.GPT_4,
  defaultModelDisplayName: ChatModelDisplayNames.GPT_4,
  openAIApiKey: "",
  anthropicApiKey: "",
  convertFoldersToDecks: true,
	noteFoldersToIgnore: [],
	flashcardTags: [],
	tagsToReview: [],
};

export enum ModelProviders {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
}

export type ChatModelType = ChatOpenAI | ChatAnthropic;


// From here https://github.com/open-spaced-repetition/fsrs4anki/blob/main/fsrs4anki_scheduler.js#L108
export const DEFAULT_FSRS_WEIGHTS = [0.41, 1.18, 3.04, 15.24, 7.14, 0.64, 1.00, 0.06, 1.65, 0.17, 1.11, 2.02, 0.09, 0.30, 2.12, 0.24, 2.94, 0.48, 0.64];