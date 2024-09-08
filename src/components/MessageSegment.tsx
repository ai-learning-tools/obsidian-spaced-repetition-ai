import * as React from 'react';
import { useState, useRef } from 'react';
import { ChatModelDisplayNames, EntryItemGeneration } from '@/constants';
import { App, TFile, MarkdownView } from 'obsidian';
import MentionsInput from '@/components/mentions/MentionsInput';
import { ChatMessage } from '@/chatMessage';
import Mention from '@/components/mentions/Mention'; 
import AIManager from '@/llm/AIManager';
import { useAIState } from '@/hooks/useAIState';
import { getFileContent, writeCardtoFile } from '@/utils/obsidianFiles';
import { EnterIcon } from '@/components/Icons';
import Entry from '@/components/review/Entry';
import { errorMessage } from '@/utils/errorMessage';

interface MessageSegmentProps {
  segment: ChatMessage
  aiManager: AIManager;
  updateHistory: {
    updateUserMessage: (userMessage: string) => void;
    updateModifiedMessage: (modifiedMessage: string) => void;
    updateAIResponse: (aiString: string | null, aiEntries: EntryItemGeneration[] | null) => void;
    clearMessageHistory: (clearAll?: boolean) => void;
  };
  messageHistory: ChatMessage[],
  addNewMessage: () => void,
  index: number,
  app: App,
  activeFile: TFile | null,
  files: TFile[],
}

