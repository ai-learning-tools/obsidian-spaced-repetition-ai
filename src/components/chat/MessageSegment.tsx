import * as React from 'react';
import { useState, useRef } from 'react';
import { ChatModelDisplayNames, EntryItemGeneration } from '@/constants';
import { TFile } from 'obsidian';
import SRPlugin from '@/main';
import MentionsInput from '@/components/mentions/MentionsInput';
import { ChatMessage } from '@/chatMessage';
import Mention from '@/components/mentions/Mention'; 
import { useAIState } from '@/hooks/useAIState';
import { getFileContent, writeCardtoFile } from '@/utils/obsidianFiles';
import { EnterIcon, RefreshIcon } from '@/components/Icons';
import ChatTag from '@/components/chat/ChatTag';
import { errorMessage } from '@/utils/errorMessage';
import Markdown from 'react-markdown';
import { EntryView } from '@/components/EntryView';
import { useFiles } from '@/hooks/useFiles';

interface MessageSegmentProps {
  segment: ChatMessage
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
  files: TFile[],
}

const MessageSegment: React.FC<MessageSegmentProps> = ({ 
  index,
  segment,
  updateHistory,
  messageHistory,
  addNewMessage,
  clearAll,
  plugin,
  activeFile,
  files,
}) => {

  // LLM
  const { aiManager } = plugin;
  const [ currentModel, setModel ] = useAIState(aiManager);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // We create useState in this component for variables that change often, this is used to update overall convo history periodically 
  const [aiString, setAIString] = useState<string | null>(segment.aiString);
  const [aiEntries, setAIEntries] = useState<EntryItemGeneration[] | null>(segment.aiEntries);
  const [userMessage, setUserMessage] = useState<string | null>(segment.userMessage);

  const { mentionedFiles, handleFileAdd, removeFile } = useFiles(files, activeFile, plugin.settings.includeCurrentFile); // See commit 7ef47c918bc8f9e8252373cd1286e288c5ce0a91 and 1 commit ahead of it to add cards back in

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

    let modifiedMessage = `<USER MESSAGE>\n\n${userMessage}</USER MESSAGE>`;
    const entriesToEdit = messageHistory[index-1]?.aiEntries;
    if (index !== 0 && entriesToEdit && entriesToEdit.length > 0) {
      const stringifiedEntries = entriesToEdit.map(entry => 
        `<flashcard><question>${entry.front}</question><answer>${entry.back}</answer></flashcard>`
      ).join('\n\n');
      modifiedMessage += `<FLASHCARDS FOR YOU TO EDIT>\n\n${stringifiedEntries}</FLASHCARDS FOR YOU TO EDIT>`;
    }

    if (mentionedFiles.length > 0) {
      modifiedMessage += `\n\n<REFERENCE FILES>`
      for (const [index, file] of mentionedFiles.entries()) {
        const fileContent = await getFileContent(file, plugin.app.vault);
        modifiedMessage += `\n\n<REFERENCE>#${index + 1}: [[${file.name}]]\n---\n\n${fileContent}</REFERENCE>`;
      }
      modifiedMessage += '</REFERENCE FILES>'
    }

    updateModifiedMessage(modifiedMessage);

    if (index < messageHistory.length - 1) {
      await aiManager.setNewThread(index);
    } 

    const controller = new AbortController();
    setAbortController(controller);
    
    const { str, entries } = await aiManager.streamAIResponse(
      modifiedMessage,
      controller,
      setAIString,
      setAIEntries
    );

    setAbortController(null);

    updateAIResponse(str, entries);
    addNewMessage();
  }

  const handleStopGenerating = () => {
    if (abortController) {
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
        removeEntry();
      } else {
        errorMessage(`Oops, please open the file where you'd like to write this flashcard`);
      }
    } else {
      removeEntry();
    }
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
        {/* @ts-ignore */}
        <MentionsInput
          value={userMessage || ''} 
          inputRef={inputRef}
          onChange={handleMentionsChange}
          className="w-full resize-none p-2 height-auto theme-border border rounded overflow-hidden"
          placeholder={index === 0 ? 'Remember anything, [[ to include your notes' : 'Ask a follow-up question'}
          onKeyDown={handleSendMessage}
          suggestionsPortalHost={portalRef.current}
        >
          <Mention
            trigger="[["
            // @ts-ignore
            data={files.map((file) => ({ id: file.path, display: file.path }))}
            onAdd={(id: string) => handleFileAdd(id)}
          />
        </MentionsInput>
      </div>
      <div className="flex flex-row flex-wrap items-center justify-start my-2 space-x-4 theme-text-faint [&>*]:cursor-pointer [&>*]:mb-2">
        <select
          value={currentModel}
          onChange={handleModelChange}
          className="text-center theme-bg-surface theme-border theme-text"
          style={{ width: '160px' }}
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
          className="theme-bg-hover rounded px-4 py-2"
        >
          + New
        </div>
        <div 
          onClick={() => {
            setUserMessage((userMessage || '') + ' [[')
            inputRef.current?.focus();
          }} 
          className="theme-bg-hover rounded px-4 py-2"
        >
          <p>{`[[`} for File</p>
        </div>
        <div 
          onClick={async (e) => {await handleSendMessage(e)}}
          className='flex flex-row items-center space-x-2 theme-bg-hover rounded px-4 py-2'
        > 
          <EnterIcon /> 
          <p>Enter</p> 
        </div>
        {aiString && !abortController && (userMessage === messageHistory[index].userMessage) && (
          <div  
            onClick={async (e) => {await handleSendMessage(e)}}
            className='flex flex-row items-center space-x-2 theme-bg-hover rounded px-4 py-2'
          >
            <RefreshIcon />
          </div>
        )}
        {abortController && (
          <button className='p-4 theme-bg-hover rounded' onClick={handleStopGenerating}>Cancel generation</button>
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
          <p className='pb-2 theme-text'>Using context:</p>
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
        <div className='mb-2 theme-text'> 
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
          <div className='pb-4 theme-text'>
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
        {aiEntries && aiEntries.length > 0 && (
          <>
            <div className='float-right'>
              {activeFile ? (
                  <span className="theme-text">Adding to {activeFile.name}</span>
              ) : (
                  <span className="theme-text">Open a file to add cards</span>
              )}
              <button disabled={activeFile === null} className='cursor-pointer p-4 ml-4 disabled:theme-text-faint theme-bg-hover rounded' onClick={addAllCards}>Add all cards</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageSegment;