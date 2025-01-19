import React, { useState, useEffect, useRef } from 'react';
import { Deck } from '@/fsrs/Deck';
import { DeckMetaData, State } from '@/fsrs';
import DeckDisplay from '@/components/review/DeckDisplay';
import NewDeckModal from '@/components/review/NewDeckModal';
import ModifyDeckModal from '@/components/review/ModifyDeckModal';
import SRPlugin from '@/main';
import { setIcon, Notice } from 'obsidian';
import ImportView from '@/components/onboarding/OnboardingViews';
import { OnboardingStatus } from '@/constants';
import DotsMenu from '@/components/onboarding/DotsMenu';

interface ReviewProps {
  plugin: SRPlugin;
}

const Review: React.FC<ReviewProps> = ({ plugin }: ReviewProps) => {
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { deckManager, memoryManager, settings } = plugin;
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(settings.onboardingStatus);

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
          console.log("DEBUG-ATHENA loading deck", isInitialLoad)
          try {
            setIsSyncing(true);
            
            // First populate with existing cards
            await deckManager.populateDecks();
            setDecks(deckManager.decks);
            setIsInitialLoad(false); //initial load is set to false when deck is first populated

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
  
    if (onboardingStatus == OnboardingStatus.Done) {
      loadDecks();
    }
  }, [deckManager, isInitialLoad, onboardingStatus]); // Only depends on deckManager now


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

  // useEffect(() => {
  //   if (!isSyncing && onboardingStatus == OnboardingStatus.Done) {
  //     refresh();
  //   }
  // }, [deckManager]); //TODO: check with bmo

  const updateOnboardingStatus = (status: OnboardingStatus) => {
    setOnboardingStatus(status);
    // if (status == OnboardingStatus.Done) {
    //   refresh();
    // }
    settings.onboardingStatus = status;
    plugin.saveSettings();
  }

  const addDeck = () => {
    const onDeckSubmit = async (metaData: DeckMetaData) => {
      try {
        await memoryManager.addDeck(metaData);
        setDecks([...deckManager.decks]);
        await refresh();
        setDecks([...deckManager.decks]);
      } catch (error) {
        new Notice(`${error.message}`);
      }
    };
    new NewDeckModal(plugin.app, onDeckSubmit).open();
  };

  const modifyDeck = (deck: Deck) => {
    const onDeckModify = async (name: string) => {
      await memoryManager.renameDeck(deck.metaData.name, name);
      deck.metaData.name = name;
      setDecks([...deckManager.decks]); // Update the decks state to trigger re-render
    };
    const onDeckDelete = async () => {
      console.log('deleting deck...');
      const updatedDecks = deckManager.decks.filter((d: Deck) => d.metaData.name !== deck.metaData.name);
      setDecks(updatedDecks);
      await memoryManager.deleteDeck(deck.metaData);
    }
    new ModifyDeckModal(plugin.app, deck.metaData, onDeckModify, onDeckDelete).open();
  };

  const renderDeckSelection = () => (
    <>
    <div className='flex flex-col' ref={refCallback}></div>
    <div className='flex flex-col theme-bg-surface theme-border border w-full px-10 py-6 rounded-md'>
        <div className={`grid ${isNarrow ? 'grid-cols-5' : 'grid-cols-7'} gap-4 mb-4 px-4 font-semibold text-lg theme-text`}>
          <p className="col-span-2">Deck</p>
          {!isNarrow && <div className="text-center">New</div>}
          {!isNarrow && <div className="text-center">Learn</div>}
          <div className="text-center">Total</div>
          <div className="text-center">Due</div>
          <div></div>
        </div>
        <div className="h-[1px] theme-divider mx-6"></div>
        <div className="mt-4">
          {decks.map((deck, index) => {
            const count = deck.getCountForStates();
            const due = deck.getDue();
            const isLastDeck = index === decks.length - 1;

          return (
            <div 
              key={deck.metaData.name} 
              className={`grid ${isNarrow ? 'grid-cols-5' : 'grid-cols-7'} gap-4 theme-bg-surface rounded-lg py-2 px-6 mb-2 h-10 items-center cursor-pointer theme-bg-active-hover group`}
              onClick={async() => { 
                if (deck.cards.length > 0) { 
                  setSelectedDeck(deck);
                  await refresh(deck); 
                } else {
                  new Notice(`There are no cards detected in ${deck.metaData.name}. Add some cards to path ${deck.metaData.rootPath} or modify its settings`);
                }
              }}
            >
              <p className="col-span-2 hover:underline flex items-center theme-text truncate">
                {deck.metaData.name}
              </p>
              {!isNarrow && <p className="text-center flex items-center theme-text justify-center">{count[State.New]}</p>}
              {!isNarrow && <p className="text-center flex items-center theme-text justify-center">{count[State.Learning] + count[State.Relearning]}</p>}
              <p className="text-center flex items-center theme-text justify-center">{deck.cards.length}</p>
              <p className="text-center flex items-center theme-text justify-center font-bold">{due.length}</p>
              {!isLastDeck && (
                <div className="flex items-center justify-end cursor-pointer h-4 w-4 ml-auto opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); modifyDeck(deck); }}>
                  <span ref={el => el && setIcon(el, 'pen')} className="theme-text-faint p-2 -m-2"></span>
                </div>
              )}
              {isLastDeck && <div className="flex items-center justify-center" />}
            </div>
          );
        })}
        <div className="flex justify-end w-full pt-4 space-x-2 items-center">
          {isSyncing && <div className="spinner ml-2">Syncing</div>}
          <div className={`p-2 flex items-center cursor-pointer`} onClick={() => refresh()}>
            <span ref={el => el && setIcon(el, 'refresh-ccw')}></span>
          </div>
          <button className="p-2 theme-text theme-bg-hover rounded flex items-center space-x-2" onClick={() => addDeck()}>
            <span ref={el => el && setIcon(el, 'list-plus')}></span>
            <p>Add deck</p>
          </button>
          <DotsMenu />
        </div>
      </div>
    </div>
    </>
  );

  function renderContent() {
    if (onboardingStatus === OnboardingStatus.Import) {
      return  (
        <ImportView 
        settings={settings}
        updateOnboardingStatus={updateOnboardingStatus}
        />
      )
    } else if (isInitialLoad) {
      return (
      <div className="flex justify-center"><p className="mt-2">Loading decks, please wait...</p></div>
      )
    } else if (selectedDeck) {
      return (
        <div>
          <div
            className="m-2 p-2 inline-flex items-center theme-text cursor-pointer theme-bg-hover rounded"
            onClick={async () => {
              setSelectedDeck(null);
            }}
          >
            <span ref={(el) => el && setIcon(el, "arrow-left")}></span>
            Decks
          </div>
          <DeckDisplay
            className="flex w-full h-full flex-col justify-center" deck={selectedDeck} plugin={plugin}
          />
        </div>
      )
    } else if (decks.length > 0) {
      return renderDeckSelection()
    } else {
      return (
        <div className="flex justify-center items-center h-full my-2">
        <div className="flex justify-center"><p className="mt-2">No cards detected. Need help getting started?</p></div>
        </div>
        )
    }
  }   

  return (
    <div>
      {renderContent()}
    </div>
  );
}

export default Review;