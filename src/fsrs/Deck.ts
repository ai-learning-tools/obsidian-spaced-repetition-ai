import MemoryManager from "@/memory/memoryManager";
import { Card, RecordLog, RecordLogItem, ReviewLog, State, Grade } from "./models";
import { Vault } from "obsidian";
import { DIRECTORY } from "@/constants";
import { fixDate } from "./help";
import { fsrs, FSRS} from "./fsrs";
import { createEmptyCard } from "./default";


export class Deck {
    cards: Card[];
    memoryManager: MemoryManager //TODO: Athena - make memory manager a singleton

    static basicScheduler: FSRS = new FSRS({
        request_retention: 0.90,
        enable_short_term: true
    });

    static longTermScheduler: FSRS = new FSRS({
        request_retention: 0.90,
        enable_short_term: false
    });

    constructor(
        cards: Card[],
        memoryManager: MemoryManager
    ) {
     // create shallow copy +sort card 
        this.cards = [...cards];
        this.memoryManager = memoryManager
        this.sortCards();
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

    // Find card with the same id in the deck, and copy the new values over
    async updateCard(recordLog: RecordLogItem, updateMemory = true) {
        const index = this.cards.findIndex(c => c.id === recordLog.card.id);
        if (index == -1 ) {
            console.error("trying to update a card that doesn't exists ind deck")
        }
        
    // We don't overwrite the card since these cards are also used in other decks
        console.log('ATHENA-DEBUG', 'new card', recordLog.card)
        const card = Object.assign(this.cards[index], recordLog.card);

        if (updateMemory) {
            console.log("ATHENA-DEBUG", 'updating card')
            await this.memoryManager.updateCard(card)
            await this.memoryManager.insertReviewLog(recordLog.log, card.id)
        }
    }

    static scheduleNext(card: Card, grade: Grade): RecordLogItem {
        return this.basicScheduler.next(card, new Date(), grade)
    }
}

export interface Placeholder {
    question: string, 
    answer: string, 
    id: string,
    hash: string,
}

export class DeckManager {
    decks: Deck[]
    memoryManager: MemoryManager
    vault: Vault

    constructor(
        memoryManager: MemoryManager,
        vault: Vault
    ) {
        this.memoryManager = memoryManager;
        this.vault = vault;
        (async() => {
            this.syncMemoryWithNotes()
        })();
    }


    // Update memory folder with new cards and card details
    async syncMemoryWithNotes() {

        // Part 1: Extract cards from notes
        const files = this.vault.getFiles();
        const newEntries: {[key: string]: Placeholder} = {}
        for (const file of files) {
            if (file.extension === 'md') {
                const content = await this.vault.read(file);
                console.log(content)
                const newCards = this.extractCardDetailsFromContent(content);
                for (const newCard of newCards) {
                    newEntries[newCard.id] = newCard;
                }
            }
        }

        // Part 2: Update memory files with new content
        for (const [id, entry] of Object.entries(newEntries)) {
            // Check if card exists in memory file
            if (this.memoryManager.getFile(id)) {
                // TODO: Athena - check if hash remains the same, if no, update card
                this.memoryManager.updateCardContent(entry)
            } else {
                // card doesn't exists in memory, we will create one
                const card = createEmptyCard(entry)
                
                
            }
        }
    }


    extractCardDetailsFromContent(content: string): Placeholder[] {
        // Implement the logic to extract card details from the content
        // This is a placeholder implementation

        const cardRegex = /\[!card\](.*?)<!--SR:(\w+)-(\w+)-->/gms;

        // Create an array to store the extracted cards
        const cards = [];
    
        // Use the regex to find matches in the text
        let match;
        while ((match = cardRegex.exec(content)) !== null) {
            // Extract the card content (everything between [!card] and <!--SR)
            const cardContent = match[1].trim();
            const id = match[2]
            const hash = match[3]
    
            // Split the card content into question and answer
            const parts = cardContent.split('\n');
            const question = parts[0].trim(); // First line is the question
            const answer = parts.slice(1).join('\n').trim(); // Rest is the answer
    
            // Add the extracted card to the array
            cards.push({
                'question': question,
                'answer': answer,
                'id': id,
                'hash': hash
            });
        }
    
        return cards;
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