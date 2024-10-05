import { Plugin, WorkspaceLeaf, Notice } from 'obsidian';
import { ViewType, SubviewType, DEFAULT_SETTINGS } from '@/constants';
import MainView from '@/views/MainView';
import { SRSettingTab } from '@/components/SettingsPage';
import { SRSettings } from '@/settings';
import '@/tailwind.css';
import EncryptionService from '@/utils/encryptionService';
import MemoryManager from './memory/memoryManager';
import { DeckManager } from './fsrs/Deck';
import AIManager from './llm/AIManager';
import { errorMessage } from './utils/errorMessage';

export default class SRPlugin extends Plugin {
	settings: SRSettings;
	memoryManager: MemoryManager;
	deckManager: DeckManager;
	aiManager: AIManager;
	subviewType: SubviewType;

	async onload(): Promise<void> {
		
		await this.loadSettings();

		this.subviewType = SubviewType.CHAT;
		this.memoryManager = new MemoryManager(this.app.vault)
		this.deckManager = new DeckManager(this.memoryManager, this.app.vault, this.settings)
		
		const key = this.settings.openAIApiKey;
		const decryptedKey = EncryptionService.getDecryptedKey(key);
		this.aiManager = AIManager.getInstance(this.settings.defaultModel, decryptedKey);

		this.addSettingTab(new SRSettingTab(this.app, this));

		this.addCommand({
			id: "chat-toggle-window",
			name: "Chat with your notes",
			callback: () => {
				this.toggleView(ViewType.MAIN, SubviewType.CHAT);
			},
		});

		this.addCommand({
			id: "review-toggle-window",
			name: "Review your flashcards",
			callback: () => {
				this.toggleView(ViewType.MAIN, SubviewType.REVIEW);
			}
		});

		this.registerView(
			ViewType.MAIN,
			(leaf: WorkspaceLeaf) => new MainView(leaf, this),
		);

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('documents', 'Review your flashcards and notes', (evt: MouseEvent) => {
			this.toggleView(ViewType.MAIN, this.subviewType);
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SRSettingTab(this.app, this));

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(changed: {
		apiKey?: boolean,
		defaultModel?: boolean
	} = {}): Promise<void> {
		try {
			if (changed) {
				if (changed.apiKey) {
					new Notice("Checking API Key...");
					const key = EncryptionService.getDecryptedKey(this.settings.openAIApiKey);
					const isSet = await this.aiManager.setApiKey(key);
					if (isSet) {
						this.settings = EncryptionService.encryptAllKeys(this.settings);
						new Notice("API Key is valid!");
					} else {
						return;
					}
				}
				if (changed.defaultModel) {
					this.aiManager.setModel(this.settings.defaultModel);
				}
			}
			await this.saveData(this.settings);
		} catch(e) {
			errorMessage(e);
		}
	}

	toggleView(viewType: ViewType, subviewType: SubviewType) {
		const leaves = this.app.workspace.getLeavesOfType(viewType);
		if (leaves.length > 0) {
			this.deactivateView(viewType); 
			if (this.subviewType !== subviewType) {
				this.subviewType = subviewType;
				this.activateView(viewType);
			}
		} else {
			this.subviewType = subviewType;
			this.activateView(viewType);
		}
	}

	async activateView(viewType: ViewType) {
		this.app.workspace.detachLeavesOfType(viewType);
		await this.app.workspace
		.getRightLeaf(false)!
		.setViewState({
			type: viewType,
			active: true,
		});
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(viewType)[0],
		);

	}
	
	async deactivateView(viewType: ViewType) {
		this.app.workspace.detachLeavesOfType(viewType);
	}


}

