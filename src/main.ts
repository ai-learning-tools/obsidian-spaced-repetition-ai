import { Plugin, WorkspaceLeaf} from 'obsidian';
import { ViewTypes, DEFAULT_SETTINGS } from '@/constants';
import ChatView from '@/views/ChatView';
import ReviewView from '@/views/ReviewView';
import { SRSettingTab } from '@/components/SettingsPage';
import { SRSettings } from '@/settings';
import '@/tailwind.css';
import EncryptionService from '@/utils/encryptionService';
import { Deck } from './sr/Deck';
import { DeckIterator } from './sr/DeckIterator';
import AIManager from './LLM/AIManager';

export default class SRPlugin extends Plugin {
	settings: SRSettings;
	chatIsVisible = false;
	activateViewPromise: Promise<void> | null = null;
	aiManager: AIManager;

	deckTree: Deck;
	deckIterator: DeckIterator;

	async onload(): Promise<void> {
		
		await this.loadSettings();
		this.addSettingTab(new SRSettingTab(this.app, this));
		this.deckTree = new Deck("", this.app.vault, null);
		this.deckIterator = new DeckIterator(this.deckTree);
		
		this.aiManager = AIManager.getInstance(this.settings.defaultModel);

		await this.saveSettings();

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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SRSettingTab(this.app, this));

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.settings = EncryptionService.encryptAllKeys(this.settings);
		this.aiManager.setModel(this.settings.defaultModel);
		await this.saveData(this.settings);
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

