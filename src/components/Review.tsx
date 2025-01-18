import { useState, useEffect } from 'react';
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
  const PLACEHOLDER_DECK: Deck = new Deck([], { "name": "All Cards", "rootPath": " "}, plugin.memoryManager);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([PLACEHOLDER_DECK]);

  const { deckManager, memoryManager, settings } = plugin;

  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(settings.onboardingStatus);

  const refresh = async () => {
    setIsSyncing(true);
    await deckManager.syncMemoryWithNotes();
    await deckManager.populateDecks();
    setDecks(deckManager.decks);
    setIsSyncing(false);
  };

  useEffect(() => {
    if (!isSyncing && onboardingStatus == OnboardingStatus.Done) {
      refresh();
    }
  }, [deckManager]);

  const updateOnboardingStatus = (status: OnboardingStatus) => {
    setOnboardingStatus(status);
    if (status == OnboardingStatus.Done) {
      refresh();
    }
    settings.onboardingStatus = status;
    plugin.saveSettings();
  }

  const addDeck = () => {
    const onDeckSubmit = async (metaData: DeckMetaData) => {
      await memoryManager.addDeck(metaData);
      await refresh();
    };
    new NewDeckModal(plugin.app, onDeckSubmit).open();
  };

  const modifyDeck = (deck: Deck) => {
    const onDeckModify = async (metaData: DeckMetaData) => {
      await memoryManager.deleteDeck(deck.metaData);
      await memoryManager.addDeck(metaData);
      await refresh();
    };
    new ModifyDeckModal(plugin.app, deck.metaData, onDeckModify).open();
  };

  const renderDeckSelection = () => (
    <div className='flex flex-col'>
      <div className='flex flex-col theme-bg-surface theme-border border w-full px-4 py-6 rounded-md'>
        <div className='grid grid-cols-6 gap-4 mb-4 px-6 font-semibold text-lg theme-text'>
          <p className="col-span-2">Deck</p>
          <div className="text-center">New</div>
          <div className="text-center">Learn</div>
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
                className='grid grid-cols-6 gap-4 theme-bg-surface rounded-lg py-2 px-6 mb-2 h-10 items-center cursor-pointer theme-bg-active-hover group'
                onClick={async() => { 
                  if (deck.cards.length > 0) { 
                    setSelectedDeck(deck);
                  } else {
                    new Notice(`There are no cards detected in ${deck.metaData.name}. Add some cards to path ${deck.metaData.rootPath} or modify its settings`);
                  }
                }}
              >
                <p className="col-span-2 hover:underline flex items-center theme-text">
                  {deck.metaData.name}
                </p>
                <p className="text-center flex items-center justify-center theme-text">{count[State.New]}</p>
                <p className="text-center flex items-center justify-center theme-text">{count[State.Learning] + count[State.Relearning]}</p>
                <p className="text-center flex items-center justify-center font-bold theme-text">{due.length}</p>
                {!isLastDeck && (
                  <div className="flex items-center justify-end cursor-pointer h-4 w-4 ml-auto opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); modifyDeck(deck); }}>
                    <span ref={el => el && setIcon(el, 'pen')} className="theme-text-faint p-2 -m-2"></span>
                  </div>
                )}
                {isLastDeck && <div className="flex items-center justify-center" />}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end w-full pt-4 space-x-2 items-center">
          {isSyncing && <div className="spinner ml-2 theme-text">Syncing</div>}
          <div className={`p-2 flex items-center cursor-pointer theme-text ${isSyncing ? 'animate-spin' : ''}`} onClick={() => refresh()}>
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
  );

  return (
    <div>
      {onboardingStatus === OnboardingStatus.Import ? (
        <ImportView 
          settings={settings}
          updateOnboardingStatus={updateOnboardingStatus}
        />
      ) : selectedDeck ? (
        <div>
          <div className="m-2 p-2 inline-flex items-center theme-text cursor-pointer theme-bg-hover rounded" 
            onClick={async() => {
              setSelectedDeck(null); 
          }}
          >
            <span ref={el => el && setIcon(el, 'arrow-left')}></span>
            Decks
          </div>
          <DeckDisplay className="flex w-full h-full flex-col justify-center" deck={selectedDeck} plugin={plugin} />
        </div>
      ) : (
        renderDeckSelection()
      )}
    </div>
  );
};

export default Review;