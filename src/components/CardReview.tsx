import React from 'react';
import { Card, Rating } from '@/fsrs/models';

interface CardReviewProps {
    card: Card;
    onReview: (cardId: number, rating: Rating) => Promise<void>;
}

const CardReview: React.FC<CardReviewProps> = ({ card, onReview }: CardReviewProps) => {
    const handleReview = async (rating: Rating) => {
        await onReview(card.id, rating);
    };

    return (
        <div className="bg-gray-100 h-64 w-96 flex-col flex space-y-5">
            <p>{card.id}</p>
            <p>{`State ${card.state}`}</p>
            <p>{`Reps ${card.reps}`}</p>
            <div className="text-black">
                <p>{card.question}</p>
            </div>
            <div className="text-black" id="answer">
                <p>{card.answer}</p>
            </div>
            <div>
                <button className='p-2' onClick={() => handleReview(1)}>Again</button>
                <button className='p-2' onClick={() => handleReview(2)}>Hard</button>
                <button className='p-2' onClick={() => handleReview(3)}>Good</button>
                <button className='p-2' onClick={() => handleReview(4)}>Easy</button>
            </div>
        </div>
    );
};

export default CardReview;
