import React, { useState, useEffect } from 'react';
import { Deck } from '@/fsrs/Deck';
import { State, Card, Rating, Grade, RecordLogItem } from '@/fsrs';
import CardReview from '@/components/CardReview'

interface DeckDisplayProps {
    deck: Deck;
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ deck }: DeckDisplayProps) => {
    const [stateCounts, setStateCounts] = useState(deck.getCountForStates());
    const [topCard, setTopCard] = useState<Card>(deck.cards[0]);

    useEffect(() => {
        setStateCounts(deck.getCountForStates());
    }, [deck.cards]);

    const onCardReview = async (cardId: number, rating: Rating) => {
        console.log('ATHENA-DEBUG', 'reviewing cards', cardId, rating)
        const record: RecordLogItem = Deck.scheduleNext(topCard, rating as Grade)
        await deck.updateCard(record)
        deck.sortCards()
        setTopCard(deck.cards[0])
        setStateCounts(deck.getCountForStates());
    }

    return (
        <div className="flex flex-col justify-center">
            <div className="flex flex-row space-x-3 justify-center">
                {Object.entries(stateCounts).map(([state, count]) => (
                    <div className="flex flex-col text-center" key={state}>
                        <p>{State[state as keyof typeof State]}</p>
                        <p>{count as number}</p>
                    </div>
                ))}
            </div>
            <CardReview card={topCard} onReview={onCardReview} />
        </div>
    );
}

export default DeckDisplay