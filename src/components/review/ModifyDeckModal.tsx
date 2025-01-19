import { App, Modal, Setting, Notice } from "obsidian";
import { DeckMetaData } from '@/fsrs';

export default class ModifyDeckModal extends Modal {
    metaData: DeckMetaData
    onModify: (name: string) => Promise<void>;
    newName: string

    constructor(app: App, metaData: DeckMetaData, onModify: (name: string) => Promise<void>) {
        super(app);
        this.onModify = onModify;
        this.metaData = metaData;
        this.newName = metaData.name
    }

    onOpen() {
        const { contentEl } = this;
    
        contentEl.createEl("h1", { text: `Modify ${this.metaData.name}` });
    
        new Setting(contentEl)
        .setName("Name")
        .addText((text) => {
          text.setValue(this.metaData.name);
          text.onChange((value) => {
            this.newName = value
          });
        });
    
        new Setting(contentEl)
          .addButton((btn) =>
            btn
              .setButtonText("Submit")
              .setCta()
              .onClick(async () => {
                if (!this.metaData.name.trim() || !this.metaData.rootPath.trim()) {
                  new Notice("Both name and root path must be filled out.");
                  return;
                }
                this.close();
                await this.onModify(this.newName);
              }));
      }
}
