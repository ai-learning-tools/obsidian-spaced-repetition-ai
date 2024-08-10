export interface ChatMessage {
  userMessage: string | null;
  modifiedMessage: string | null;
  aiResponse: string | null;
  errorMessage: string | null;
  isDoneGenerating: boolean;
}

type ChatAction =
  | { type: 'UPDATE_USER_MESSAGE'; payload: { index: number; userMessage: string } }
  | { type: 'UPDATE_MODIFIED_MESSAGE'; payload: { index: number; modifiedMessage: string } }
  | { type: 'UPDATE_AI_RESPONSE'; payload: { index: number; aiResponse: string } }
  | { type: 'UPDATE_ERROR_MESSAGE'; payload: { index: number; errorMessage: string } }
  | { type: 'UPDATE_IS_DONE_GENERATING'; payload: { index: number; isDoneGenerating: boolean } }
  | { type: 'CLEAR_HISTORY_AFTER_INDEX'; payload: { index: number } }
  | { type: 'ADD_NEW_MESSAGE' };

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
          ? { ...segment, aiResponse: action.payload.aiResponse }
          : segment
      );
    case 'UPDATE_ERROR_MESSAGE':
      return state.map((segment, idx) =>
        idx === action.payload.index
          ? { ...segment, errorMessage: action.payload.errorMessage }
          : segment
      );
    case 'UPDATE_IS_DONE_GENERATING':
      return state.map((segment, idx) =>
        idx === action.payload.index
          ? { ...segment, isDoneGenerating: action.payload.isDoneGenerating }
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
          aiResponse: null,
          errorMessage: null,
          isDoneGenerating: false,
        },
      ];
    default:
      return state;
  }
};