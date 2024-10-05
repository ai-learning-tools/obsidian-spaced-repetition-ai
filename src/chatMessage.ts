import { EntryItemGeneration } from "./constants";

export interface ChatMessage {
  userMessage: string | null;
  modifiedMessage: string | null;
  aiString: string | null;
  aiEntries: EntryItemGeneration[] | null;
}

type ChatAction =
  | { type: 'UPDATE_USER_MESSAGE'; payload: { index: number; userMessage: string } }
  | { type: 'UPDATE_MODIFIED_MESSAGE'; payload: { index: number; modifiedMessage: string } }
  | { type: 'UPDATE_AI_RESPONSE'; payload: { index: number; aiString: string | null, aiEntries: EntryItemGeneration[] | null } }
  | { type: 'CLEAR_HISTORY_AFTER_INDEX'; payload: { index: number } }
  | { type: 'ADD_NEW_MESSAGE' }
  | { type: 'CLEAR_ALL' };

export const chatReducer = (
  state: ChatMessage[],
  action: ChatAction
): ChatMessage[] => {
  switch (action.type) {
    case 'UPDATE_USER_MESSAGE':
      return state.map((segment, idx) =>
        idx === action.payload.index
          ? { ...segment, userMessage: action.payload.userMessage }
          : segment
      );
    case 'UPDATE_MODIFIED_MESSAGE':
      return state.map((segment, idx) =>
        idx === action.payload.index
          ? { ...segment, modifiedMessage: action.payload.modifiedMessage }
          : segment
      );
    case 'UPDATE_AI_RESPONSE':
      return state.map((segment, idx) =>
        idx === action.payload.index
          ? { 
            ...segment, 
            aiString: action.payload.aiString || segment.aiString,  
            aiEntries: action.payload.aiEntries || segment.aiEntries
          }
          : segment
      );
    case 'CLEAR_HISTORY_AFTER_INDEX':
      return state.slice(0, action.payload.index + 1);
    case 'ADD_NEW_MESSAGE':
      return [
        ...state,
        {
          userMessage: null,
          modifiedMessage: null,
          aiString: null,
          aiEntries: null,
        },
      ];
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
};