import { Card } from './Card';
import { Vault, TFile, MetadataCache } from 'obsidian';

export class SRFile extends TFile {
    vault: Vault;
    file: TFile; 
    metadataCache: MetadataCache;

    cards: Card[];

    constructor(vault: Vault, metadataCache: MetadataCache, file: TFile, cards: Card[]) {
        super();
        this.vault = vault;
        this.metadataCache = metadataCache;
        this.file = file;
        this.cards = cards;
    }

    getQuestionContext(cardLine: number): string[] {
        // TODO
        return [];
    }

    async read(): Promise<string> {
        return await this.vault.read(this.file);
    }

    async write(content: string): Promise<void> {
        await this.vault.modify(this.file, content);
    }

}