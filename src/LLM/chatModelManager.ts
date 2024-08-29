import { LangChainParams, ModelConfig } from "@/LLM/aiParams";
import EncryptionService from "@/utils/encryptionService";
import { 
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  ModelProviders,
  PROXY_SERVER_PORT,
  ChatModelDisplayNames,
  DISPLAY_NAME_TO_MODEL
} from '@/constants';
import { ChatModelType } from "@/constants";
import { Notice } from "obsidian";
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatAnthropic } from "@langchain/anthropic";


// This follows a singleton pattern. Constructor is private; we use getInstance
export default class ChatModelManager {
  private static instance: ChatModelManager;
  private static chatModel: ChatModelType;
  private static modelMap: Record<
    string,
    {
      hasApiKey: boolean;
      AIConstructor: ChatModelType
      vendor: ModelProviders;
    }
  >;

  private constructor(
    private langChainParams: LangChainParams
  ) {
    this.buildModelMap();
  }

  static getInstance(
    langChainParams: LangChainParams
  ): ChatModelManager {
    if (!ChatModelManager.instance) {
      ChatModelManager.instance = new ChatModelManager(langChainParams);
    }
    return ChatModelManager.instance;
  }

  static resetInstance(
    langChainParams: LangChainParams
  ): ChatModelManager {
    ChatModelManager.instance = new ChatModelManager(langChainParams);
    return ChatModelManager.instance;
  }

  private buildModelMap() {
    ChatModelManager.modelMap = {};
    const modelMap = ChatModelManager.modelMap;

    const modelConfigurations = [
      {
        models: OPENAI_MODELS,
        apiKey: this.langChainParams.openAIApiKey,
        constructor: ChatOpenAI,
        vendor: ModelProviders.OPENAI,
      },
      {
        models: ANTHROPIC_MODELS,
        apiKey: this.langChainParams.anthropicApiKey,
        constructor: ChatAnthropic,
        vendor: ModelProviders.ANTHROPIC,
      }
    ];

    modelConfigurations.forEach(({ models, apiKey, constructor, vendor}) => {
      models.forEach(modelDisplayNameKey => {
        modelMap[modelDisplayNameKey] = {
          hasApiKey: Boolean(apiKey),
          AIConstructor: constructor,
          vendor: vendor,
        };
      });
    });

  }

  private getModelConfig(chatModelProvider: ModelProviders): ModelConfig {
    const decrypt  = (key: string) => EncryptionService.getDecryptedKey(key);
    const params = this.langChainParams;
    const baseConfig: ModelConfig = {
      modelName: params.model,
      temperature: 0.1,
      streaming: true,
      maxRetries: 3,
      maxConcurrency: 3,
    };

    const providerConfig = {
      [ModelProviders.OPENAI]: {
        openAIApiKey: decrypt(params.openAIApiKey),
      },
      [ModelProviders.ANTHROPIC]: {
        anthropicApiUrl: `http://localhost:${PROXY_SERVER_PORT}`,
        anthropicApiKey: decrypt(params.anthropicApiKey),
      }
    };

    return { ...baseConfig, ...(providerConfig[chatModelProvider as keyof typeof providerConfig] || {}) };
  }

  getChatModel(): ChatModelType {
    return ChatModelManager.chatModel;
  }

  setChatModel(modelDisplayName: ChatModelDisplayNames): void {
    if (!ChatModelManager.modelMap.hasOwnProperty(modelDisplayName)) {
      throw new Error(`No model found for: ${modelDisplayName}`);
    }

    // Must update this since chatModelManager is a singleton.
    this.langChainParams.model = DISPLAY_NAME_TO_MODEL[modelDisplayName];

    const selectedModel = ChatModelManager.modelMap[modelDisplayName];
    if (!selectedModel.hasApiKey) {
      const errorMessage = `API key is not provided for the model: ${modelDisplayName}. Model switch failed.`;
      new Notice(errorMessage);
      throw new Error(errorMessage);
    }

    const modelConfig = this.getModelConfig(selectedModel.vendor);

    try {
      const newModelInstance = new selectedModel.AIConstructor({
        ...modelConfig,
      });

      ChatModelManager.chatModel = newModelInstance;
    } catch (error) {
      console.error(error);
      new Notice(`Error creating model ${modelDisplayName}`);
    }
  }


  async countTokens(inputStr: string): Promise<number> {
    return ChatModelManager.chatModel.getNumTokens(inputStr);
  }
}