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
    const { conversationHistory, createUpdateFunctions } = useConversationHistory([{
        id: 1,
        userMessage: 'hello it is me',
        modifiedMessage: '',
        aiResponse: '',
        errorMessage: '',
        isDoneGenerating: false
    }])

    return (
        <div className='w-full'>
        {conversationHistory.map((segment) => {
            const updateFunctions = createUpdateFunctions(segment.id);
            return (
            <ChatSegment
                key={segment.id}
                segment={segment}
                updateFunctions={updateFunctions}
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