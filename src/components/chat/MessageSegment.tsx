import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChatModelDisplayNames, EntryItemGeneration } from '@/constants';
import { TFile } from 'obsidian';
import SRPlugin from '@/main';
import MentionsInput from '@/components/mentions/MentionsInput';
import { ChatMessage } from '@/chatMessage';
import Mention from '@/components/mentions/Mention'; 
import AIManager from '@/llm/AIManager';
import { useAIState } from '@/hooks/useAIState';
import { getFileContent, writeCardtoFile } from '@/utils/obsidianFiles';
import { EnterIcon, RefreshIcon } from '@/components/Icons';
import ChatTag from '@/components/chat/ChatTag';
import { errorMessage } from '@/utils/errorMessage';
import Markdown from 'react-markdown';
import { EntryView } from '@/components/EntryView';
import { useMessageContext } from '@/hooks/useMessageContext';

interface MessageSegmentProps {
  segment: ChatMessage
  aiManager: AIManager;
  updateHistory: {
    updateUserMessage: (userMessage: string) => void;
    updateModifiedMessage: (modifiedMessage: string) => void;
    updateAIResponse: (aiString: string | null, aiEntries: EntryItemGeneration[] | null) => void;
    clearMessageHistory: () => void;
  };
  messageHistory: ChatMessage[],
  addNewMessage: () => void,
  clearAll: () => void,
  index: number,
  plugin: SRPlugin,
  activeFile: TFile | null,
  activeFileCards: EntryItemGeneration[],
  files: TFile[],
}

