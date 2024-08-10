import { ChatMessage, chatReducer } from './chatMessage';
import { useReducer } from 'react';

export const useConversationHistory = (initialHistory: ChatMessage[] = []) => {
    const [conversationHistory, dispatch] = useReducer(chatReducer, initialHistory);

    
  
    const createUpdateFunctions = (id: number) => {
      return {
        updateUserMessage: (userMessage: string) => {
          dispatch({
            type: 'UPDATE_USER_MESSAGE',
            payload: { id, userMessage },
          });
        },
        updateModifiedMessage: (modifiedMessage: string) => {
          dispatch({
            type: 'UPDATE_MODIFIED_MESSAGE',
            payload: { id, modifiedMessage },
          });
        },
        updateAIResponse: (aiResponse: string) => {
          dispatch({
            type: 'UPDATE_AI_RESPONSE',
            payload: { id, aiResponse },
          });
        },
        updateErrorMessage: (errorMessage: string) => {
          dispatch({
            type: 'UPDATE_ERROR_MESSAGE',
            payload: { id, errorMessage },
          });
        },
        updateIsDoneGenerating: (isDoneGenerating: boolean) => {
          dispatch({
            type: 'UPDATE_IS_DONE_GENERATING',
            payload: { id, isDoneGenerating },
          });
        },
      };
    };
  
    return {
      conversationHistory,
      createUpdateFunctions,
    };
  };