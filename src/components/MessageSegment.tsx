import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChatModelDisplayNames } from '@/constants';
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
  messageHistory: ChatMessage[],
  addNewMessage: () => void
}

const MessageSegment: React.FC<MessageSegmentProps> = ({ 
  segment,
  updateHistory,
  messageHistory,
  plugin,
  chainManager,
  debug,
  addNewMessage
}) => {
  // LLM
  const [
    currentModel, setModel,
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
    if (!(event.key === 'Enter' && !event.shiftKey))  return;
    if (!userMessage) return;
    event.preventDefault(); // Prevents adding a newline to the textarea
    
    updateUserMessage(userMessage);

    let modifiedMessage = userMessage;
    for (const file of mentionedFiles) {
      const fileContent = await getFileContent(file, plugin.app.vault);
      modifiedMessage = `${modifiedMessage}\n\n[[${file.name}]]: \n${fileContent}`;
    }

    updateModifiedMessage(modifiedMessage);

    // If currentMessage is not the last message, ie. user is overwriting a message that has already been sent, then we shall clean convo History after this message
    setAIResponse("");
    clearMessageHistory();

    const updateMessageHistory = (aiResponse: string) => {
      updateAIResponse(aiResponse);
      addNewMessage();
    }

    await getAIResponse(
      modifiedMessage,
      messageHistory,
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
    <div className="w-full flex flex-col mb-4">
      <div>
        <MentionsInput
          value={userMessage || ''} 
          onChange={handleMentionsChange}
          className="w-full resize-none p-2 height-auto overflow-hidden"
          placeholder="Type your message"
          onKeyDown={handleSendMessage}
          suggestionsPortalHost={containerRef.current}
        >
          <Mention
            trigger="@"
            data={files.map((file) => ({ id: file.path, display: file.path }))}
            onAdd={(id: string) => handleMentionAdd(id)}
          />
        </MentionsInput>
      </div>
      <div className="flex flex-row items-center justify-start my-2 space-x-4 text-gray-400">
        <select
          value={currentModel}
          onChange={(e) => setModel(e.target.value)}
          className="text-center"
          style={{ width: '150px' }}
        >
          {Object.entries(ChatModelDisplayNames).map(([key, displayName]) => (
            <option key={key} value={key}>
              {displayName}
            </option>
          ))}
        </select>
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
          <ul className=" text-gray-400">
            {mentionedFiles.map(file => (
              <li key={file.path}>{file.path}</li>
            ))}
          </ul>
        </div>
      }
      <div className='m-4'>{aiResponse}</div>
    </div>
  );
};

export default MessageSegment;