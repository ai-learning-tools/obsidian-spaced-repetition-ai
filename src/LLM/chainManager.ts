import { LangChainParams, SetChainOptions } from "@/aiParams";
import { SRSettings } from "@/components/SettingsPage";
import EncryptionService from "@/utils/encryptionService";
import { App, Notice } from "obsidian";
import ChatModelManager from "./chatModelManager";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatModelDisplayNames, ChatModels, DISPLAY_NAME_TO_MODEL, AI_SENDER } from "@/constants";
import MemoryManager from "./memoryManager";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { ChatMessage } from "@/chatMessage";
import ChainFactory from "@/chainFactory";

export default class ChainManager {
  private static chain: RunnableSequence;

  public chatModelManager: ChatModelManager;
  public memoryManager: MemoryManager;
  public langChainParams: LangChainParams;

  constructor(
    langChainParams: LangChainParams
  ) {
    this.langChainParams = langChainParams;
    this.chatModelManager = ChatModelManager.getInstance( 
      this.langChainParams
    ); 
    this.memoryManager = MemoryManager.getInstance(this.langChainParams.chatContextTurns);

    this.createChainWithNewModel(this.langChainParams.modelDisplayName);
  }

  resetParams(langChainParams: LangChainParams): void {
    if (langChainParams !== undefined) {
      this.langChainParams = langChainParams;
    }
    this.chatModelManager = ChatModelManager.resetInstance( 
      this.langChainParams
    ); 
    this.memoryManager = MemoryManager.resetInstance(this.langChainParams.chatContextTurns);
    this.createChainWithNewModel(this.langChainParams.modelDisplayName);
  }  
  
  /**
   * Update the active model and create a new chain
   * with the specified model display name.
   */
  createChainWithNewModel(newModelDisplayName: ChatModelDisplayNames): void {
    try {
      console.log("DEBUG-ATH", newModelDisplayName)
      let newModel = DISPLAY_NAME_TO_MODEL[newModelDisplayName];
      this.langChainParams.model = newModel;
      this.langChainParams.modelDisplayName = newModelDisplayName;

      this.chatModelManager.setChatModel(newModelDisplayName);
      this.setChain({
        ...this.langChainParams.options,
        forceNewCreation: true,
      });
      console.log(`Setting model to ${newModelDisplayName}: ${newModel}`);
    } catch (error) {
      console.error(`createdChainWithNewModel failed: ${error}`);
      console.log(`Model: ${this.langChainParams.model}`);
    }
  }

  async setChain(options: SetChainOptions = {}): Promise<void> {
    try {
      if (!this.chatModelManager.getChatModel()) {
        const errorMsg = "Chat model is not initialized properly, check your API key and make sure you have API access";
        new Notice(errorMsg);
        console.error(errorMsg);
        return;
      }
      
      const chatModel = this.chatModelManager.getChatModel();
      const memory = this.memoryManager.getMemory();
      
      let prompt;
      if (options.prompt) {
        prompt = options.prompt;
      } else {
        prompt = ChatPromptTemplate.fromMessages([
          SystemMessagePromptTemplate.fromTemplate(
            this.langChainParams.systemMessage
          ),
          new MessagesPlaceholder("history"),
          HumanMessagePromptTemplate.fromTemplate("{input}"),
        ]);
      }

      if (options.forceNewCreation) {
        ChainManager.chain = ChainFactory.createNewLLMChain({
          llm: chatModel,
          memory,
          prompt,
          abortController: options.abortController,
        }) as RunnableSequence;
      } else {
        ChainManager.chain = ChainFactory.getLLMChainFromMap({
          llm: chatModel,
          memory,
          prompt,
          abortController: options.abortController,
        }) as RunnableSequence;
      }
      
    } catch (error) {
      new Notice(`Error creating chain: ${error}`);
      console.error(`Error creating chain: ${error}`);
    }
  }

  async runChain(
    userMessage: string,
    abortController: AbortController,
    setCurrentAIResponse: (response: string) => void,
    updateChatHistory: (response: string) => void,
    options: {
      debug?: boolean;
      ignoreSystemMessage?: boolean;
      updateLoading?: (loading: boolean) => void;
    } = {},
  ) {
    const { debug = false, ignoreSystemMessage = false } = options;

    if (!this.chatModelManager.getChatModel()) {
      const errorMsg = "Chat model is not initialized properly, check your API key and make sure you have API access";

      new Notice(errorMsg);
      console.error(errorMsg);
      return;
    }

    const { 
      temperature,
      maxTokens,
      systemMessage,
      chatContextTurns,
    } = this.langChainParams;

    const memory = this.memoryManager.getMemory();
    
    let prompt;
    
    if (ignoreSystemMessage) {
      const prompt = ChatPromptTemplate.fromMessages([
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}")
      ]);
      this.setChain({
        ...this.langChainParams.options,
        prompt,
      });

    } else {
      // const prompt = ChatPromptTemplate.fromMessages([
      //   SystemMessagePromptTemplate.fromTemplate(systemMessage),
      //   new MessagesPlaceholder("history"),
      //   HumanMessagePromptTemplate.fromTemplate("{input}"),
      // ])
      this.setChain(this.langChainParams.options);
    }

    let fullAIResponse = "";
    const chatModel = (ChainManager.chain as any).last.bound;
    const chatStream = await ChainManager.chain.stream({
      input: userMessage,
    } as any);

    try {
      if (debug) {
        console.log(
          `*** DEBUG INFO ***\n` +
          `user message: ${userMessage}\n` +
          // ChatOpenAI has modelName, some other ChatModels like ChatOllama have model
          `model: ${chatModel.modelName || chatModel.model}\n` +
          `temperature: ${temperature}\n` +
          `maxTokens: ${maxTokens}\n` +
          `system message: ${systemMessage}\n` +
          `chat context turns: ${chatContextTurns}\n`,
        )
      }
      for await (const chunk of chatStream) {
        if (abortController.signal.aborted) break;
        fullAIResponse += chunk.content;
        setCurrentAIResponse(fullAIResponse);
      }
    } catch (error) {
      const errorData = error?.response?.data?.error || error;
      const errorCode = errorData?.code || error;
      if (errorCode === "model_not_found") {
        const modelNotFoundMsg = "You do not have access to this model or the model does not exist, please check with your API provider";
        new Notice(modelNotFoundMsg);
        console.error(modelNotFoundMsg);
      } else {
        new Notice(`Langchain error: ${errorCode}`);
        console.error(errorData);
      }
    } finally {
      if (fullAIResponse) {
        await memory.saveContext(
          { input: userMessage },
          { output: fullAIResponse },
        );

        // Update oveall chat history at the very end
        updateChatHistory(fullAIResponse)
      }
      // TODO @belinda: here currentAIMessage is updated to "" in the original repo. Probably good to keep currentAIMessage and the text that is displayed separate, once UI is implemented.
    }
    return fullAIResponse;
  }

}