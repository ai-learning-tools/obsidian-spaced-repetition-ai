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
      .setName('OpenAI API Key')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.openAIApiKey ? '•'.repeat(16) : '')
				.onChange(async (value) => {
					this.plugin.settings.openAIApiKey = value;
					await this.plugin.saveSettings();
				}));
		

    new Setting(containerEl)
      .setName('Default Model')
      .addDropdown(dropdown => dropdown
        .addOptions(MODEL_TO_DISPLAY_NAME)
        .setValue(this.plugin.settings.defaultModel)
        .onChange(async (value: ChatModels) => {
          this.plugin.settings.defaultModel = value;
          this.plugin.settings.defaultModelDisplayName = MODEL_TO_DISPLAY_NAME[value];
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Separator for inline flashcards')
      .setDesc(`Your flashcards will use this separator when both the front and back are single lines. Note that you will need to edit your existing cards upon changing this separator.`)
      .addText(text => text
        .setValue(this.plugin.settings.inlineSeparator)
        .onChange(async (value) => {
          this.plugin.settings.inlineSeparator = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Separator for multiline flashcards')
      .setDesc(`Your flashcards will use this separator when either the front or back are multiline. Note that you will need to edit your existing cards upon changing this separator.`)
      .addText(text => text
        .setValue(this.plugin.settings.multilineSeparator)
        .onChange(async (value) => {
          this.plugin.settings.multilineSeparator = value;
          await this.plugin.saveSettings();
        })
      );
        
  }
}

