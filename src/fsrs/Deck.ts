import MemoryManager from "@/memory/memoryManager";
import { Card, State } from "./models";
import { Vault } from "obsidian";
import { DIRECTORY } from "@/constants";
import { fixDate } from "./help";


export class Deck {
    cards: Card[];

    constructor(
        cards: Card[]
    ) {
     // create shallow copy +sort card 
        this.cards = [...cards];
        this.sortCards();
    }

    sortCards() {
        this.cards.sort((a, b) => fixDate(a.due).getTime() - fixDate(b.due).getTime());
    }

    getCountForStates(): { [key in State]: number } {
        const stateCounts = this.cards.reduce((counts, card) => {
            counts[card.state] = (counts[card.state] || 0) + 1;
            return counts;
        }, {} as { [key in State]: number });

        return stateCounts;
    }
}

export class DeckManager {
    decks: Deck[]
    memoryManager: MemoryManager
    vault: Vault

    constructor(
        memoryManager: MemoryManager,
        vault: Vault
    ) {
        this.memoryManager = memoryManager
        this.vault = vault
    }

    async syncCardsWithNotes() {
        console.log('not implemented')
    }

    async populateDecks() {
        const directory = `${DIRECTORY}/memory`
        const files = this.vault.getFiles().filter(file => file.path.startsWith(directory) && file.extension === 'json');
        
        const allCards: Card[] = [];
        for (const file of files) {
            const memory = await this.memoryManager.readMemoryFromPath(file.path);
            allCards.push(memory.card);
        }

        console.log('ATHENA-DEBUG', 'DECK', allCards)
        // TODO: Athena - make deck changes here, for now we assume all cards are in one deck
         this.decks = [new Deck(allCards)]
    }
}