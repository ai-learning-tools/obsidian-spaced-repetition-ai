import { LangChainParams } from "@/LLM/aiParams";
import { Notice } from "obsidian";
import ChatModelManager from "@/LLM/ChatModelManager";
import { ChatModelDisplayNames, DISPLAY_NAME_TO_MODEL } from "@/constants";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { StateGraph, MemorySaver, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { Runnable } from "@langchain/core/runnables";
import { ChatMessage } from "@/chatMessage";


export default class ChainManager {
  private static instance: ChainManager;
  public chatModelManager: ChatModelManager;
  public langChainParams: LangChainParams;

  constructor(
    langChainParams: LangChainParams
  ) {
    this.langChainParams = langChainParams;
    this.chatModelManager = ChatModelManager.getInstance( 
      this.langChainParams
    ); 
    this.setModel(this.langChainParams.modelDisplayName);
  }

  static getInstance(
    langChainParams: LangChainParams
  ): ChainManager {
    if (!ChainManager.instance) {
      ChainManager.instance = new ChainManager(langChainParams);
    }
    return ChainManager.instance;
  }


  resetParams(langChainParams: LangChainParams): void {
    if (langChainParams !== undefined) {
      this.langChainParams = langChainParams;
    }
    this.chatModelManager = ChatModelManager.resetInstance( 
      this.langChainParams
    ); 
    this.setModel(this.langChainParams.modelDisplayName);
  }  
  
  /**
   * Update the active model and create a new chain
   * with the specified model display name.
   */
  setModel(newModelDisplayName: ChatModelDisplayNames): void {
    try {
      const newModel = DISPLAY_NAME_TO_MODEL[newModelDisplayName];
      this.langChainParams.model = newModel;
      this.langChainParams.modelDisplayName = newModelDisplayName;

      this.chatModelManager.setChatModel(newModelDisplayName);
      console.log(`Setting model to ${newModelDisplayName}: ${newModel}`);
    } catch (error) {
      console.error(`setModel failed: ${error}`);
      console.log(`Model: ${this.langChainParams.model}`);
    }
  }  
  
  async runChain(
    modifiedMessage: string,
    messageHistory: ChatMessage[], // all messages not including newest user message
    abortController: AbortController,
    setCurrentAIResponse: (response: string) => void,
    updateMessageHistory: (response: string) => void,
  ) {

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

    // Define the graph state
    const GraphState = Annotation.Root({
      messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
      })
    })

    // Define the tools for the agent to use
    const qaTool = tool(async (res) => {
      if (res.cards.length > 1) {
        return res;
      }
      throw new Error("No cards generated");
      }, {
      name: "flashcard-generator",
      description: "Call to generate spaced repetition flashcards",
      schema: z.object({
        cardsSummary: z.string().describe("Let the user know what the cards cover, don't cover, and how they relate to the source material."),
        cards: z.array(z.object({
          front: z.string().describe("The front side of the card containing the question or prompt"),
          back: z.string().describe("The back side of the card containing the answer or explanation")
        })).describe("An array of question-answer pairs representing spaced repetition cards")
      }),
    });

    const tools = [qaTool];
    const toolNode = new ToolNode<typeof GraphState.State>(tools);

    const chatModel = this.chatModelManager.getChatModel();
    const chatRunnable = chatModel.bindTools(tools);

    async function callModel(state: typeof GraphState.State) {
      const messages = state.messages;
      const response = await chatRunnable.invoke(messages);

      return { messages: [ response ]};
    }

    // Define the function that determines whether to continue or not
    function shouldContinue(state: typeof GraphState.State) {
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

    const workflow = new StateGraph(GraphState)
      .addNode("agent", callModel)
      .addNode('tools', toolNode)
      .addEdge("__start__", "agent")
      .addConditionalEdges("agent", shouldContinue)
      .addEdge('tools', '__end__');

    const graph: Runnable = workflow.compile({ checkpointer });

    let fullAIResponse = "";

    // Convert messageHistory into an array of AIMessage and HumanMessage
    const convertedMessages = messageHistory.flatMap((message) => {
      const messages: BaseMessage[] = [];
      if (message.userMessage) {
        messages.push(new HumanMessage(message.userMessage));
      } 
      if (message.aiResponse) {
        messages.push(new AIMessage(message.aiResponse));
      }
      return messages;
    });

    
    // Combine the converted messages with the system message and new user message
    const allMessages = [
      new SystemMessage(systemMessage),
      ...convertedMessages,
      new HumanMessage(modifiedMessage),
    ];

    console.log('ALL MESSAGES, CHAIN MANAGER:', allMessages);

    // TODO: abort stream upon abort controller https://github.com/langchain-ai/langgraphjs/issues/319
    const eventStream = await graph.streamEvents(
        { messages: allMessages },
        { 
          version: "v1", 
          configurable: { thread_id: "42"}        
        } // TODO @bmo: Thread id must be specified. Right now it isn't saved. We'll want to save unique threads at some point.
    );

    try {
      console.log(
        `*** DEBUG INFO ***\n` +
        `messages: ${JSON.stringify(messageHistory)}\n` +
        // ChatOpenAI has modelName, some other ChatModels like ChatOllama have model
        `model: ${chatModel.modelName || chatModel.model}\n` +
        `temperature: ${temperature}\n` +
        `maxTokens: ${maxTokens}\n` +
        `system message: ${systemMessage}\n` +
        `chat context turns: ${chatContextTurns}\n`,
      );
      for await (const event of eventStream) {
        if (abortController.signal.aborted) {
          return;
        }
        
        // https://js.langchain.com/v0.1/docs/modules/agents/how_to/streaming/
        if (event.event === 'on_llm_stream') {

          // during llm call. it may include tool call
          const content = event.data?.chunk?.message?.content;
          if (content && content !== '') {
            fullAIResponse += content;
            setCurrentAIResponse(fullAIResponse);
          }

          // for object streaming during tool call
          const toolContent = event.data?.chunk?.message?.tool_call_chunks?.[0]?.args;
          if (toolContent && toolContent !== '') {
            fullAIResponse += toolContent;
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
        // Update overall chat history at the very end
        updateMessageHistory(fullAIResponse)
      }
    }
    return fullAIResponse;
  }

}