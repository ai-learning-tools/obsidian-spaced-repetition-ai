import { BaseLanguageModel } from "langchain/base_language";
import { BaseChatMemory } from "langchain/memory";
import { ChatPromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

export interface LLMChainInput {
  llm: BaseLanguageModel;
  memory: BaseChatMemory;
  prompt: ChatPromptTemplate;
  abortController?: AbortController;
}

// Structure of Document with content and metadata <3
export interface Document<T = Record<string, any>> {
  pageContent: string;
  metadata: T,
}

export enum ChainType {
  VANILLA = "vanilla",
  // TODO - add more variations to experiment with
}

// When we have more advanced forms of retrieval, we can specify that here
export default class ChainFactory {
  public static instances: Map<string, RunnableSequence> = new Map();

  /**
   * Create a new LLM chain using the provided LLMChainInput
   * @param {LLMChainInput} args - the input for creating the LLM chain
   * @return {RunnableSequence} - the newly created LLM chain
   */
  public static createNewLLMChain(args: LLMChainInput): RunnableSequence {
    const { llm, memory, prompt, abortController } = args;

    const model = llm.bind({ signal: abortController?.signal });
    const instance = RunnableSequence.from([
      {
        input: (initialInput) => initialInput.input,
        memory: () => memory.loadMemoryVariables({}),
      },
      {
        input: (previousOutput) => previousOutput.input,
        history: (previousOutput) => previousOutput.memory.history,
      },
      prompt,
      model,
    ]);
    ChainFactory.instances.set(ChainType.VANILLA, instance);
    console.log("New LLM chain created.");
    return instance;
  }

  /**
   * Gets the LLM chain singleton from the map.
   *
   * @param {LLMChainInput} args - the input for the LLM chain
   * @return {RunnableSequence} the LLM chain instance
   */
  public static getLLMChainFromMap(args: LLMChainInput): RunnableSequence {
    let instance = ChainFactory.instances.get(ChainType.VANILLA);
    if (!instance) {
      instance = ChainFactory.createNewLLMChain(args);
    }
    return instance;
  }
}