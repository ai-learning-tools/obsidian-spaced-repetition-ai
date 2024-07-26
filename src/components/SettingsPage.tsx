import { App, PluginSettingTab, Setting } from "obsidian";
import SRPlugin from "@/main";
import ChainManager from "@/LLM/chainManager";
import { ChatModels, ChatModelDisplayNames, DISPLAY_NAME_TO_MODEL } from "@/constants";

export interface SRSettings {
  defaultModel: ChatModels;
  defaultModelDisplayName: ChatModelDisplayNames;
  openAIApiKey: string;
  anthropicApiKey: string;
  googleApiKey: string;
	temperature: number;
	maxTokens: number;
	chatContextTurns: number;
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
				.addOptions(DISPLAY_NAME_TO_MODEL)
				.setValue(this.plugin.settings.defaultModelDisplayName)
				.onChange(async (value) => {
					this.plugin.settings.defaultModelDisplayName = value as ChatModelDisplayNames;
					this.plugin.settings.defaultModel = DISPLAY_NAME_TO_MODEL[value as ChatModelDisplayNames];
					await this.plugin.saveSettings();
				}));

    new Setting(containerEl)
      .setName('OpenAI API Key')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.openAIApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openAIApiKey = value;
					await this.plugin.saveSettings();
				}));
    
    new Setting(containerEl)
      .setName('Anthropic API Key')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.anthropicApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openAIApiKey = value;
					await this.plugin.saveSettings();
				}));

    new Setting(containerEl)
      .setName('Google API Key')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.googleApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openAIApiKey = value;
					await this.plugin.saveSettings();
				}));
  }
}

