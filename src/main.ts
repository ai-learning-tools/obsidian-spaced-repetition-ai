import { App, Editor, MarkdownView, Modal, Plugin, TFile, WorkspaceLeaf} from 'obsidian';
import { ViewTypes, DEFAULT_SETTINGS, PROXY_SERVER_PORT, DEFAULT_SYSTEM_PROMPT } from '@/constants';
import ChatView from '@/views/ChatView';
import ReviewView from '@/views/ReviewView';
import { SRSettingTab } from '@/components/SettingsPage';
import { SRSettings } from '@/settings';
import '@/tailwind.css';
import ChainManager from '@/LLM/ChainManager';
import { LangChainParams, SetChainOptions } from '@/LLM/aiParams';
import EncryptionService from '@/utils/encryptionService';
import { ProxyServer } from '@/proxyServer';
import { Deck } from './sr/Deck';
import { DeckIterator } from './sr/DeckIterator';
import MemoryManager from './memory/memoryManager';

export default class SRPlugin extends Plugin {
	settings: SRSettings;
	chatIsVisible = false;
	activateViewPromise: Promise<void> | null = null;
	chainManager: ChainManager;
	proxyServer: ProxyServer;
	memoryManager: MemoryManager;

	deckTree: Deck;
	deckIterator: DeckIterator;

	async onload(): Promise<void> {
		
		await this.loadSettings();
		this.addSettingTab(new SRSettingTab(this.app, this));
		this.proxyServer = new ProxyServer(PROXY_SERVER_PORT);
		this.deckTree = new Deck("", this.app.vault, null);
		this.deckIterator = new DeckIterator(this.deckTree);
		this.memoryManager = new MemoryManager(this.app.vault)
		
		const langChainParams = this.getChainManagerParams();
		this.chainManager = new ChainManager(
			langChainParams
		);

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
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			this.toggleView(ViewTypes.CHAT);
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SRSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		// Get list of files in vault
		this.getFilesInVault();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.settings = EncryptionService.encryptAllKeys(this.settings);
		const langChainParams = this.getChainManagerParams();
		this.chainManager.resetParams(langChainParams);
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

	getChainManagerParams(): LangChainParams {
		const {
			defaultModel,
			defaultModelDisplayName,
			openAIApiKey,
			anthropicApiKey,
			googleApiKey
		} = this.settings;
		return {
			model: defaultModel,
			modelDisplayName: defaultModelDisplayName,
			temperature: 0.1,
			maxTokens: 3000,
			chatContextTurns: 15,
			openAIApiKey,
			anthropicApiKey,
			googleApiKey,
			systemMessage: DEFAULT_SYSTEM_PROMPT,
			options: { forceNewCreation: true } as SetChainOptions,
		};
	}

	async getFilesInVault() {
		const files = this.app.vault.getFiles();
		console.log("DEBUG-Athena", files)
		files.sort((a, b) => b.stat.mtime - a.stat.mtime);
		return files;
	}	
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
