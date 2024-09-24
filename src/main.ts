import { Plugin, WorkspaceLeaf, Notice } from 'obsidian';
import { ViewTypes, DEFAULT_SETTINGS } from '@/constants';
import ChatView from '@/views/ChatView';
import ReviewView from '@/views/ReviewView';
import { SRSettingTab } from '@/components/SettingsPage';
import { SRSettings } from '@/settings';
import '@/tailwind.css';
import EncryptionService from '@/utils/encryptionService';
import MemoryManager from './memory/memoryManager';
import { DeckManager } from './fsrs/Deck';
import AIManager from './llm/AIManager';
import { ChatModels } from '@/constants';
import { errorMessage } from './utils/errorMessage';

export default class SRPlugin extends Plugin {
	settings: SRSettings;
	chatIsVisible = false;
	activateViewPromise: Promise<void> | null = null;
	memoryManager: MemoryManager;
	deckManager: DeckManager;
	aiManager: AIManager;

	async onload(): Promise<void> {
		
		await this.loadSettings();

		this.memoryManager = new MemoryManager(this.app.vault)
		this.deckManager = new DeckManager(this.memoryManager, this.app.vault)
		
		const key = this.settings.openAIApiKey;
		const decryptedKey = EncryptionService.getDecryptedKey(key);
		this.aiManager = AIManager.getInstance(this.settings.defaultModel, decryptedKey);

		this.addSettingTab(new SRSettingTab(this.app, this));

		this.addCommand({
			id: "chat-toggle-window",
			name: "Toggle Learning Chat Window",
			callback: () => {
				this.toggleView(ViewTypes.CHAT);
			},
		});

		this.addCommand({
			id: "review-toggle-window",
			name: "Toggle Learning Review Window",
			callback: () => {
				this.toggleView(ViewTypes.REVIEW);
			}
		});

		this.registerView(
			ViewTypes.CHAT,
			(leaf: WorkspaceLeaf) => new ChatView(leaf, this),
		);

		this.registerView(
			ViewTypes.REVIEW,
			(leaf: WorkspaceLeaf) => new ReviewView(leaf, this)
		);

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('documents', 'Learn with flashcards', (evt: MouseEvent) => {
			this.toggleView(ViewTypes.CHAT);
		});

		this.addRibbonIcon('dice', 'Review flashcards', (evt: MouseEvent) => {
			this.toggleView(ViewTypes.REVIEW);
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

	toggleView(viewType: ViewTypes) {
		const leaves = this.app.workspace.getLeavesOfType(viewType);
		leaves.length > 0 ? this.deactivateView(viewType) : this.activateView(viewType);
	}

	async activateView(viewType: ViewTypes) {
		this.app.workspace.detachLeavesOfType(viewType);
		this.activateViewPromise = this.app.workspace
		.getRightLeaf(false)!
		.setViewState({
			type: viewType,
			active: true,
		});
		await this.activateViewPromise; // TODO @belinda or @athena: this doesn't look like it does anything lol. remove?
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(viewType)[0],
		);

		if (viewType === ViewTypes.CHAT) {
			this.chatIsVisible = true;
		}
	}
	
	async deactivateView(viewType: ViewTypes) {
		this.app.workspace.detachLeavesOfType(viewType);
		if (viewType === ViewTypes.CHAT) {
			this.chatIsVisible = false;
		}
	}


}

