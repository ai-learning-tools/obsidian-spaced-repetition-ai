export interface ChatMessage {
  id: number;
  userMessage: string | null;
  modifiedMessage: string | null;
  aiResponse: string | null;
  errorMessage: string | null;
  isDoneGenerating: boolean;
}

type ChatAction =
  | { type: 'UPDATE_USER_MESSAGE'; payload: { id: number; userMessage: string } }
  | { type: 'UPDATE_MODIFIED_MESSAGE'; payload: { id: number; modifiedMessage: string } }
  | { type: 'UPDATE_AI_RESPONSE'; payload: { id: number; aiResponse: string } }
  | { type: 'UPDATE_ERROR_MESSAGE'; payload: { id: number; errorMessage: string } }
  | { type: 'UPDATE_IS_DONE_GENERATING'; payload: { id: number; isDoneGenerating: boolean } };


export const chatReducer = (
  state: ChatMessage[],
  action: ChatAction
): ChatMessage[] => {
  switch (action.type) {
    case 'UPDATE_USER_MESSAGE':
      return state.map((segment) =>
        segment.id === action.payload.id
          ? { ...segment, userMessage: action.payload.userMessage }
          : segment
      );
    case 'UPDATE_MODIFIED_MESSAGE':
      return state.map((segment) =>
        segment.id === action.payload.id
          ? { ...segment, modifiedMessage: action.payload.modifiedMessage }
          : segment
      );
    case 'UPDATE_AI_RESPONSE':
      return state.map((segment) =>
        segment.id === action.payload.id
          ? { ...segment, aiResponse: action.payload.aiResponse }
          : segment
      );
    case 'UPDATE_ERROR_MESSAGE':
      return state.map((segment) =>
        segment.id === action.payload.id
          ? { ...segment, errorMessage: action.payload.errorMessage }
          : segment
      );
    case 'UPDATE_IS_DONE_GENERATING':
      return state.map((segment) =>
        segment.id === action.payload.id
          ? { ...segment, isDoneGenerating: action.payload.isDoneGenerating }
          : segment
      );
    default:
      return state;
  }
};