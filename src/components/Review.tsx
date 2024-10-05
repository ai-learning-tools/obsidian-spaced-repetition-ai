import React, { useState, useEffect } from 'react';
import { DeckManager, Deck } from '@/fsrs/Deck';
import { DeckMetaData, State } from '@/fsrs';
import DeckDisplay from '@/components/review/DeckDisplay';
import NewDeckModal from '@/components/review/NewDeckModal';
import ModifyDeckModal from '@/components/review/ModifyDeckModal';
import SRPlugin from '@/main';

interface ReviewProps {
  plugin: SRPlugin;
}

const Review: React.FC<ReviewProps> = ({ plugin }) => {
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);

  const deckManager = plugin.deckManager;
  const memoryManager = plugin.memoryManager;

  useEffect(() => {
    const initializeDecks = async () => {
      await deckManager.syncMemoryWithNotes();
      await deckManager.populateDecks();
      setDecks(deckManager.decks);
    };

    initializeDecks();
  }, [deckManager]);

  const refresh = async () => {
    setIsSyncing(true);
    await deckManager.syncMemoryWithNotes();
    await deckManager.populateDecks();
    setDecks(deckManager.decks);
    setIsSyncing(false);
  };

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
      <div className='flex flex-col bg-white border border-gray-300 w-full px-10 py-6 rounded-md'>
        <div className='grid grid-cols-6 gap-4 mb-4 font-semibold text-lg px-2'>
          <p className="col-span-2">Deck</p>
          <div className="text-center">New</div>
          <div className="text-center">Learn</div>
          <div className="text-center">Due</div>
          <div></div>
        </div>
        {decks.map((deck, index) => {
          const count = deck.getCountForStates();
          const due = deck.getDue();
          const isLastDeck = index === decks.length - 1;

          return (
            <div key={deck.metaData.name} className='grid grid-cols-6 gap-4 bg-gray-100 rounded-lg p-2 mb-2'>
              <p className="col-span-2 hover:underline" onClick={() => setSelectedDeck(deck)}>
                {deck.metaData.name}
              </p>
              <p className="text-center">{count[State.New]}</p>
              <p className="text-center">{count[State.Learning] + count[State.Relearning]}</p>
              <p className="text-center">{due.length}</p>
              {!isLastDeck && <button onClick={() => modifyDeck(deck)}>Modify</button>}
              {isLastDeck && <div />}
            </div>
          );
        })}
        <div className="flex justify-end w-full pt-4 space-x-2">
          {isSyncing && <div className="spinner ml-2">Syncing</div>}
          <button className="p-2 flex items-center" onClick={refresh}>refresh</button>
          <button className="p-2" onClick={addDeck}>Add deck</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {selectedDeck ? (
        <div>
          <button className="bg-indigo-400 m-2 p-2" onClick={() => setSelectedDeck(null)}>Back to Decks</button>
          <DeckDisplay className="flex w-full h-full flex-col justify-center" deck={selectedDeck} />
        </div>
      ) : (
        decks.length ? renderDeckSelection() : (
          <div className="flex justify-center items-center h-full my-2">
            <div>Add some cards man ♠️</div>
          </div>
        )
      )}
    </div>
  );
};

export default Review;