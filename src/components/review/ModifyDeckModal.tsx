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

        // 1. Create a flex container for the heading and the trash icon
        const headingContainer = contentEl.createDiv({ cls: "modify-deck-heading" });
        headingContainer.style.display = "flex";
        headingContainer.style.alignItems = "center";
        headingContainer.style.justifyContent = "space-between";

        // 2. Add the heading text
        headingContainer.createEl("h1", { text: `Modify ${this.metaData.name}` });

        // 3. Create a pressable icon (no button border)
        const trashIcon = headingContainer.createEl("div");
        setIcon(trashIcon, "trash"); // Built-in Obsidian icon
        // Give it a class or inline styling to show it's clickable
        trashIcon.style.cursor = "pointer";
        trashIcon.style.padding = "0.25rem"; // optional “click area” padding

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
            .setName("Deck Name")
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
