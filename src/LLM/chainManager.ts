import { LangChainParams, SetChainOptions } from "@/LLM/aiParams";
import { Notice } from "obsidian";
import ChatModelManager from "@/LLM/ChatModelManager";
import { ChatModelDisplayNames, DISPLAY_NAME_TO_MODEL } from "@/constants";
import MemoryManager from "./memoryManager";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { Runnable } from "@langchain/core/runnables";


export default class ChainManager {

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

    } catch (error) {
      new Notice(`Error creating chain: ${error}`);
      console.error(`Error creating chain: ${error}`);
    }
  }

  async runChain(
    userMessage: string,
    // files: TFile[]  = [], // todo @bmo
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
    
    interface AgentState {
      messages: BaseMessage[];
    }

    // Define the tools for the agent to use
    const qaTool = tool(async (res) => {
      if (res.cards.length > 1) {
        return res;
      }
      throw new Error("No cards generated");
      }, {
      name: "flashcard-generator",
      description: "Call to get spaced repetition cards.",
      schema: z.object({
        cards: z.array(z.object({
          question: z.string().describe("The front side of the card containing the question or prompt"),
          answer: z.string().describe("The back side of the card containing the answer or explanation")
        })).describe("An array of question-answer pairs representing spaced repetition cards")
      }),
    });


    const tools = [qaTool];
    
    const graphState: StateGraphArgs<AgentState>['channels'] = {
      messages: {
        reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      },
    }    

    const chatModel = this.chatModelManager.getChatModel()
    const chatRunnable = chatModel.bindTools(tools);

    async function callModel(state: AgentState) {
      const messages = state.messages;
      const response = await chatRunnable.invoke(messages);

      return { messages: [response ]};
    }

    // Define the function that determines whether to continue or not
    function shouldContinue(state: AgentState) {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1] as AIMessage;

      // If the LLM makes a tool call, then we route to the "tools" node
      if (lastMessage.tool_calls?.length) {
        return "tools";
      }
      // Otherwise, we stop (reply to the user)
      return "__end__";
    }

    const checkpointer = new MemorySaver();

    const workflow = new StateGraph<AgentState>({ channels: graphState })
      .addNode("agent", callModel)
      .addEdge("__start__", "agent")
      .addConditionalEdges("agent", shouldContinue)

    const graph: Runnable = workflow.compile({ checkpointer });

    let fullAIResponse = "";
    const eventStream = await graph.streamEvents(
        { messages: [new HumanMessage(userMessage)] },
        { version: "v1", configurable: { thread_id: "42 "} } // The thread
    );


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
      for await (const event of eventStream) {
        if (abortController.signal.aborted) break;
        
        // https://js.langchain.com/v0.1/docs/modules/agents/how_to/streaming/
        if (event.event === 'on_llm_stream') {
          const content = event.data?.chunk?.message?.content;
          if (content !== undefined && content !== '') {
            console.log(content);
            fullAIResponse += content;
            setCurrentAIResponse(fullAIResponse);
          }
        }
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

        // Update overall chat history at the very end
        updateChatHistory(fullAIResponse)
      }
    }
    return fullAIResponse;
  }

}