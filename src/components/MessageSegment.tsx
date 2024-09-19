import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChatModelDisplayNames, EntryItemGeneration } from '@/constants';
import { App, TFile } from 'obsidian';
import MentionsInput from '@/components/mentions/MentionsInput';
import { ChatMessage } from '@/chatMessage';
import Mention from '@/components/mentions/Mention'; 
import AIManager from '@/llm/AIManager';
import { useAIState } from '@/hooks/useAIState';
import { getFileContent, writeCardtoFile } from '@/utils/obsidianFiles';
import { EnterIcon } from '@/components/Icons';
import ChatTag from '@/components/chat/ChatTag';
import { errorMessage } from '@/utils/errorMessage';
import Markdown from 'react-markdown';
import { EntryView } from '@/components/EntryView';

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
  app,
  activeFile,
  activeFileCards,
  files,
}) => {
  // LLM
  const [ currentModel, setModel ] = useAIState(aiManager);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // We create useState in this component for variables that change often, this is used to update overall convo history periodically 
  const [aiString, setAIString] = useState<string | null>(segment.aiString);
  const [aiEntries, setAIEntries] = useState<EntryItemGeneration[] | null>(segment.aiEntries);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [userMessage, setUserMessage] = useState<string | null>(segment.userMessage);

  const [remainingActiveCards, setRemainingActiveCards] = useState<EntryItemGeneration[]>(activeFileCards); // TODO @belindamo: update this once there is a Card class. Card ids in this component also need to be updated to card.id rather than card.front for robustness

  // Mentions 
  const inputRef = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [mentionedFiles, setMentionedFiles] = useState<TFile[]>([]);
  const [mentionedCards, setMentionedCards] = useState<EntryItemGeneration[]>([]); // TODO @belindamo: change this to card

  // Update overall conversation history, this is only done periodically to prevent rapid reloading
  const { 
    updateUserMessage, 
    updateModifiedMessage, 
    updateAIResponse, 
    clearMessageHistory 
  } = updateHistory;
  
  useEffect(() => {
    const newActiveCards = activeFileCards.filter((c) => {
      mentionedCards.forEach((e) => {
        if (e.front === c.front) return false;
      });
      return true;
    });
    setRemainingActiveCards(newActiveCards);
  }, [activeFileCards]);

  const handleFileAdd = (id: string) => {
    const mentionedFile = files.find(file => file.path === id);
    if (mentionedFile && !mentionedFiles.includes(mentionedFile)) {
      setMentionedFiles([...mentionedFiles, mentionedFile]);
    }
  };

  const handleCardAdd = (id: string) => {
    if (!activeFileCards) return;
    const mentionedCard = activeFileCards.find(card => card.front === id);
    if (mentionedCard && !mentionedCards?.includes(mentionedCard)) {
      setMentionedCards([...mentionedCards, mentionedCard]);
    }
  };

  const handleMentionsChange = (e: any, newValue: string) => {
    const fileRegex = /\[\[(.*?)\]\((.*?)\)/g;
    const cardRegex = /@\[([\s\S]*?)\]\(([\s\S]*?)\)/g;
    const newUserMessage = newValue.replace(cardRegex, '').replace(fileRegex, '');
    setUserMessage(newUserMessage);
  };

  const handleSendMessage = async (event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ('key' in event) { // Handle textarea
      if (!(event.key === 'Enter' && !event.shiftKey)) return;
      event.preventDefault(); // Prevents adding a newline to the textarea
    }
    if (!userMessage) return;
    
    clearMessageHistory(); // Clear message history from current index

    updateUserMessage(userMessage);


    let modifiedMessage = `----- USER MESSAGE -----\n\n${userMessage}`;
    const entriesToEdit = messageHistory[index-1]?.aiEntries;
    if (index !== 0 && entriesToEdit && entriesToEdit.length > 0) {
      modifiedMessage += `----- FLASHCARDS FOR YOU TO EDIT -----\n\n${entriesToEdit!.join('\n\n')}`
    }
    if (mentionedFiles.length > 0) {
      modifiedMessage += `\n\n----- REFERENCE FILES -----\n\n`
      for (const [index, file] of mentionedFiles.entries()) {
        const fileContent = await getFileContent(file, app.vault);
        modifiedMessage += `\n\n--REFERENCE #${index + 1}: [[${file.name}]]--\n\n${fileContent}`;
      }
    }

    if (mentionedCards.length > 0) {
      modifiedMessage += `\n\n--- REFERENCE CARDS ---\n\nUse these as context. They are existing flashcards in the user's deck.`
      for (const card of mentionedCards) {
        modifiedMessage += `\n\nfront:${card.front}\nback:${card.back}\n\n`
      }
    }

    updateModifiedMessage(modifiedMessage);

    // If currentMessage is not the last message, ie. user is overwriting a message that has already been sent, then we clean conversation history after this message
    setAIString(null);
    setAIEntries(null);
    setFocusedIndex(0);

    if (index < messageHistory.length - 1) {
      await aiManager.setNewThread(messageHistory.slice(0, index));
    } 

    const controller = new AbortController();
    setAbortController(controller);
    
    await aiManager.streamAIResponse(
      modifiedMessage,
      controller,
      setAIString,
      setAIEntries,
    );

    setAbortController(null);
    setFocusedIndex(0);

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
        // Adjust focus index
        if (!aiEntries[focusedIndex]) {
          if (aiEntries[focusedIndex - 1]) {
            setFocusedIndex(focusedIndex - 1);
          } else {
            setFocusedIndex(0);
          }
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
          placeholder={index === 0 ? 'Remember anything, @ or [[ to include your notes' : 'Ask a follow-up question'}
          onKeyDown={handleSendMessage}
          suggestionsPortalHost={portalRef.current}
        >
          <Mention
            trigger="[["
            data={files.map((file) => ({ id: file.path, display: file.path }))}
            onAdd={(id: string) => handleFileAdd(id)}
          />
          <Mention
            trigger="@"
            // TODO @belindamo: update this once there is a global cards array
            data={activeFileCards ? activeFileCards.map((card) => ({ id: card.front, display: card.front })) : []}            
            onAdd={(id: string) => handleCardAdd(id)}
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
          onClick={async () => {
            clearMessageHistory(true);
            if (index === 0) {
              setUserMessage(null);
              setAIEntries(null);
              setFocusedIndex(0);
              setAIString(null);
              setMentionedFiles([]);
              setAbortController(null);
            }
            await aiManager.setNewThread();
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
          <p>@ for Card</p>
        </div>
        <div 
          onClick={() => {
            setUserMessage((userMessage || '') + ' [[')
            inputRef.current?.focus();
          }} 
          className="cursor-pointer"
        >
          <p>{`[[`} for File</p>
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

      <div
        id="suggestionPortal"
        className="flex"
        ref={portalRef}
      ></div>

      {
        (mentionedFiles.length > 0 || mentionedCards.length > 0) && 
        <div className='m-4'>
          <p className='pb-2'>References:</p>
          <div className="flex-wrap">
            {mentionedFiles.map((file, index) => (
              <ChatTag 
                key={file.path} 
                name={`${file.path}`} 
                handleRemove={() => {
                  const newFiles = mentionedFiles.filter((_, i) => i !== index);
                  setMentionedFiles([...newFiles]);
                }} 
              />
            ))}
            {mentionedCards.map((card, index) => (
              <ChatTag 
                key={`${card.front}-${index}`} 
                name={`${card.front}`} 
                handleRemove={() => {
                  const newCards = mentionedCards.filter((_, i) => i !== index);
                  setMentionedCards([...newCards]);
                }} 
              />
            ))}
          </div>
        </div>
      }

      {(index === 0 && !aiString && activeFile) && (
      <div className='m-4'>
        <div className='mb-2'> 
          Add references from the current file:
        </div>
        <div>
          <ChatTag
            name={activeFile.path}
            handleClick={() => handleFileAdd(activeFile.path)}
          />
          {remainingActiveCards.map((c, i) => (
            <ChatTag 
              key={`active-${c.front}-${i}`}
              name={c.front}
              handleClick={() => {
                if (!mentionedCards.includes(c)) {
                  setMentionedCards([c, ...mentionedCards]);
                }
                const remaining = remainingActiveCards.filter((_, i) => i !== index);
                setRemainingActiveCards(remaining);
              }} 
            />
          ))}
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
            handleFocus={() => {
              setFocusedIndex(i);
            }}
            focused={i === focusedIndex}
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