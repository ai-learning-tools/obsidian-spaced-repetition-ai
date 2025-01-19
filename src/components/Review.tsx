import React, { useState, useEffect, useRef } from 'react';
import { Deck } from '@/fsrs/Deck';
import { DeckMetaData, State } from '@/fsrs';
import DeckDisplay from '@/components/review/DeckDisplay';
import NewDeckModal from '@/components/review/NewDeckModal';
import ModifyDeckModal from '@/components/review/ModifyDeckModal';
import SRPlugin from '@/main';
import { setIcon, Notice } from 'obsidian';

interface ReviewProps {
  plugin: SRPlugin;
}

const Review: React.FC<ReviewProps> = ({ plugin }) => {
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isNarrow, setIsNarrow] = useState(false);
  const observerRef = useRef<ResizeObserver| null>(null);
  const loadPromiseRef = useRef<Promise<void>>();
  const syncPromiseRef = useRef<{
    promise: Promise<void>;
    pendingDeck: Deck | null;
  } | null>(null);

  const { deckManager, memoryManager } = plugin;

  const refCallback = (node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null
    }

    if (node) {
      // Create ResizeObserver when the node is attached
      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect?.width || 0;
        setIsNarrow(width < 400);
      });

      observer.observe(node);
      observerRef.current = observer
    }
  };

  useEffect(() => {
    // Cleanup any observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const loadDecks = async () => {
      if (!loadPromiseRef.current) {
        loadPromiseRef.current = (async () => {
          console.log("DEBUG-ATHENA loading deck")
          try {
            setIsSyncing(true);
            
            // First populate with existing cards
            await deckManager.populateDecks();
            setDecks(deckManager.decks);
    
            // Then do full sync
            await deckManager.syncMemoryWithNotes();
            await deckManager.populateDecks();
            setDecks(deckManager.decks);
          } catch (error) {
            console.error('Error loading decks:', error);
          } finally {
            setIsSyncing(false);
            loadPromiseRef.current = undefined;
          }
        })();
      }
      return loadPromiseRef.current;
    };
  
    loadDecks();
  }, [deckManager]); // Only depends on deckManager now


  const refresh = async (currDeck: Deck | null = null) => {
    if (!isSyncing) {
      try {
        setIsSyncing(true);
        
        // Create sync promise with pendingDeck
        syncPromiseRef.current = {
          promise: (async () => {
            await deckManager.syncMemoryWithNotes();
            await deckManager.populateDecks();
            
            // Use either the pending deck or selectedDeck
            const deckToUpdate = syncPromiseRef.current?.pendingDeck || selectedDeck;
            console.log("updating deck", deckToUpdate)
            if (deckToUpdate) {
              const updatedDeck = deckManager.decks.find(
                (deck: Deck) => deck.metaData.name === deckToUpdate.metaData.name
              );
              if (updatedDeck) {
                setSelectedDeck(new Deck(
                  [...updatedDeck.cards],
                  {...updatedDeck.metaData},
                  updatedDeck.memoryManager
                ));
              }
            }
            
            setDecks([...deckManager.decks]);
          })(),
          pendingDeck: currDeck
        };
        
        await syncPromiseRef.current.promise;
        
      } catch (error) {
        console.error('Error refreshing decks:', error);
      } finally {
        setIsSyncing(false);
        syncPromiseRef.current = null;
      }
    } else if (currDeck) {
      // Update pendingDeck if there's an ongoing sync
      if (syncPromiseRef.current) {
        syncPromiseRef.current.pendingDeck = currDeck;
      }
    }
  };

  const addDeck = () => {
    const onDeckSubmit = async (metaData: DeckMetaData) => {
      await memoryManager.addDeck(metaData);
      await refresh();
    };
    new NewDeckModal(plugin.app, onDeckSubmit).open();
  };

  const modifyDeck = (deck: Deck) => {
    const onDeckModify = async (name: string) => {
      await memoryManager.renameDeck(deck.metaData.name, name);
      deck.metaData.name = name;
      setDecks([...deckManager.decks]); // Update the decks state to trigger re-render
    };
    new ModifyDeckModal(plugin.app, deck.metaData, onDeckModify).open();
  };

  const renderDeckSelection = () => (
    <div className='flex flex-col' ref={refCallback}>
      <div className='flex flex-col bg-white border border-gray-300 w-full px-10 py-6 rounded-md'>
        <div className={`grid ${isNarrow ? 'grid-cols-5' : 'grid-cols-7'} gap-4 mb-4 px-4 font-semibold text-lg`}>
          <p className="col-span-2">Deck</p>
          {!isNarrow && <div className="text-center">New</div>}
          {!isNarrow && <div className="text-center">Learn</div>}
          <div className="text-center">Total</div>
          <div className="text-center">Due</div>
          <div></div>
        </div>
        {decks.map((deck, index) => {
          const count = deck.getCountForStates();
          const due = deck.getDue();
          const isLastDeck = index === decks.length - 1;

          return (
            <div 
              key={deck.metaData.name} 
              className={`grid ${isNarrow ? 'grid-cols-5' : 'grid-cols-7'} gap-4 bg-gray-100 rounded-lg py-2 px-6 mb-2 h-10 items-center cursor-pointer`}
              onClick={async() => { 
                if (deck.cards.length > 0) { 
                  setSelectedDeck(deck);
                  await refresh(deck); 
                } else {
                  new Notice(`There are no cards detected in ${deck.metaData.name}. Add some cards to path ${deck.metaData.rootPath} or modify its settings`);
                }
              }}
            >
              <p className="col-span-2 hover:underline flex items-center truncate">
                {deck.metaData.name}
              </p>
              {!isNarrow && <p className="text-center flex items-center justify-center">{count[State.New]}</p>}
              {!isNarrow && <p className="text-center flex items-center justify-center">{count[State.Learning] + count[State.Relearning]}</p>}
              <p className="text-center flex items-center justify-center">{deck.cards.length}</p>
              <p className="text-center flex items-center justify-center font-bold">{due.length}</p>
              {!isLastDeck && (
                <div className="flex items-center justify-end cursor-pointer h-4 w-4 ml-auto" onClick={(e) => { e.stopPropagation(); modifyDeck(deck); }}>
                  <span ref={el => el && setIcon(el, 'pen')} className="text-neutral-400"></span>
                </div>
              )}
              {isLastDeck && <div className="flex items-center justify-center" />}
            </div>
          );
        })}
        <div className="flex justify-end w-full pt-4 space-x-2 items-center">
          {isSyncing && <div className="spinner ml-2">Syncing</div>}
          <div className={`p-2 flex items-center cursor-pointer ${isSyncing ? 'animate-spin' : ''}`} onClick={() => refresh()}>
            <span ref={el => el && setIcon(el, 'refresh-ccw')}></span>
          </div>
          <button className="p-2" onClick={() => addDeck()}>
            <span ref={el => el && setIcon(el, 'list-plus')}></span>
            <p> Add deck </p>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {selectedDeck ? (
        <div>
          <div className="m-2 p-2 flex items-center" 
            onClick={async() => {setSelectedDeck(null)}}
          >
            <span ref={el => el && setIcon(el, 'arrow-left')}></span>
            Decks
          </div>
          <DeckDisplay className="flex w-full h-full flex-col justify-center" deck={selectedDeck} />
        </div>
      ) : 
      (
        decks.length ? renderDeckSelection() : (
          <div className="flex justify-center items-center h-full my-2">
            <div>Add some cards man ♠️</div>
          </div>
        )
      )
      }
    </div>
  );
};

export default Review;