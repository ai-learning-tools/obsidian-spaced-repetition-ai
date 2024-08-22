import React, { useState } from 'react';
import { Deck } from '@/fsrs/Deck';
import { State, Card, Rating } from '@/fsrs';
import CardReview from '@/components/CardReview'

interface DeckDisplayProps {
    deck: Deck;
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ deck }: DeckDisplayProps) => {
    const stateCounts = deck.getCountForStates();
    const [topCard, setTopCard] = useState<Card>(deck.cards[0]);

    React.useEffect(() => {
        // Add any side effects or cleanup here if needed
        console.log("ATHENA-DEBUG", 'count', deck.getCountForStates())
        setTopCard(deck.cards[0])
    }, [deck.cards]);

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
            <CardReview card={topCard} onReview={(cardId: number, rating: Rating) => {}} />
        </div>
    );
}

export default DeckDisplay