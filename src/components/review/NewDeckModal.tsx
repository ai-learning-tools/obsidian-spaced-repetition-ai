
import { App, Modal, Setting, Notice } from "obsidian";
import { DeckMetaData } from '@/fsrs';

export default class NewDeckModal extends Modal {
  metaData: DeckMetaData
  onSubmit: (metaData: DeckMetaData) => Promise<void>;

  constructor(app: App, onSubmit: (metaData: DeckMetaData) => Promise<void>) {
      super(app);
      this.onSubmit = onSubmit;
      this.metaData = {
        "name" : "",
        "rootPath" : ""
      }
  }

  onOpen() {
      const { contentEl } = this;
  
      contentEl.createEl("h1", { text: "Create a new deck" });
  
      new Setting(contentEl)
      .setName("Name")
      .addText((text) =>
        text.onChange((value) => {
          this.metaData.name = value
        }));

      new Setting(contentEl)
        .setName("Root path")
        .setDesc("Include all cards from files that begin with the specified root path\nexample: main")
        .addText((text) =>
          text.onChange((value) => {
            this.metaData.rootPath = value
          }));
  
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
              await this.onSubmit(this.metaData);
            }));
    }

}