const MessageSegment: React.FC<MessageSegmentProps> = ({ 
  index,
  segment,
  updateHistory,
  messageHistory,
  aiManager,
  addNewMessage,
  clearAll,
  plugin,
  activeFile,
  files,
}) => {
  // LLM
  const [ currentModel, setModel ] = useAIState(aiManager);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // We create useState in this component for variables that change often, this is used to update overall convo history periodically 
  const [aiString, setAIString] = useState<string | null>(segment.aiString);
  const [aiEntries, setAIEntries] = useState<EntryItemGeneration[] | null>(segment.aiEntries);
  const [userMessage, setUserMessage] = useState<string | null>(segment.userMessage);

  const { mentionedFiles, handleFileAdd, removeFile } = useMessageContext(files, activeFile, plugin.settings.includeCurrentFile); // See commit 7ef47c918bc8f9e8252373cd1286e288c5ce0a91 and 1 commit ahead of it to add cards back in

  // Mentions 
  const inputRef = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  // Update overall conversation history, this is only done periodically to prevent rapid reloading
  const { 
    updateUserMessage, 
    updateModifiedMessage, 
    updateAIResponse, 
    clearMessageHistory 
  } = updateHistory;


  const handleMentionsChange = (e: any, newValue: string) => {
    const fileRegex = /@\[(.*?)\]\((.*?)\)/g;
    const newUserMessage = newValue.replace(fileRegex, '');
    setUserMessage(newUserMessage);
  };

  const handleSendMessage = async (event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {

    if ('key' in event) { // Handle textarea
      if (!(event.key === 'Enter' && !event.shiftKey)) return;
      event.preventDefault(); // Prevents adding a newline to the textarea
    }
    if (!userMessage) return;
    
    clearMessageHistory(); // Clear message history from current index
    handleStopGenerating();

    updateUserMessage(userMessage);

    let modifiedMessage = `----- USER MESSAGE -----\n\n${userMessage}`;
    const entriesToEdit = messageHistory[index-1]?.aiEntries;
    if (index !== 0 && entriesToEdit && entriesToEdit.length > 0) {
      modifiedMessage += `----- FLASHCARDS FOR YOU TO EDIT -----\n\n${entriesToEdit!.join('\n\n')}`
    }
    if (mentionedFiles.length > 0) {
      modifiedMessage += `\n\n----- REFERENCE FILES -----\n\n`
      for (const [index, file] of mentionedFiles.entries()) {
        const fileContent = await getFileContent(file, plugin.app.vault);
        modifiedMessage += `\n\n--REFERENCE #${index + 1}: [[${file.name}]]--\n\n${fileContent}`;
      }
    }

    updateModifiedMessage(modifiedMessage);

    // If currentMessage is not the last message, ie. user is overwriting a message that has already been sent, then we clean conversation history after this message
    setAIString(null);
    setAIEntries(null);

    if (index < messageHistory.length - 1) {
      await aiManager.setNewThread(messageHistory.slice(0, index));
    } 

    const controller = new AbortController();
    setAbortController(controller);
    
    await aiManager.streamAIResponse(
      modifiedMessage,
      controller,
      setAIString,
      setAIEntries
    );

    setAbortController(null);

    updateAIResponse(aiString, aiEntries);
    addNewMessage();
  }

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
      }
    }
    if (feedback === 'y') {
      if (activeFile) {
        await writeCardtoFile(entry, activeFile, plugin);
      } else {
        errorMessage(`Oops, please open the file where you'd like to write this flashcard`);
      }
    }
    removeEntry();
  };

  const addAllCards = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (aiEntries && activeFile) {
      await Promise.all(aiEntries.map((entry) => writeCardtoFile(entry, activeFile, plugin)));
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
          className="w-full resize-none p-2 height-auto border border-neutral-200 rounded overflow-hidden"
          placeholder={index === 0 ? 'Remember anything, [[ to include your notes' : 'Ask a follow-up question'}
          onKeyDown={handleSendMessage}
          suggestionsPortalHost={portalRef.current}
        >
          <Mention
            trigger="[["
            data={files.map((file) => ({ id: file.path, display: file.path }))}
            onAdd={(id: string) => handleFileAdd(id)}
          />
        </MentionsInput>
      </div>
      <div className="flex flex-row flex-wrap items-center justify-start my-2 space-x-4 text-neutral-400 [&>*]:cursor-pointer [&>*]:mb-2">
        <select
          value={currentModel}
          onChange={handleModelChange}
          className="text-center"
          style={{ width: '150px' }}
        >
          {Object.entries(ChatModelDisplayNames).map(([key, displayName]) => (
            <option key={key} value={displayName}>
              {displayName}
            </option>
          ))}
        </select>
        <div 
          onClick={async () => {
            clearAll();
            if (index === 0) {
              setUserMessage(null);
              setAIEntries(null);
              setAIString(null);
              setAbortController(null);
            }
            await aiManager.setNewThread();
          }}
        >
          + New
        </div>
        {/* <div className="flex items-center">
          <input
            type="checkbox"
            id="generateCards"
            checked={generateCards || false}
            onChange={() => setGenerateCards(!generateCards)}
            className="mr-2"
          />
          <label htmlFor="generateCards">Generate cards</label>
        </div> */}
        <div 
          onClick={() => {
            setUserMessage((userMessage || '') + ' [[')
            inputRef.current?.focus();
          }} 
        >
          <p>{`[[`} for File</p>
        </div>
        <div 
          onClick={async (e) => {await handleSendMessage(e)}}
          className='flex flex-row items-center space-x-2'
        > 
          <EnterIcon /> 
          <p>Enter</p> 
        </div>
        {aiString && !abortController && (userMessage === messageHistory[index].userMessage) && (
          <div  
            onClick={async (e) => {await handleSendMessage(e)}}
            className='flex flex-row items-center space-x-2'
          >
            <RefreshIcon />
          </div>
        )}
        {abortController && (
          <button className='p-4' onClick={handleStopGenerating}>Cancel generation</button>
        )}
      </div>

      <div
        id="suggestionPortal"
        className="flex"
        ref={portalRef}
      ></div>

      {
        mentionedFiles.length > 0 && 
        <div className='m-4'>
          <p className='pb-2'>Using context:</p>
          <div className="flex-wrap">
            {mentionedFiles.map((file, index) => (
              <ChatTag 
                key={file.path} 
                name={file.name} 
                handleRemove={() => removeFile(index)} 
              />
            ))}
          </div>
        </div>
      }

      {(index === 0 && !aiString && (activeFile && !plugin.settings.includeCurrentFile  && !mentionedFiles.some(file => file.path === activeFile.path))) && (
      <div className='m-4'>
        <div className='mb-2'> 
          Add current file:
        </div>
        <div>
          {!plugin.settings.includeCurrentFile && activeFile && !mentionedFiles.some(file => file.path === activeFile.path) && (
            <ChatTag 
              key={`active-${activeFile.name}`}
              name={`+ ${activeFile.name}`}
              handleClick={() => { handleFileAdd(activeFile.path) }} 
            />
          )}
        </div>
      </div>
      )}
   
      <div className='m-4 space-y-2'>
        {aiString && (
          <div className='pb-4'>
            <Markdown>{aiString}</Markdown>
          </div>
        )}
        {aiEntries?.map((entry, i) => (
          <EntryView 
            handleFeedback={async (feedback: 'y' | 'n') => {
              await handleCardFeedback(feedback, entry, i);
            }}
            front={entry.front || ""} 
            back={entry.back || ""} 
            key={`entry-${i}-length-${aiEntries.length}`}
          />
        ))}
        {aiEntries && (
          <>
            <div className='float-right'>
              {activeFile ? (
                  <span>Adding to {activeFile.name}</span>
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