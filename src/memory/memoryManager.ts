import { Card, ReviewLog, createEmptyCard } from "@/fsrs";
import { Vault, TFolder, TFile } from "obsidian";
import { DIRECTORY } from "@/constants";
import { Placeholder } from "@/fsrs/Deck";

interface Memory {
    id: number
    card: Card,
    reviewLogs: ReviewLog[]
}

// Memory manager to read and write cards and review logs into json file {id}.json 

class MemoryManager {
    vault: Vault;
    baseFolder: TFolder;
    memoryFolder: TFolder;

    constructor(vault: Vault) {
        this.vault = vault;
        this.initializeFolders();

        // (async () => {
        //     await this._resetMemory()
        // })();
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
        return this.readMemoryFromPath(`${DIRECTORY}/memory/${id}.json`);
    }

    async readMemoryFromPath(filePath: string): Promise<Memory> {
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            return JSON.parse(fileContent) as Memory;
        } else {
            throw new Error(`Memory file not found: ${filePath}`);
        }
    }

    getFile(id: string): TFile | null {
        const filePath = `${DIRECTORY}/memory/${id}.json`;
        const file = this.vault.getFileByPath(filePath);
        return file ? file : null;
    }

    async writeMemory(memory: Memory): Promise<void> {
        const file = this.getFile(memory.id.toString());
        const fileContent = JSON.stringify(memory, null, 2);

        if (file) {
            await this.vault.modify(file, fileContent);
        } else {
            await this.vault.create(`${DIRECTORY}/memory/${memory.id}.json`, fileContent);
        }
    }

    async insertReviewLog(newLog: ReviewLog, id: number): Promise<void> {
        const file = this.getFile(id.toString());
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.reviewLogs.unshift(newLog);
                this.writeMemory(memory);
            } catch (error) {
                throw new Error(`Cannot insert review log: Invalid memory content in file: ${DIRECTORY}/memory/${id}.json`);
            }
        } else {
            throw new Error(`Cannot insert review log: Memory file not found: ${DIRECTORY}/memory/${id}.json`);
        }
    }

    async updateCard(newCard: Card): Promise<void> {
        const file = this.getFile(newCard.id.toString());
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.card = newCard
                await this.writeMemory(memory);
            } catch (error) {
                throw new Error(`Cannot update card: Invalid memory content in file: ${DIRECTORY}/memory/${newCard.id}.json`);
            }
        } else {
            throw new Error(`Cannot update card: Memory file not found: ${DIRECTORY}/memory/${newCard.id}.json`);
        }
    }

    // Used when syncing memory files with .md notes
    async updateCardContent(content: Placeholder): Promise<void> {
        const file = this.getFile(content.id)
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.card.answer = content.answer
                memory.card.question = content.question
                memory.card.hash = content.hash
                await this.writeMemory(memory);
            } catch (error) {
                throw new Error(`Cannot update card: Invalid memory content in file: ${DIRECTORY}/memory/${newCard.id}.json`);
            }
        }
    }

    async _resetMemory() {
        for (let i = 1; i <= 6; i++) {
            const entry = {
                'id': i.toString(),
                'hash': i.toString(), 
                'question': "what's the meaning of life",
                'answer': "to love and be loved"
            }
            const card = createEmptyCard(entry);
            const memory = { card: card, reviewLogs: [], id: i, hash: i};
            await this.writeMemory(memory);
        }
    }
}

export default MemoryManager;
