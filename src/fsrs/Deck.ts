import MemoryManager from "@/memory/memoryManager";
import { Card, RecordLog, RecordLogItem, ReviewLog, State, Grade, Entry, DeckMetaData } from "./models";
import { Vault } from "obsidian";
import { DIRECTORY } from "@/constants";
import { fixDate } from "./help";
import { fsrs, FSRS} from "./fsrs";
import { createEmptyCard } from "./default";
import { writeIdToCardInFile } from "@/utils/obsidianFiles";


export class Deck {
    cards: Card[];
    metaData: DeckMetaData;
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
        metaData: DeckMetaData,
        memoryManager: MemoryManager
    ) {
     // create shallow copy +sort card 
        this.cards = [...cards];
        this.metaData = metaData;
        this.memoryManager = memoryManager
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

    getDue() : Card[] {
        return this.cards.filter(card => card.due && new Date(card.due) <= new Date())
    }

    // Find card with the same id in the deck, and copy the new values over
    async updateCard(recordLog: RecordLogItem, updateMemory = true) {
        const index = this.cards.findIndex(c => c.id === recordLog.card.id);
        if (index == -1 ) {
            console.error("trying to update a card that doesn't exists ind deck")
        }
        
    // We update the card instead of overwriting it since other decks may carry a reference to this card
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
            await this.syncMemoryWithNotes()
        })();
    }


    // Update memory folder with new cards and card details
    async syncMemoryWithNotes() {

        // Part 1: Extract cards from notes
        const files = this.vault.getFiles();
        const newEntries: {[key: string]: Entry} = {}
        for (const file of files) {
            if (file.extension === 'md') {
                const content = await this.vault.read(file);
                const extractedEntries = this.extractEntriesFromContent(content, file.path);
                for (const newEntry of extractedEntries) {
                    const id = newEntry.id ?? MemoryManager.generateRandomID();
                    newEntry.id = id
                    newEntries[id] = newEntry;
                }
            }
        }

        // Part 2: Update memory files with new content
        for (const [id, entry] of Object.entries(newEntries)) {
            // Check if card exists in memory file
            if (this.memoryManager.getFile(id)) {
                this.memoryManager.updateCardContent(entry)
            } else {
                // card doesn't exists in memory, we will create one
                const card = createEmptyCard(entry)
                const memory = {card: card, reviewLogs: [], id: id}
                await this.memoryManager.writeMemory(memory) 

                // if entry already has Id but doesnt have a memory file, log a warning
                if (!entry.isNew) {
                    console.warn(`memory file of ${entry.id} cannot be found, rewriting`)
                } else {
                    // write id into newly created card
                    writeIdToCardInFile(this.vault, entry, id)
                }
                
            }
        }

        // Part 3: move untracked memory files to trash
        const trackedIds = new Set(Object.keys(newEntries));
        const memoryFiles = this.memoryManager.getAllMemoryFiles();

        for (const file of memoryFiles) {
            const id = file.basename;
            if (!trackedIds.has(id)) {
                await this.vault.trash(file, true);
            }
        }
    }


    extractEntriesFromContent(content: string, filePath: string): Entry[] {
        // Implement the logic to extract entry details from the content

        const entryRegex = /(?:^|\n{2,})([^\n](?:(?!\n{2,})[\s\S])*?)\n\?\n([^\n](?:(?!\n{2,})[\s\S])*?)(?:\n<!--LEARN:(.*?)-->)?(?=(?:\n{2,})|\n$|$)/g;

        // Create an array to store the extracted cards
        const entries = [];
    
        let match;
        console.log("DEBUG-ATHENA", "start of content")
        while ((match = entryRegex.exec(content)) !== null) {
            const [, front, back, learnId] = match;
            console.log("MATCH \n", front, back, learnId)
    
            entries.push({
                front: front,
                back: back,
                id: learnId || undefined,
                path: filePath,
                isNew: learnId == undefined
            });
        }
        
    
        return entries;
    }

    async populateDecks() {
        // Get all files
        const directory = `${DIRECTORY}/memory`
        const files = this.vault.getFiles().filter(file => file.path.startsWith(directory) && file.extension === 'json');
        
        // Get all cards
        const allCards: Card[] = [];
        for (const file of files) {
            const memory = await this.memoryManager.readMemoryFromPath(file.path);
            allCards.push(memory.card);
        }

        // Get Deck
        const decksMetaData = await this.memoryManager.getAllDeckMetaData()
        console.log("DBEUG-ATHENA", decksMetaData)
        const allDecks : Deck[] = []

        for (const currData of decksMetaData) {
            const cards = allCards.filter(card => card.path.includes(currData.rootPath));
            allDecks.push(new Deck(cards, currData, this.memoryManager));
        }

        allDecks.push(new Deck(allCards, { "name": "All Cards", "rootPath": " "} , this.memoryManager))
        this.decks = allDecks

    }
}