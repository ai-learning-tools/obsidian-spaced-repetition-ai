import MemoryManager from "@/memory/memoryManager";
import { Card, State } from "./models";
import { Vault } from "obsidian";
import { DIRECTORY } from "@/constants";
import { fixDate } from "./help";
import { fsrs, FSRS } from "./fsrs";


export class Deck {
    cards: Card[];

    constructor(
        cards: Card[]
    ) {
     // create shallow copy +sort card 
        this.cards = [...cards];
        this.sortCards();
    }

    // This should be called everytime the deck is updated
    sortCards() {
        this.cards.sort((a, b) => fixDate(a.due).getTime() - fixDate(b.due).getTime());
    }

    getCountForStates(): { [key in State]: number } {
        const count: { [key in State]: number } = {
            [State.New]: 0,
            [State.Learning]: 0,
            [State.Review]: 0,
            [State.Relearning]: 0,
        };

        for (const card of this.cards) {
            count[card.state]++;
        }

        return count;
    }
}

export class DeckManager {
    decks: Deck[]
    memoryManager: MemoryManager
    vault: Vault
    scheduler: FSRS

    constructor(
        memoryManager: MemoryManager,
        vault: Vault
    ) {
        this.memoryManager = memoryManager
        this.vault = vault
        this.scheduler = 
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