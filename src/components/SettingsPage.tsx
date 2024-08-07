import { App, PluginSettingTab, Setting } from "obsidian";
import SRPlugin from "@/main";
import { ChatModels, ChatModelDisplayNames, MODEL_TO_DISPLAY_NAME } from "@/constants";

export interface SRSettings {
  defaultModel: ChatModels;
  defaultModelDisplayName: ChatModelDisplayNames;
  openAIApiKey: string;
  anthropicApiKey: string;
  googleApiKey: string;
}

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
      .setName('OpenAI API Key')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.openAIApiKey ? '•'.repeat(16) : '')
				.onChange(async (value) => {
					this.plugin.settings.openAIApiKey = value;
					await this.plugin.saveSettings();
				}));
				
    new Setting(containerEl)
      .setName('Anthropic API Key')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.anthropicApiKey ? '•'.repeat(16) : '')
				.onChange(async (value) => {
					this.plugin.settings.anthropicApiKey = value;
					await this.plugin.saveSettings();
				}));

    new Setting(containerEl)
      .setName('Google API Key')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.googleApiKey ? '•'.repeat(16) : '')
				.onChange(async (value) => {
					this.plugin.settings.googleApiKey = value;
					await this.plugin.saveSettings();
				}));
  }
}

