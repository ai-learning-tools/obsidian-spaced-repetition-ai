import { Card, ReviewLog, createEmptyCard } from "@/fsrs";
import { Vault, TFolder } from "obsidian";
import { DIRECTORY } from "@/constants";

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
        //     for (let i = 1; i <= 6; i++) {
        //         const card = createEmptyCard(i);
        //         const memory = { card: card, reviewLogs: [], id: i };
        //         await this.writeMemory(memory);
        //     }
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
        const filePath = `${DIRECTORY}/memory/${id}.json`;
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            return JSON.parse(fileContent) as Memory;
        } else {
            throw new Error(`Memory file not found: ${filePath}`);
        }
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

    async writeMemory(memory: Memory): Promise<void> {
        const filePath = `${DIRECTORY}/memory/${memory.id}.json`;
        const fileContent = JSON.stringify(memory, null, 2);
        const file = this.vault.getFileByPath(filePath);

        if (file) {
            await this.vault.modify(file, fileContent);
        } else {
            await this.vault.create(filePath, fileContent);
        }
    }

    async insertReviewLog(newLog: ReviewLog, id: number): Promise<void> {
        const filePath = `${DIRECTORY}/memory/${id}.json`;
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.reviewLogs.unshift(newLog);
                this.writeMemory(memory);
            } catch (error) {
                throw new Error(`Cannot insert review log: Invalid memory content in file: ${filePath}`);
            }
        } else {
            throw new Error(`Cannot insert review log: Memory file not found: ${filePath}`);
        }
    }

    async updateCard(newCard: Card): Promise<void> {
        const filePath = `${DIRECTORY}/memory/${newCard.id}.json`;
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.card = newCard
                this.writeMemory(memory);
            } catch (error) {
                throw new Error(`Cannot update card: Invalid memory content in file: ${filePath}`);
            }
        } else {
            throw new Error(`Cannot insert review log: Memory file not found: ${filePath}`);
        }
    }

    async readCard(id: string): Promise<Card> {
        const memory = await this.readMemory(id);
        return memory.card;
    }
}

export default MemoryManager;
