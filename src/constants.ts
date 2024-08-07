import { SRSettings } from "@/settings";

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
  GEMINI_15_PRO = "gemini-pro",
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
  GEMINI_15_PRO = "Gemini 1.5",
  CLAUDE_3_OPUS = "Claude 3 Opus",
  CLAUDE_3_SONNET = "Claude 3 Sonnet",
}

export const OPENAI_MODELS = [
  ChatModelDisplayNames.GPT_35_TURBO,
  ChatModelDisplayNames.GPT_4,
  ChatModelDisplayNames.GPT_4_TURBO,
  ChatModelDisplayNames.GPT_4_32K
];

export const GOOGLE_MODELS = [
  ChatModelDisplayNames.GEMINI_15_PRO
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
  [ChatModelDisplayNames.GEMINI_15_PRO]: ChatModels.GEMINI_15_PRO,
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
  googleApiKey: "",
  convertFoldersToDecks: true,
	noteFoldersToIgnore: [],
	flashcardTags: [],
	tagsToReview: [],
};

export enum ModelProviders {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
}