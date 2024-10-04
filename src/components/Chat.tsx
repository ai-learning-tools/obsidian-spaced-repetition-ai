import MessageSegment from '@/components/MessageSegment'
import * as React from 'react';
import { useState, useEffect } from 'react';
import AIManager from '@/llm/AIManager';
import { useMessageHistory } from '../hooks/useMessageHistory';
import SRPlugin from '@/main';
import { dummyUserMessage, dummyEntriesGeneration } from '@/utils/dummyData';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { getFileCards, getSortedFiles } from '@/utils/obsidianFiles';
import { EntryItemGeneration } from '@/constants';

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
        aiString: null,
        aiEntries: null
        // FOR TESTING
        // Make sure to change this before committing
        // userMessage: dummyUserMessage,
        // modifiedMessage: dummyUserMessage,
        // aiString: dummyEntriesGeneration.cardsSummary,
        // aiEntries: dummyEntriesGeneration.cards
    }])

    const { workspace, vault } = plugin.app;

    const [activeFile, setActiveFile] = useState<TFile|null>(null);
    const [activeFileCards, setActiveFileCards] = useState<EntryItemGeneration[]>([]); // TODO @belinda - change the type later once we have the card class
    const [files, setFiles] = useState<TFile[]>([]);
    
    useEffect(() => {
        const updateFileCards = (newActiveFile: TFile) => {
            getFileCards(newActiveFile, vault)
            .then((cards) => {
                setActiveFileCards(cards);
            })
            .catch((error) => {
                console.error("Error fetching file cards:", error);
                setActiveFileCards([]);
            });
        };

        const updateAll = () => {
            const newActiveFile = workspace.getActiveFile();
            if (newActiveFile && (!activeFile || activeFile.path !== newActiveFile.path) && newActiveFile.extension === 'md') {
                getSortedFiles(vault).then((files) => {
                    setFiles(files);
                });
                setActiveFile(newActiveFile);
                updateFileCards(newActiveFile)
            }
        };

        updateAll();

        const onActiveLeafChange = () => {
            updateAll();
        };

        workspace.on('active-leaf-change', onActiveLeafChange);
        
        workspace.on('editor-change', () => {
            if (activeFile) updateFileCards(activeFile);
        });

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
                    plugin={plugin}
                    aiManager={aiManager}
                    activeFile={activeFile}
                    activeFileCards={activeFileCards}
                    files={files}
                />
                );
            })}
        </div>
    )
}

export default Chat