// TODO @review

import { Deck } from "./Deck";
import { Card } from "./Card";

export class DeckIterator {
    private baseDeck: Deck;
    private currentDeck: Deck;
    private currentCard: Card | null;
    private reviewHistory: Card[];

    constructor(baseDeck: Deck) {
        this.baseDeck = baseDeck;
        this.currentDeck = baseDeck;
        this.currentCard = null;
        this.reviewHistory = [];
    }

    reviewCurrentCard(): void {
    }

    deleteCard(): void {
    }

    updateCardSchedule(rating: string): void {
    }

    previousCard(): Card | null {
        return null;
    }

    nextCard(): Card | null {
        return null;
    }

    setCurrentDeck(deck: Deck): void {
    }

    getCurrentCard(): Card | null {
        return null;
    }
}
