import MessageSegment from '@/components/MessageSegment'
import * as React from 'react';
import { useState, useEffect } from 'react';
import AIManager from '@/llm/AIManager';
import { useMessageHistory } from '../hooks/useMessageHistory';
import SRPlugin from '@/main';
import { dummyUserMessage, dummyEntriesGeneration } from '@/utils/dummyData';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { getSortedFiles } from '@/utils/obsidianFiles';

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
        // userMessage: null,
        // modifiedMessage: null,
        // aiString: null,
        // aiEntries: null
        // FOR TESTING
        // Make sure to change this before committing
        userMessage: dummyUserMessage,
        modifiedMessage: dummyUserMessage,
        aiString: dummyEntriesGeneration.cardsSummary,
        aiEntries: dummyEntriesGeneration.cards
    }])

    const { workspace, vault } = plugin.app;

    const [activeFile, setActiveFile] = useState<TFile|null>(workspace.getActiveFile());
    const [files, setFiles] = useState<TFile[]>([]);

    workspace.on('active-leaf-change', (leaf: WorkspaceLeaf | null) => {
        const newActiveFile = workspace.getActiveFile();
        if (newActiveFile === null || newActiveFile.extension === 'md') {
            setActiveFile(newActiveFile);
        }
    });

    const updateFiles = async () => {
        const files = await getSortedFiles(vault);
        setFiles(files);
    }

    // this may be compute intensive if user has many files
    vault.on('create', updateFiles);
    vault.on('delete', updateFiles);
    vault.on('rename', updateFiles);

    useEffect(() => {
        getSortedFiles(vault).then((files) => {
            setFiles(files);
        });
    }, [vault]);

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
                    app={plugin.app}
                    aiManager={aiManager}
                    activeFile={activeFile}
                    files={files}
                />
                );
            })}
        </div>
    )
}

export default Chat