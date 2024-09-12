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
import Entry from '@/components/chat/Entry';
import ChatTag from '@/components/chat/ChatTag';
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
  const [cardsToEdit, setCardsToEdit] = useState<EntryItemGeneration[]>([]); // TODO @belindamo: update this once there is a Card class. Card ids in this component also need to be updated to card.id rather than card.front for robustness

  const [remainingActiveCards, setRemainingActiveCards] = useState<EntryItemGeneration[]>(activeFileCards);

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
    let cards = activeFileCards;
    if (cardsToEdit.length > 0) {
      cards = activeFileCards.filter((c) => {
        cardsToEdit.forEach((e) => {
          if (e.front === c.front) return true;
        });
        return false;
      });
    }
    setRemainingActiveCards(cards);
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
    const cardRegex = /@\[(.*?)\]\((.*?)\)/g;
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

    let modifiedMessage = userMessage;
    modifiedMessage += `\n\n--- REFERENCE FILES ---\n\n`
    for (const file of mentionedFiles) {
      const fileContent = await getFileContent(file, app.vault);
      modifiedMessage += `\n\n[[${file.name}]]: \n${fileContent}`;
    }

    modifiedMessage += `\n\n--- REFERENCE CARDS ---\n\nUse these as context but avoid repeating content.`
    for (const card of mentionedCards) {
      modifiedMessage += `\n\nfront:${card.front}\nback:${card.back}\n\n`
    }

    updateModifiedMessage(modifiedMessage);

    // If currentMessage is not the last message, ie. user is overwriting a message that has already been sent, then we clean conversation history after this message
    setAIString(null);
    setAIEntries(null);
    setFocusedIndex(0);

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
          placeholder={index === 0 ? 'Remember anything, @ or [[ to include your notes' : 'Follow-up with questions or edits'}
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
          onClick={() => {
            clearMessageHistory(true);
            if (index === 0) {
              setUserMessage(null);
              setAIEntries(null);
              setFocusedIndex(0);
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
                name={`${card.front} Card`} 
                handleRemove={() => {
                  const newCards = mentionedCards.filter((_, i) => i !== index);
                  setMentionedCards([...newCards]);
                }} 
              />
            ))}
          </div>
        </div>
      }

      {(!aiString && activeFile && Array.isArray(remainingActiveCards) && remainingActiveCards.length > 0) && (
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
              name={`${c.front}, ${c.back}`}
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

      {!aiString && cardsToEdit.length > 0 && (
      <div className='m-4'>
        <p>These cards from the previous message will be edited:</p>
        <div>
          {cardsToEdit.map((c, i) => (
            <ChatTag key={`active-card-${i}`} name={`${c.front}, ${c.back}`} />
          ))}
        </div>
      </div>
      )}
   
      <div className='m-4'>
        {aiString && (
          <div className='pb-4'>
            {aiString}
          </div>
        )}
        {aiEntries?.map((entry, i) => (
          <Entry 
            handleFeedback={async (feedback: 'y' | 'n') => {
              await handleCardFeedback(feedback, entry, i);
            }}
            handleFocus={() => {
              setFocusedIndex(i);
            }}
            focused={i === focusedIndex}
            front={entry.front} 
            back={entry.back} 
            key={`entry-${i}-length-${aiEntries.length}`}
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