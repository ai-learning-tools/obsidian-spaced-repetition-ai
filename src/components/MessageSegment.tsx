import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChatModels, ChatModelDisplayNames, USER_SENDER } from '@/constants';
import SRPlugin from '@/main';
import { TFile } from 'obsidian';
import MentionsInput from '@/components/mentions/MentionsInput';
import Mention from '@/components/mentions/Mention'; // Fixed import path
import { ChatMessage } from '@/chatMessage';
import ChainManager from '@/LLM/ChainManager';
import { useAIState } from '@/hooks/useAIState';
import { extractNoteTitles, getNoteFileFromTitle, getFileContent } from '@/utils/utils';
import { EnterIcon } from '@/components/Icons';
import { getAIResponse } from '@/LLM/getAIResponse';

interface MessageSegmentProps {
  segment: ChatMessage
  plugin: SRPlugin;
  chainManager: ChainManager;
  debug: boolean;
  updateHistory: {
    updateUserMessage: (userMessage: string) => void;
    updateModifiedMessage: (modifiedMessage: string) => void;
    updateAIResponse: (aiResponse: string) => void;
    clearMessageHistory: () => void;
  };
  addNewMessage: () => void
}

const MessageSegment: React.FC<MessageSegmentProps> = ({ 
  segment,
  updateHistory,
  plugin,
  chainManager,
  debug,
  addNewMessage
}) => {
  // LLM
  const [
    currentModel, setModel, clearChatMemory
  ] = useAIState(chainManager);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Mentions 
  const containerRef = useRef<HTMLDivElement | null>(null);
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
    setUserMessage(newValue)
    const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
    const newMentionedFiles: TFile[] = [];
    let match: RegExpExecArray | null;
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
  const handleSendMessage = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.key === 'Enter' && !event.shiftKey)) {
      return    
    }
    if (userMessage != null) {
      // Since user pressed send, we shall update the overall conversationHistory
      updateUserMessage(userMessage)
    } else {
      return
    }

    event.preventDefault(); // Prevents adding a newline to the textarea

    let processedUserMessage = userMessage;

    const noteTitles = extractNoteTitles(userMessage);
    for (const noteTitle of noteTitles) {
      const noteFile = await getNoteFileFromTitle(plugin.app.vault, noteTitle);
      if (noteFile) {
        const noteContent = await getFileContent(noteFile, plugin.app.vault);
        processedUserMessage = `${processedUserMessage}\n\n[[${noteTitle}]]: \n${noteContent}`;
      }
    }

    updateModifiedMessage(processedUserMessage);

    // If currentMessage is not the last message, ie. user is overwriiting a message that has already been sent, then we shall clean convo History after this message
    setAIResponse("");
    clearMessageHistory();

    const updateMessageHistory = (aiResponse: string) => {
      updateAIResponse(aiResponse);
      addNewMessage();
    }

    await getAIResponse( // todo @bmo
      processedUserMessage,
      // vault,
      // mentionedFiles,
      chainManager,
      setAIResponse,
      updateMessageHistory,
      setAbortController,
      { debug }
    );
  }

  // Update overall conversation history, this is only done periodically to prevent rapid reloading
  const { 
    updateUserMessage, 
    updateModifiedMessage, 
    updateAIResponse, 
    clearMessageHistory 
  } = updateHistory;

  // We create useState in this component for variables that change often, this is used to update overall convo history periodically 
  const [aiResponse, setAIResponse] = useState<string | null>(segment.aiResponse);
  const [userMessage, setUserMessage] = useState<string | null>(segment.userMessage);

  return (
    <div className="w-full flex flex-col">
      <div>
        <MentionsInput
          value={userMessage || ''} //value cannot be null
          onChange={handleMentionsChange}
          className="w-full resize-none p-2 height-auto overflow-hidden"
          placeholder="Type your message"
          onKeyDown={handleSendMessage}
          suggestionsPortalHost={containerRef.current}
        >
          <Mention
            trigger="@"
            data={files.map((file) => ({ id: file.path, display: file.path }))}
            onAdd={(id) => handleMentionAdd(id)}
          />
        </MentionsInput>
      </div>
      <div className="flex flex-row items-center justify-start space-x-4 text-gray-400">
        <select
          value={currentModel}
          onChange={(e) => setModel(e.target.value)}
          className="text-center"
          style={{ width: `${currentModel.length}ch` }}
        >
          {Object.entries(ChatModelDisplayNames).map(([key, displayName]) => (
            <option key={key} value={key}>
              {displayName}
            </option>
          ))}
        </select>
        <p>/ Command</p>
        <p>@ Mention</p>
        <div className='flex flex-row items-center space-x-2'> <EnterIcon /> <p>Enter</p> </div>
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
      <div>{currentModel}</div>
      <div>{aiResponse}</div>
    </div>
  );
};

export default MessageSegment;