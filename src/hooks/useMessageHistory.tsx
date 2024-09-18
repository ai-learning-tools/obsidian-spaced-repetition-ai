import { EntryItemGeneration } from '@/constants';
import { ChatMessage, chatReducer } from '../chatMessage';
import { useReducer } from 'react';

export const useMessageHistory = (initialHistory: ChatMessage[] = []) => {
    const [messageHistory, dispatch] = useReducer(chatReducer, initialHistory);

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
        updateAIResponse: (aiString: string | null, aiEntries: EntryItemGeneration[] | null = null) => {
          dispatch({
            type: 'UPDATE_AI_RESPONSE',
            payload: { index, aiString, aiEntries },
          });
        },
        clearMessageHistory: (clearAll: boolean = false) => {
          dispatch({
            type: 'CLEAR_HISTORY_AFTER_INDEX',
            payload: { index: clearAll ? -1 : index}
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
      messageHistory,
      createUpdateFunctions,
      addNewMessage,
    };
  };