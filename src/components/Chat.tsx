import MessageSegment from '@/components/ChatSegment'
import * as React from 'react';
import ChainManager from '@/LLM/chainManager';
import { useMessageHistory } from '../hooks/useMessageHistory';
import SRPlugin from '@/main';

interface ChatProps {
    plugin: SRPlugin;
    chainManager: ChainManager;
    debug: boolean
  }

  // Chat contains conversation history
const Chat: React.FC<ChatProps> = ({
    plugin, 
    chainManager,
    debug
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
                segment={segment}
                updateHistory={updateHistory}
                addNewMessage={addNewMessage}
                plugin={plugin}
                chainManager={chainManager}
                debug={debug}
            />
            );
        })}
        </div>
    )
}

export default Chat