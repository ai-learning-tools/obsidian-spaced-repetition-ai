import { Card, ReviewLog, DeckMetaData, Entry } from "@/fsrs";
import { Vault, TFolder, TFile, Notice } from "obsidian";
import { CORRUPTION_WARNING, DIRECTORY } from "@/constants";

interface Memory {
    _comment?: string
    id: string
    isShown: boolean // this is true if card with corresponding id is present in the obsidian vault. we only show cards present in the deck, but keeps memory files of all cards.
    card: Card
    reviewLogs: ReviewLog[]
}

// Memory manager to read and write cards and review logs into json file {id}.json 

class MemoryManager {
    vault: Vault;
    baseFolder: TFolder;
    memoryFolder: TFolder;
    deckFile: TFile | null;

    constructor(vault: Vault) {
        this.vault = vault;
        this.initializeFolders();
        const deckFilePath = `${DIRECTORY}/deck.md`;
        this.deckFile = this.vault.getFileByPath(deckFilePath);

        (async() => {
            if (!this.deckFile) {
                await this.vault.create(deckFilePath, 
                    JSON.stringify({ comment: CORRUPTION_WARNING, decks: [] }, null, 2));
                this.deckFile = this.vault.getFileByPath(deckFilePath);
            }
        })();
    }

    async initializeFolders() {
        this.baseFolder = await this.ensureFolderExists(DIRECTORY);
        this.memoryFolder = await this.ensureFolderExists(`${DIRECTORY}/memory`);
    }

    async ensureFolderExists(folderPath: string): Promise<TFolder> {
        let folder = this.vault.getFolderByPath(folderPath);
        if (!folder) {
            folder = await this.vault.createFolder(folderPath);
        }
        return folder;
    }

    async readMemory(id: string): Promise<Memory> {
        return this.readMemoryFromPath(`${DIRECTORY}/memory/${id}.md`);
    }

