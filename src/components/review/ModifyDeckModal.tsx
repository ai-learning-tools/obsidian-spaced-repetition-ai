import { App, Modal, Setting, Notice, setIcon } from "obsidian";
import { DeckMetaData } from "@/fsrs";

export default class ModifyDeckModal extends Modal {
    metaData: DeckMetaData;
    onModify: (name: string) => Promise<void>;
    onDelete: () => Promise<void>;
    newName: string;

    constructor(
        app: App,
        metaData: DeckMetaData,
        onModify: (name: string) => Promise<void>,
        onDelete: () => Promise<void>
    ) {
        super(app);
        this.metaData = metaData;
        this.newName = metaData.name;
        this.onModify = onModify;
        this.onDelete = onDelete;
    }

    onOpen() {
        const { contentEl } = this;

        // Create a container for the heading and trash icon
        const headingContainer = contentEl.createDiv({ cls: "setting-item" }); // Leverage Obsidian's existing "setting-item" class

        // Add heading text
        const heading = headingContainer.createEl("h1", { text: `Modify ${this.metaData.name}` });
        heading.classList.add("setting-item-heading"); // Optional for headings

        // Create a pressable trash icon
        const trashIcon = headingContainer.createEl("div", { cls: "clickable-icon" });
        setIcon(trashIcon, "trash"); // Built-in Obsidian icon
        trashIcon.setAttribute("aria-label", "Delete deck");
        
        // 4. Wire up the "delete" behavior
        trashIcon.addEventListener("click", async () => {
            const confirmDelete = confirm(
                "Are you sure you want to delete this deck? Your cards will not be deleted."
            );
            if (confirmDelete) {
                this.close();
                await this.onDelete();
            }
        });

        // 5. Setting to modify the deck name
        new Setting(contentEl)
            .setName("Deck name")
            .addText((text) => {
                text.setValue(this.newName);
                text.onChange((value) => {
                    this.newName = value;
                });
            });

        // 6. Submit button
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
                    })
            );
    }
}
