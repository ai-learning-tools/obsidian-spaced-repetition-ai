import React, { useState, useEffect, useRef } from 'react';
import { Deck } from '@/fsrs/Deck';
import { State, Card, Rating, Grade, RecordLogItem } from '@/fsrs';
import CardView from '@/components/CardView';
import SRPlugin from '@/main';
import { TFile } from 'obsidian';

interface DeckDisplayProps {
  deck: Deck;
  plugin: SRPlugin;
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ deck, plugin }: DeckDisplayProps) => {
  const [stateCounts, setStateCounts] = useState(deck.getCountForStates());
  const [topCard, setTopCard] = useState<Card>(deck.cards[0]);

  useEffect(() => {
    setStateCounts(deck.getCountForStates());
  }, [deck.cards]);

  const onTopCardReview = async (rating: Rating) => {
    const record: RecordLogItem = Deck.scheduleNext(topCard, rating as Grade)
    await deck.updateCard(record)
    deck.sortCards()
    setTopCard(deck.cards[0])
    setStateCounts(deck.getCountForStates());
  }

  return (
    <div className="flex flex-col justify-center space-y-5">
      <div className="flex flex-row space-x-3 justify-center">
        {Object.entries(stateCounts).map(([state, count]) => (
          <div className="flex flex-col text-center" key={state}>
            <p>{State[state as keyof typeof State]}</p>
            <p>{count as number}</p>
          </div>
        ))}
      </div>

      <CardReview plugin={plugin} card={topCard} onReview={onTopCardReview} />
    </div>
  );
}

interface CardReviewProps {
  plugin: SRPlugin;
  card: Card;
  onReview: (rating: Rating) => Promise<void>;
}

const CardReview: React.FC<CardReviewProps> = ({ plugin, card, onReview }: CardReviewProps) => {
  const [showBack, setShowBack] = useState(false);
  const cardReviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardReviewRef.current?.focus();
  }, []);

  const handleReview = async (rating: Rating) => {
    setShowBack(false)
    await onReview(rating);
  };

  
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!showBack && (event.key === 'Enter' || event.key === ' ')) {
				setShowBack(true);
			} else if (showBack) {
				switch (event.key) {
					case '1':
						handleReview(1);
						break;
					case '2':
						handleReview(2);
						break;
					case '3':
						handleReview(3);
						break;
					case '4':
						handleReview(4);
						break;
					default:
						break;
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [showBack]);

  return (
    <div ref={cardReviewRef} className="h-full w-full flex-col flex space-y-5 items-center" tabIndex={0}>
      <div 
        className="text-sm mb-2 cursor-pointer text-center hover:underline"
        onClick={() => plugin.app.workspace.openLinkText(card.path, '', true)}
      >
        {card.path}
      </div>
      <CardView plugin={plugin} front={card.front} back={card.back} showBack={showBack} path={card.path}></CardView>
      {
        showBack &&
        <div className="flex space-x-4">
          <button className='p-2' onClick={() => handleReview(1)}>Again</button>
          <button className='p-2' onClick={() => handleReview(2)}>Hard</button>
          <button className='p-2' onClick={() => handleReview(3)}>Good</button>
          <button className='p-2' onClick={() => handleReview(4)}>Easy</button>
        </div>
      }
      {
        !showBack &&
        <button className='p-2' onClick={() => setShowBack(true)}>Show Answer</button>
      }
    </div>
  );
};

export default DeckDisplay;