import { Card, ReviewLog, createEmptyCard } from "@/fsrs";
import { Vault, TFolder } from "obsidian";

interface Memory {
    id: number
    card: Card,
    reviewLogs: ReviewLog[]
}

// Memory manager to read and write cards and review logs into json file {id}.json 
const directory = "SR" //TODO: move away to settings
class MemoryManager {
    vault: Vault;
    baseFolder: TFolder;
    memoryFolder: TFolder;

    constructor(vault: Vault) {
        this.vault = vault;
        this.initializeFolders();
    }

    async initializeFolders() {
        this.baseFolder = await this.ensureFolderExists(directory);
        this.memoryFolder = await this.ensureFolderExists(`${directory}/memory`);
    }

    async ensureFolderExists(folderPath: string): Promise<TFolder> {
        let folder = this.vault.getFolderByPath(folderPath);
        if (!folder) {
            folder = await this.vault.createFolder(folderPath);
        }
        return folder;
    }

    async readMemory(id: string): Promise<Memory> {
        const filePath = `~SR/memory/${id}.json`;
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            return JSON.parse(fileContent);
        } else {
            throw new Error(`Memory file not found: ${filePath}`);
        }
    }

    async writeMemory(memory: Memory): Promise<void> {
        const filePath = `${directory}/memory/${memory.id}.json`;
        const fileContent = JSON.stringify(memory, null, 2);
        const file = this.vault.getFileByPath(filePath);

        if (file) {
            await this.vault.modify(file, fileContent);
        } else {
            await this.vault.create(filePath, fileContent);
        }
    }

    async insertReviewLog(newLog: ReviewLog): Promise<void> {
        const filePath = `~SR/memory/${newLog.id}.json`;
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.reviewLogs.unshift(newLog);
            } catch (error) {
                throw new Error(`Cannot insert review log: Invalid memory content in file: ${filePath}`);
            }
        } else {
            throw new Error(`Cannot insert review log: Memory file not found: ${filePath}`);
        }
    }

    async updateCard(newCard: Card): Promise<void> {
        const filePath = `~SR/memory/${newCard.id}.json`;
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            try {
                const memory: Memory = JSON.parse(fileContent) as Memory;
                memory.card = newCard
            } catch (error) {
                throw new Error(`Cannot update card: Invalid memory content in file: ${filePath}`);
            }
        } else {
            throw new Error(`Cannot insert review log: Memory file not found: ${filePath}`);
        }
    }
}

export default MemoryManager;
