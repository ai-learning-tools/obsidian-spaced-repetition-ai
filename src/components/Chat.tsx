import MessageSegment from '@/components/chat/MessageSegment'
import * as React from 'react';
import { useState, useEffect } from 'react';
import { MessageHistoryHook } from '../hooks/useMessageHistory';
import SRPlugin from '@/main';
import { TFile } from 'obsidian';
import { getFilteredFiles } from '@/utils/obsidianFiles';

interface ChatProps {
    plugin: SRPlugin;
    messageHistoryHook: MessageHistoryHook;
}

const Chat: React.FC<ChatProps> = ({
    plugin,
    messageHistoryHook,
}) => {
    const { messageHistory, createUpdateFunctions, addNewMessage, clearAll } = messageHistoryHook;

    const { workspace, vault } = plugin.app;

    const [activeFile, setActiveFile] = useState<TFile|null>(null);
    const [files, setFiles] = useState<TFile[]>([]);
    
    useEffect(() => {
        const updateAll = () => {
            getFilteredFiles(vault).then((files) => {
                setFiles(files);
            });
            
            const newActiveFile = workspace.getActiveFile();
            setActiveFile(newActiveFile);

        };

        updateAll();

        const onActiveLeafChange = () => {
            updateAll();
        };

        workspace.on('active-leaf-change', updateAll);

        return () => {
            workspace.off('active-leaf-change', onActiveLeafChange);
        };
    }, [vault, workspace, activeFile]);

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
                    clearAll={clearAll}
                    plugin={plugin}
                    activeFile={activeFile}
                    files={files}
                />
                );
            })}
        </div>
    )
}

export default Chat