const MessageSegment: React.FC<MessageSegmentProps> = ({ 
  index,
  segment,
  updateHistory,
  messageHistory,
  aiManager,
  addNewMessage,
  app,
  activeFile,
  files,
}) => {
  // LLM
  const [ currentModel, setModel ] = useAIState(aiManager);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Mentions 
  const inputRef = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [mentionedFiles, setMentionedFiles] = useState<TFile[]>([]);

  // Update overall conversation history, this is only done periodically to prevent rapid reloading
  const { 
    updateUserMessage, 
    updateModifiedMessage, 
    updateAIResponse, 
    clearMessageHistory 
  } = updateHistory;

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
      const mentionedFile = files.find(file => file.path === match![2]);
      if (mentionedFile) {
        newMentionedFiles.push(mentionedFile);
      }
    }
    setMentionedFiles(newMentionedFiles);
  };

  const handleSendMessage = async (event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ('key' in event) { // Handle textarea
      if (!(event.key === 'Enter' && !event.shiftKey)) return;
      event.preventDefault(); // Prevents adding a newline to the textarea
    }
    if (!userMessage) return;

    
    clearMessageHistory(); // Clear message history from current index

    updateUserMessage(userMessage);

    let modifiedMessage = userMessage;
    for (const file of mentionedFiles) {
      const fileContent = await getFileContent(file, app.vault);
      modifiedMessage = `${modifiedMessage}\n\n[[${file.name}]]: \n${fileContent}`;
    }

    updateModifiedMessage(modifiedMessage);

    // If currentMessage is not the last message, ie. user is overwriting a message that has already been sent, then we clean conversation history after this message
    setAIString(null);
    setAIEntries(null);
    setFocusedIndex(null);

    setAbortController(new AbortController());
    
    await aiManager.streamAIResponse(
      modifiedMessage,
      messageHistory.slice(0, index),
      abortController as AbortController,
      setAIString,
      setAIEntries,
    );

    setAbortController(null);
    setFocusedIndex(0);

    updateAIResponse(aiString, aiEntries);
    addNewMessage();
  }


  // We create useState in this component for variables that change often, this is used to update overall convo history periodically 
  const [aiString, setAIString] = useState<string | null>(segment.aiString);
  const [aiEntries, setAIEntries] = useState<EntryItemGeneration[] | null>(segment.aiEntries);
  const [focusedIndex, setFocusedIndex] = useState<number|null>(0);
  const [userMessage, setUserMessage] = useState<string | null>(segment.userMessage);

  const handleStopGenerating = () => {
    if (abortController) {
      console.log("User stopping generation...");
      abortController.abort();
    }
  };

  const handleModelChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const model = event.target.value as ChatModelDisplayNames;
    setModel(model);
  };

  const handleCardFeedback = async (feedback: 'y' | 'n', entry: EntryItemGeneration, index: number) => {
    function removeEntry() {
      if (aiEntries) {
        const updatedEntries = aiEntries.filter((_, i) => i !== index);
        setAIEntries([...updatedEntries]);
        updateAIResponse(aiString, updatedEntries);
        // Adjust focus index
        if (focusedIndex !== null) {
          setFocusedIndex(Math.max(0, Math.min(
            focusedIndex > index ? focusedIndex - 1 : focusedIndex,
            updatedEntries.length - 1
          )));
        }
      }
    };
    if (feedback === 'y') {
      if (activeFile) {
        await writeCardtoFile(entry, activeFile, app.vault);
      } else {
        errorMessage(`Oops, please open the file where you'd like to write this flashcard`);
      }
    }
    removeEntry();
  };

  const addAllCards = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (aiEntries && activeFile) {
      await Promise.all(aiEntries.map((entry) => writeCardtoFile(entry, activeFile, app.vault)));
      setAIEntries([]);
    } else {
      errorMessage(`Oops, please open the file where you'd like to write your ${aiEntries?.length && aiEntries.length > 1 ? 'cards' : 'card'}`)
    }
  };


  return (
    <div className="w-full flex flex-col mb-4">
      <div>
        <MentionsInput
          value={userMessage || ''} 
          inputRef={inputRef}
          onChange={handleMentionsChange}
          className="w-full resize-none p-2 height-auto overflow-hidden"
          placeholder={index === 0 ? 'Remember anything, @ to include your notes' : 'Follow-up with questions or edits'}
          onKeyDown={handleSendMessage}
          suggestionsPortalHost={portalRef.current}
        >
          <Mention
            trigger="@"
            data={files.map((file) => ({ id: file.path, display: file.path }))}
            onAdd={(id: string) => handleMentionAdd(id)}
          />
        </MentionsInput>
      </div>
      <div className="flex flex-row items-center justify-start my-2 space-x-4 text-neutral-400">
        <select
          value={currentModel}
          onChange={handleModelChange}
          className="text-center cursor-pointer"
          style={{ width: '150px' }}
        >
          {Object.entries(ChatModelDisplayNames).map(([key, displayName]) => (
            <option key={key} value={displayName}>
              {displayName}
            </option>
          ))}
        </select>
        <div 
          className='cursor-pointer' 
          onClick={() => {
            clearMessageHistory(true);
            if (index === 0) {
              setUserMessage(null);
              setAIEntries(null);
              setFocusedIndex(null);
              setAIString(null);
              setMentionedFiles([]);
              setAbortController(null);
            }
          }}
        >
          + New
        </div>
        <div 
          onClick={() => {
            setUserMessage((userMessage || '') + ' @')
            inputRef.current?.focus();
          }} 
          className="cursor-pointer"
        >
          <p>@ Mention</p>
        </div>
        <div 
          onClick={async (e) => {await handleSendMessage(e)}}
          className='flex flex-row items-center space-x-2 cursor-pointer'
        > 
          <EnterIcon /> 
          <p>Enter</p> 
        </div>
        {abortController && (
          <button className='cursor-pointer p-4' onClick={handleStopGenerating}>Cancel generation</button>
        )}
      </div>

      {
        mentionedFiles.length > 0 && 
        <div className='m-4'>
          <p>References:</p>
          <ul className=" text-neutral-400">
            {mentionedFiles.map(file => (
              <li key={file.path}>{file.path}</li>
            ))}
          </ul>
        </div>
      }

      <div
        id="suggestionPortal"
        className="flex"
        ref={portalRef}
      ></div>

      <div className='m-4'>
        <p>Flashcards in the current file:</p>
        <div>
          <button>add to references</button>
          <button>add to edit</button>
        </div>
      </div>
   
      <div className='m-4'>
        {aiString && (
          <div className='pb-4'>
            {aiString}
          </div>
        )}
        {aiEntries?.map((entry, i) => (
          <Entry 
            handleFeedback={async (feedback: 'y' | 'n') => {
              // setAIEntries([]);
              await handleCardFeedback(feedback, entry, i);
            }}
            handleFocus={() => {
              setFocusedIndex(i);
            }}
            focused={i === focusedIndex}
            front={entry.front} 
            back={entry.back} 
            key={`${new Date()}-${i}-length-${aiEntries.length}`}
          />
        ))}
        {aiEntries && (
          <>
            <div className='float-right'>
              {activeFile ? (
                  <span>File: {activeFile.name}</span>
              ) : (
                  <span>Open a file to add cards</span>
              )}
              <button disabled={activeFile === null || aiEntries.length === 0} className='cursor-pointer p-4 ml-4 disabled:text-neutral-400' onClick={addAllCards}>Add all cards</button>
              
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageSegment;