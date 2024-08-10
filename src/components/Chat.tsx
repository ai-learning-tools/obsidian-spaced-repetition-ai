import ChatSegment from '@/components/ChatSegment'
import * as React from 'react';
import ChainManager from '@/LLM/chainManager';
import { useConversationHistory } from '../conversationHistory';
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
    const { conversationHistory, createUpdateFunctions, addNewMessage } = useConversationHistory([{
        userMessage: "Hello, how can I assist you today?",
        modifiedMessage: null,
        aiResponse: null,
        errorMessage: null,
        isDoneGenerating: false
    }])
    

    return (
        <div className='w-full'>
        {conversationHistory.map((segment, index) => {
            const updateFunctions = createUpdateFunctions(index);
            return (
            <ChatSegment
                key={index}
                segment={segment}
                // TODO: rename to updateConvo? 
                updateFunctions={updateFunctions}
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