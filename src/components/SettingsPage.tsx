import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "@/main";
export interface SRSettings {
  defaultModel: string;
  defaultModelDisplayName: string;
  openAIApiKey: string;
  anthropicApiKey: string;
  googleApiKey: string;
}

export class SRSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    new Setting(containerEl)
      .setName('Default Model')
      .addDropdown(dropdown => dropdown
				.setValue(this.plugin.settings.defaultModel)
				.onChange(async (value) => {
					this.plugin.settings.defaultModel = value;
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

