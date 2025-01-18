import MemoryManager from "@/memory/memoryManager";
import { Card, RecordLog, RecordLogItem, ReviewLog, State, Grade, Entry, DeckMetaData, EntryType } from "./models";
import { Vault } from "obsidian";
import { DIRECTORY } from "@/constants";
import { fixDate } from "./help";
import { fsrs, FSRS} from "./fsrs";
import { createEmptyCard } from "./default";
import { writeIdToCardInFile } from "@/utils/obsidianFiles";
import { SRSettings } from "@/settings";


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
        const card = Object.assign(this.cards[index], recordLog.card);

        if (updateMemory) {
            console.log("ATHENA-DEBUG", 'updating card', card.id)
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
    settings: SRSettings

    constructor(
        memoryManager: MemoryManager,
        vault: Vault,
        settings: SRSettings
    ) {
        this.memoryManager = memoryManager;
        this.vault = vault;
        this.settings = settings;
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
            if (file.extension === 'md' && !file.path.startsWith(`${DIRECTORY}`)) {
                const content = await this.vault.read(file);
                const extractedEntries = this.extractEntriesFromContent(content, file.path);
                console.log('extracted entries')
                console.log(extractedEntries)
                for (const newEntry of extractedEntries) {
                    const id = newEntry.id ?? MemoryManager.generateRandomID();
                    newEntry.id = id
                    newEntries[id] = newEntry;
                }
            }
        }
        // Sort entries by their lineToAddId in descending order to prevent line shifting
        const sortedEntries = Object.values(newEntries).sort((a, b) => (b.lineToAddId ?? 0) - (a.lineToAddId ?? 0));

        // Part 2: Update memory files with new content
        for (const entry of sortedEntries) {
            if (!entry.id) {
                console.warn(`Entry with ID ${entry.id} is missing. Skipping this entry.`);
                continue;
            }
            // Check if card exists in memory file
            if (this.memoryManager.getFile(entry.id)) {
                this.memoryManager.updateMemoryContent(entry.id, entry, true)
            } else {
                // card doesn't exists in memory, we will create one
                const card = createEmptyCard(entry)
                const memory = MemoryManager.createNewMemory(card, true)
                await this.memoryManager.writeMemory(memory) 

                // if entry already has Id but doesnt have a memory file, log a warning
                if (!entry.isNew) {
                    console.warn(`memory file of ${entry.id} cannot be found, rewriting`)
                } else {
                    // write id into newly created card using lineToAddId, this only works when entries are visited 
                    // in descending lineToAddId order
                    const separator = entry.entryType == EntryType.Multiline ? this.settings.multilineSeparator : this.settings.inlineSeparator
                    await writeIdToCardInFile(this.vault, entry, separator)
                }
                
            }
        }

        // Note: We no longer moved untracked files to trash. this allows users move cards between files without losing data.
        // Part 3: update untracked memory files
        const trackedIds = new Set(Object.keys(newEntries));
        const memoryFiles = this.memoryManager.getAllMemoryFiles();

        for (const file of memoryFiles) {
            const id = file.basename;
            if (!trackedIds.has(id)) {
                this.memoryManager.updateMemoryContent(id, undefined, false)
            }
        }
    }


    extractEntriesFromContent(content: string, filePath: string): Entry[] {
        const multiLineSeparator = this.settings.multilineSeparator;
        const inlineSeparator = this.settings.inlineSeparator;
      
        const lines = content.split('\n');
        lines.push(''); //Adding an empty line helps the algorithm to detect cards at the end of the file
        const entries: Entry[] = [];
        let i = 0;
        let frontLines: string[] = [];
        let backLines: string[] = [];

        // logic to keep track of multiline separators
        let isSeparatorDetected = false;
        let detectedId = undefined;

        const escapeRegExp = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };
        

        const pattern = new RegExp(`\\[\\[${DIRECTORY}\\/memory\\/([A-Za-z0-9]{8})\\.md\\|${escapeRegExp(multiLineSeparator)}\\]\\]`);
        while (i < lines.length) {
            const currText = lines[i].trim();
            const idMatch = currText.match(pattern);
            if (!currText || currText == "") {
                // This line is irrelavant 
                if (frontLines.length > 0 && backLines.length > 0) {
                    // This may indicate the end of a multi-line card
                    const front = frontLines.join('\n');
                    const back = backLines.join('\n');
                    const id = detectedId ? detectedId[1] : undefined;
                    const entry = {
                        front: front,
                        back: back,
                        id: id,
                        path: filePath,
                        entryType: EntryType.Multiline,
                        lineToAddId: id ? undefined : i - backLines.length - 1,
                        isNew: id == undefined
                    }
                    entries.push(entry);
                } else {
                    // Even though this is not a multi-line card, there may be many single line card
                    const allLines = frontLines.concat(backLines);

                    const allText = allLines.join('\n') + '\n' + currText;
                    const pattern = new RegExp(`^(.*?)\\s(?:${inlineSeparator}|\\[\\[${DIRECTORY}\\/memory\\/([A-Za-z0-9]{8})\\.md\\|${escapeRegExp(inlineSeparator)}\\]\\])\\s(.*?)$`, 'gm');
                    let match;
                    while ((match = pattern.exec(allText)) !== null) {
                        let matchedText, front, id, back;
                        if (match.length == 4) {
                            // id detected
                            [matchedText, front, id, back] = match;
                        } else {
                            [matchedText, front, back] = match;
                            id = undefined
                        }
                        
                        const index = allLines.indexOf(matchedText);
                        const indexFromBack = allLines.length - index;
                        entries.push({
                            front: front,
                            back: back,
                            id: id,
                            path: filePath,
                            lineToAddId: id ? undefined: i - indexFromBack, //todo: check this
                            entryType: EntryType.Inline,
                            isNew: id == undefined
                        })
                    }
                }
                //let's clear previous information
                frontLines = []
                backLines = []
                isSeparatorDetected = false
                detectedId = undefined
            }

            // Both scenarios indicate that a multiline separator has been found
            // Add !isSeparatedDetected to ensure we don't catch rogue separators that may be sneaked in on the back of a card
            else if (idMatch && !isSeparatorDetected) {
                isSeparatorDetected = true
                detectedId = idMatch
            }
            else if (currText == multiLineSeparator && !isSeparatorDetected) {
                isSeparatorDetected = true
            }

            else if (!isSeparatorDetected) {
                frontLines.push(currText);
            }
            
            else {
                backLines.push(currText)
            }

            i++
        }

        return entries
    }

    async populateDecks() {
        // Get all files
        const directory = `${DIRECTORY}/memory`
        const files = this.vault.getFiles().filter(file => file.path.startsWith(directory) && file.extension === 'md');
        
        // Get all cards
        const allCards: Card[] = [];
        for (const file of files) {
            try {
                const memory = await this.memoryManager.readMemoryFromPath(file.path);
                if (memory.isShown) {
                    // Only populate cards that are physically present in the vault
                    allCards.push(memory.card);                
                }
            } catch (error) {
                console.error(`Error reading memory from file ${file.path}: ${error.message}`);
            }
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