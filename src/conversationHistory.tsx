import { ChatMessage, chatReducer } from './chatMessage';
import { useReducer } from 'react';

export const useConversationHistory = (initialHistory: ChatMessage[] = []) => {
    const [conversationHistory, dispatch] = useReducer(chatReducer, initialHistory);

    const createUpdateFunctions = (index: number) => {
      return {
        updateUserMessage: (userMessage: string) => {
          dispatch({
            type: 'UPDATE_USER_MESSAGE',
            payload: { index, userMessage },
          });
        },
        updateModifiedMessage: (modifiedMessage: string) => {
          dispatch({
            type: 'UPDATE_MODIFIED_MESSAGE',
            payload: { index, modifiedMessage },
          });
        },
        updateAIResponse: (aiResponse: string) => {
          dispatch({
            type: 'UPDATE_AI_RESPONSE',
            payload: { index, aiResponse },
          });
        },
        updateErrorMessage: (errorMessage: string) => {
          dispatch({
            type: 'UPDATE_ERROR_MESSAGE',
            payload: { index, errorMessage },
          });
        },
        updateIsDoneGenerating: (isDoneGenerating: boolean) => {
          dispatch({
            type: 'UPDATE_IS_DONE_GENERATING',
            payload: { index, isDoneGenerating },
          });
        },
        clearConvoHistory: () => {
          dispatch({
            type: 'CLEAR_HISTORY_AFTER_INDEX',
            payload: { index }
          })
        }
      };
    };

    const addNewMessage = () => {
      dispatch({
        type: 'ADD_NEW_MESSAGE'
      });
    };
  
    return {
      conversationHistory,
      createUpdateFunctions,
      addNewMessage,
    };
  };