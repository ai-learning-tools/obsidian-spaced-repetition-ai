import { EntryItemGeneration } from '@/constants';
import { ChatMessage, chatReducer } from '../chatMessage';
import { useReducer, useEffect } from 'react';

export type MessageHistoryHook = {
  messageHistory: ChatMessage[];
  createUpdateFunctions: (index: number) => {
    updateUserMessage: (userMessage: string) => void;
    updateModifiedMessage: (modifiedMessage: string) => void;
    updateAIResponse: (aiString: string | null, aiEntries: EntryItemGeneration[] | null) => void;
    clearMessageHistory: () => void;
  };
  addNewMessage: () => void;
  clearAll: () => void;
};

export const useMessageHistory = (initialHistory: ChatMessage[] = []): MessageHistoryHook => {
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
        clearMessageHistory: () => {
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

    const clearAll = () => {
      dispatch({
        type: 'CLEAR_ALL'
      });
    }

    useEffect(() => {
      if (messageHistory.length === 0) {
        dispatch({
          type: 'ADD_NEW_MESSAGE'
        });
      }
    }, [messageHistory]);
  
    return {
      messageHistory,
      createUpdateFunctions,
      addNewMessage,
      clearAll,
    };
  };