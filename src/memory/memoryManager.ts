import { Card, createEmptyCard } from "@/fsrs";
import { Vault, TFolder } from "obsidian";

// Memory manager to read and write cards and review logs into a meta datafile .sr in obsidian
const directory = "SR" //TODO: move away

class MemoryManager {
    vault: Vault;
    memoryFolder: TFolder;
    cardsFolder: TFolder;
    reviewLogFolder: TFolder;

    constructor(vault: Vault) {
        this.vault = vault;
        this.initializeFolders();

        const card = createEmptyCard();
        this.writeCard(card)
    }

    async initializeFolders() {
        this.memoryFolder = await this.ensureFolderExists(directory);
        this.cardsFolder = await this.ensureFolderExists(`${directory}/card`);
        this.reviewLogFolder = await this.ensureFolderExists(`${directory}/reviewLog`);
    }

    async ensureFolderExists(folderPath: string): Promise<TFolder> {
        let folder = this.vault.getFolderByPath(folderPath);
        if (!folder) {
            folder = await this.vault.createFolder(folderPath);
        }
        return folder;
    }

    async readCard(id: string): Promise<Card> {
        const filePath = `~SR/cards/${id}.json`;
        const file = this.vault.getFileByPath(filePath);
        
        if (file) {
            const fileContent = await this.vault.read(file);
            return JSON.parse(fileContent);
        } else {
            throw new Error(`Card file not found: ${filePath}`);
        }
    }

    async writeCard(card: Card): Promise<void> {
        const filePath = `${directory}/cards/${card.id}.json`;
        const fileContent = JSON.stringify(card, null, 2);
        const file = this.vault.getFileByPath(filePath);

        if (file) {
            await this.vault.modify(file, fileContent);
        } else {
            await this.vault.create(filePath, fileContent);
        }
    }

    readReviewLogs() {
    }

    writeReviewLogs() {
    }
}

export default MemoryManager;
