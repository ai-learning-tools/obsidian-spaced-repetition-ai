import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChatModels, ChatModelDisplayNames, USER_SENDER } from '@/constants';
import SRPlugin from '@/main';
import { TFile } from 'obsidian';
import MentionsInput from '@/components/mentions/MentionsInput';
import Mention from '@/components/mentions/Mention'; // Fixed import path
import defaultStyle from '@/components/defaultStyle'
import SharedState, { useSharedState, ChatMessage } from '@/sharedState';
import ChainManager from '@/LLM/chainManager';
import { useAIState } from '@/aiState';
import { extractNoteTitles, getNoteFileFromTitle, getFileContent } from '@/utils';
import { getAIResponse } from '@/langChainStream';
interface ChatSegmentProps {
  plugin: SRPlugin;
  sharedState: SharedState;
  chainManager: ChainManager;
  debug: boolean
}


const ChatSegment: React.FC<ChatSegmentProps> = ({ 
  plugin,
  sharedState,
  chainManager,
  debug
}) => {
  const [
    chatHistory, addMessage, clearMessages
  ] = useSharedState(sharedState);
  const [
    currentModel, setModel, clearChatMemory
  ] = useAIState(chainManager);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [message, setMessage] = useState<string>('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(ChatModels.GPT_35_TURBO);
  const [files, setFiles] = useState<TFile[]>([]);
  const [mentionedFiles, setMentionedFiles] = useState<TFile[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const filesInVault = await plugin.getFilesInVault();
      setFiles(filesInVault);
      console.log('DEBUG-Athena2', filesInVault);
    };
    fetchFiles();
  }, [plugin]);

  const handleMentionAdd = (id: string) => {
    const mentionedFile = files.find(file => file.path === id);
    if (mentionedFile && !mentionedFiles.includes(mentionedFile)) {
      setMentionedFiles([...mentionedFiles, mentionedFile]);
    }
  };

  const handleMentionsChange = (e: any, newValue: string) => {
    setMessage(newValue);
    const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
    const newMentionedFiles: TFile[] = [];
    let match;
    while ((match = mentionRegex.exec(newValue)) !== null) {
      console.log(match)
      const mentionedFile = files.find(file => file.path === match[2]);
      if (mentionedFile) {
        newMentionedFiles.push(mentionedFile);
      }
    }
    setMentionedFiles(newMentionedFiles);
  };

  // dummy function for now to demonstrate streaming
  const handleSendMessage = async () => {
    const inputMessage = "What's the meaning of life?";

    let processedUserMessage = inputMessage;

    const noteTitles = extractNoteTitles(inputMessage);
    for (const noteTitle of noteTitles) {
      const noteFile = await getNoteFileFromTitle(plugin.app.vault, noteTitle);
      if (noteFile) {
        const noteContent = await getFileContent(noteFile, plugin.app.vault);
        processedUserMessage = `${processedUserMessage}\n\n[[${noteTitle}]]: \n${noteContent}`;
      }
    }

    const userMessage: ChatMessage = {
      message: inputMessage,
      sender: USER_SENDER,
      isVisible: true,
    };

    const promptMessageHidden: ChatMessage = {
      message: processedUserMessage,
      sender: USER_SENDER,
      isVisible: false,
    };

    // Add message to chat history
    addMessage(userMessage);
    addMessage(promptMessageHidden);

    await getAIResponse(
      promptMessageHidden,
      chainManager,
      addMessage,
      setCurrentAiMessage,
      setAbortController,
      { debug },
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div>
        <MentionsInput
          value={message}
          onChange={handleMentionsChange}
          className="w-full resize-none p-2 height-auto overflow-hidden"
          placeholder="Type your message"
          suggestionsPortalHost={containerRef.current}
        >
          <Mention
            trigger="@"
            data={files.map((file) => ({ id: file.path, display: file.path }))}
            onAdd={(id) => handleMentionAdd(id)}
          />
        </MentionsInput>
      </div>
      <div className="flex flex-row align-center justify-start space-x-4 text-gray-400">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="text-center"
          style={{ width: `${selectedModel.length}ch` }}
        >
          {Object.entries(ChatModelDisplayNames).map(([key, displayName]) => (
            <option key={key} value={key}>
              {displayName}
            </option>
          ))}
        </select>
        <p>/ Command</p>
        <p>@ Mention</p>
      </div>

      <div
        id="suggestionPortal"
        className="flex"
        ref={containerRef}
        style={{ height: 'auto' }}
      ></div>
      
      {
        mentionedFiles.length > 0 && 
        <div>
        <p>Using:</p>
          <ul>
            {mentionedFiles.map(file => (
              <li key={file.path}>{file.path}</li>
            ))}
          </ul>
        </div>
      }
      <button onClick={handleSendMessage}>SEND MESSAGE, SEE IN CONSOLE</button>
      <div>{currentAiMessage}</div>
    </div>
  );
};

export default ChatSegment;