    async readMemoryFromPath(filePath: string): Promise<Memory> {
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                return JSON.parse(fileContent) as Memory;
            } catch (error) {
                throw new Error(`Cannot parse memory file: ${filePath}. Error: ${error.message}`);
            }
        } else {
            throw new Error(`Memory file not found: ${filePath}`);
        }
    }

    getFile(id: string): TFile | null {
        const filePath = `${DIRECTORY}/memory/${id}.md`;
        const file = this.vault.getFileByPath(filePath);
        return file ? file : null;
    }

    async writeMemory(memory: Memory): Promise<void> {
        const file = this.getFile(memory.id.toString());
        const fileContent = JSON.stringify(memory, null, 2);

        if (file) {
            await this.vault.modify(file, fileContent);
        } else {
            await this.vault.create(`${DIRECTORY}/memory/${memory.id}.md`, fileContent);
        }
    }

    static createNewMemory(card: Card, isShown = true): Memory {
        if (!card.id) {
            throw new Error("Card must have an ID.");
        }
        return {
            _comment: CORRUPTION_WARNING,
            card: card, 
            reviewLogs: [], 
            id: card.id, 
            isShown: isShown
        }
    }

    getAllMemoryFiles(): TFile[] {
        return this.vault.getFiles().filter(file => file.path.startsWith(`${DIRECTORY}/memory`) && file.extension === 'md');
    }

    async insertReviewLog(newLog: ReviewLog, id: string): Promise<void> {
        const file = this.getFile(id);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.reviewLogs.unshift(newLog);
                this.writeMemory(memory);
            } catch (error) {
                throw new Error(`Cannot insert review log: Invalid memory content in file: ${DIRECTORY}/memory/${id}.md`);
            }
        } else {
            throw new Error(`Cannot insert review log: Memory file not found: ${DIRECTORY}/memory/${id}.md`);
        }
    }

    async updateCard(newCard: Card): Promise<void> {
        const file = this.getFile(newCard.id!.toString());
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.card = newCard
                await this.writeMemory(memory);
            } catch (error) {
                throw new Error(`Cannot update card: Invalid memory content in file: ${DIRECTORY}/memory/${newCard.id}.md`);
            }
        } else {
            throw new Error(`Cannot update card: Memory file not found: ${DIRECTORY}/memory/${newCard.id}.md`);
        }
    }

    // Used when syncing memory files with .md notes
    async updateMemoryContent(id: string, content: Entry | undefined, isShown: boolean | undefined): Promise<void> {
        if (content || isShown !== undefined) {
            const file = this.getFile(id);
            if (file) {
                try {
                    const fileContent = await this.vault.read(file);
                    const memory: Memory = JSON.parse(fileContent) as Memory;
                    if (content) {
                        memory.card.front = content.front;
                        memory.card.back = content.back;
                        memory.card.path = content.path;
                    }
                    if (isShown !== undefined) {
                        memory.isShown = isShown;
                    }
                    
                    await this.writeMemory(memory);
                } catch (error) {
                    new Notice(`Cannot update card ${id}: ${error.message}`, 5000);
                }
            }
        }
    }

    async getAllDeckMetaData(): Promise<DeckMetaData[]> {
        const deckFilePath = `${DIRECTORY}/deck.md`;
        this.deckFile = this.vault.getFileByPath(deckFilePath);
        
        if (this.deckFile) {
            try {
                const fileContent = await this.vault.read(this.deckFile);
                return JSON.parse(fileContent)['decks'] as DeckMetaData[]
            } catch {
                throw new Error(`Enable to parse deck from deck.md`);
            }
        } else {
            throw new Error(`Cannot get deck meta data: deck.md does not exists`);
        }
    }

    async addDeck(newDeck: DeckMetaData): Promise<void> {
        if (this.deckFile) {
            try {
                const fileContent = await this.vault.read(this.deckFile);
                const decks = JSON.parse(fileContent)['decks'] as DeckMetaData[];

                // Check for existing deck with the same name or path
                const duplicateDeck = decks.find(deck => deck.name == newDeck.name || deck.rootPath == newDeck.rootPath);
                if (duplicateDeck) {
                    throw new Error(`A deck with the same name or path already exists.`);
                }

                decks.push(newDeck);
                await this.vault.modify(this.deckFile, JSON.stringify({ decks: decks }, null, 2));
            } catch (error) {
                throw new Error(`Cannot add deck: ${error.message}`);
            }
        } else {
            throw new Error(`Cannot add deck: deck.md does not exist`);
        }
    }

    async deleteDeck(toDelete: DeckMetaData): Promise<void> {
        if (this.deckFile) {
            try {
                const fileContent = await this.vault.read(this.deckFile);
                let decks = JSON.parse(fileContent)['decks'] as DeckMetaData[];
                
                console.log('toDelete', toDelete)
                decks = decks.filter(deck => toDelete.name != deck.name && toDelete.rootPath != deck.rootPath);
                console.log('exisitng deck', decks)
                await this.vault.modify(this.deckFile, JSON.stringify({ decks: decks }, null, 2));
            } catch (error) {
                throw new Error(`Cannot delete deck: Invalid content in deck.md`);
            }
        } else {
            throw new Error(`Cannot delete deck: deck.md does not exist`);
        }
    }

    async renameDeck(oldName: string, newName: string): Promise<void> {
        if (this.deckFile) {
            try {
                const fileContent = await this.vault.read(this.deckFile);
                const decks = JSON.parse(fileContent)['decks'] as DeckMetaData[];
                const deck = decks.find(deck => deck.name === oldName);
                if (deck) {
                    deck.name = newName;
                    await this.vault.modify(this.deckFile, JSON.stringify({ decks: decks }, null, 2));
                } else {
                    throw new Error(`Deck with name ${oldName} not found`);
                }
            } catch (error) {
                throw new Error(`Cannot rename deck: ${error.message}`);
            }
        } else {
            throw new Error(`Cannot rename deck: deck.md does not exist`);
        }
    }

    static generateRandomID(length= 8): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let result = '';
    
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charactersLength);
            result += characters.charAt(randomIndex);
        }
    
        return result;
    }
}

export default MemoryManager;
