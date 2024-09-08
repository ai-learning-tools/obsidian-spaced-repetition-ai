import MessageSegment from '@/components/MessageSegment'
import * as React from 'react';
import AIManager from '@/LLM/AIManager';
import { useMessageHistory } from '../hooks/useMessageHistory';
import SRPlugin from '@/main';

interface ChatProps {
    plugin: SRPlugin;
    aiManager: AIManager;
  }

// Chat contains conversation history
const Chat: React.FC<ChatProps> = ({
    plugin, 
    aiManager,
}) => {
    const { messageHistory, createUpdateFunctions, addNewMessage } = useMessageHistory([{
        userMessage: null,
        modifiedMessage: null,
        aiResponse: null,
    }])

    return (
        <div className='w-full'>
            {messageHistory.map((segment, index) => {
                const updateHistory = createUpdateFunctions(index);
                return (
                <MessageSegment
                    key={index}
                    index={index}
                    segment={segment}
                    messageHistory={messageHistory}
                    updateHistory={updateHistory}
                    addNewMessage={addNewMessage}
                    vault={plugin.app.vault}
                    aiManager={aiManager}
                />
                );
            })}
        </div>
    )
}

export default Chat