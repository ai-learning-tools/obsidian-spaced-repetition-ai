import MemoryManager from "@/memory/memoryManager";
import { Card, RecordLog, RecordLogItem, ReviewLog, State } from "./models";
import { Vault } from "obsidian";
import { DIRECTORY } from "@/constants";
import { fixDate } from "./help";
import { fsrs, FSRS } from "./fsrs";


export class Deck {
    cards: Card[];
    scheduler: FSRS
    memoryManager: MemoryManager //TODO: Athena - make memory manager a singleton

    constructor(
        cards: Card[],
        memoryManager: MemoryManager
    ) {
     // create shallow copy +sort card 
        this.cards = [...cards];
        this.memoryManager = memoryManager
        this.sortCards();
        this.scheduler = new FSRS({
            enable_short_term: true
        })
    }

    // This should be called everytime the deck is updated
    sortCards() {
        this.cards.sort((a, b) => fixDate(a.due).getTime() - fixDate(b.due).getTime());
        console.log('ATHENA-DEBUG', 'sorted cards', this.cards.map(card => card.id))

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

    // Find card with the same id, and copy the fields over
    // We don't overwrite the card since these cards are also used in other decks
    async updateCard(recordLog: RecordLogItem, updateMemory = true) {
        const index = this.cards.findIndex(c => c.id === recordLog.card.id);
        if (index == -1 ) {
            console.error("trying to update a card that doesn't exists ind deck")
        }
        
        console.log('ATHENA-DEBUG', 'new card', recordLog.card)
        const card = Object.assign(this.cards[index], recordLog.card);

        if (updateMemory) {
            console.log("ATHENA-DEBUG", 'updating card')
            await this.memoryManager.updateCard(card)
            await this.memoryManager.insertReviewLog(recordLog.log, card.id)
        }

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
        // Update SR with new cards and card details
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
         this.decks = [new Deck(allCards, this.memoryManager)]
    }
}