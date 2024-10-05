import { App, PluginSettingTab, Setting } from "obsidian";
import SRPlugin from "@/main";
import { ChatModels, MODEL_TO_DISPLAY_NAME } from "@/constants";

export class SRSettingTab extends PluginSettingTab {
  plugin: SRPlugin;

  constructor(app: App, plugin: SRPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Separator for inline flashcards')
      .setDesc(`We'll detect and generate cards with this separator, when both the front and back are single lines. Note that you will need to edit your existing cards upon changing this separator`)
      .addText(text => text
        .setValue(this.plugin.settings.inlineSeparator)
        .onChange(async (value) => {
          this.plugin.settings.inlineSeparator = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Separator for multiline flashcards')
      .setDesc(`We'll detect and generate cards with this separator, when either the front or back are multiline. Note that you will need to edit your existing cards upon changing this separator`)
      .addText(text => text
        .setValue(this.plugin.settings.multilineSeparator)
        .onChange(async (value) => {
          this.plugin.settings.multilineSeparator = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc(`Add an API key to chat with your notes and generate flashcards. Note that you can still do flashcard reviews without AI`)
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.openAIApiKey ? '•'.repeat(16) : '')
				.onChange((value) => {
					this.plugin.settings.openAIApiKey = value;
				}))
      .addButton(cb => cb
        .setButtonText('Validate')
        .onClick(() => {
          this.plugin.saveSettings({ apiKey: true });
        })
      )

    new Setting(containerEl)
      .setName('Default Model')
      .setDesc(`When you open a new chat, this AI model is used by default`)
      .addDropdown(dropdown => dropdown
        .addOptions(MODEL_TO_DISPLAY_NAME)
        .setValue(this.plugin.settings.defaultModel)
        .onChange(async (value: ChatModels) => {
          this.plugin.settings.defaultModel = value;
          this.plugin.settings.defaultModelDisplayName = MODEL_TO_DISPLAY_NAME[value];
          await this.plugin.saveSettings({ defaultModel: true});
        }));

    new Setting(containerEl)
      .setName('Include current file by default')
      .setDesc('While chatting with your notes, include the last active file as context by default')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeCurrentFile)
        .onChange((value) => {
          this.plugin.settings.includeCurrentFile = value;
          this.plugin.saveSettings();
        })
      )


        
  }
}

