import { App, Editor, MarkdownView, Modal, Plugin, WorkspaceLeaf} from 'obsidian';
import { CHAT_VIEWTYPE, DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT, PROXY_SERVER_PORT } from '@/constants';
import ChatView from '@/components/ChatView';
import { SRSettingTab, SRSettings } from '@/components/SettingsPage';
import '@/tailwind.css';
import ChainManager from '@/LLM/chainManager';
import { LangChainParams, SetChainOptions } from '@/aiParams';
import EncryptionService from '@/encryptionService';
import { ProxyServer } from '@/proxyServer';
import SharedState from '@/sharedState';

export default class SRPlugin extends Plugin {
	settings: SRSettings;
	sharedState: SharedState;
	chatIsVisible = false;
	activateViewPromise: Promise<void> | null = null;
	chainManager: ChainManager;
	encryptionService: EncryptionService;
	proxyServer: ProxyServer;

	async onload(): Promise<void> {
		
		await this.loadSettings();
		this.addSettingTab(new SRSettingTab(this.app, this));
		this.proxyServer = new ProxyServer(PROXY_SERVER_PORT);
		this.sharedState = new SharedState();
		const langChainParams = this.getChainManagerParams();
		this.encryptionService = new EncryptionService(this.settings);

		this.chainManager = new ChainManager(
			this.app,
			langChainParams,
			this.encryptionService,
			this.settings
		);

		await this.saveSettings();

		this.addCommand({
			id: "chat-toggle-window",
			name: "Toggle Copilot Chat Window",
			callback: () => {
			this.toggleView();
			},
		});

		this.registerView(
			CHAT_VIEWTYPE,
			(leaf: WorkspaceLeaf) => new ChatView(leaf, this),
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			this.toggleView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

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
		this.encryptionService.encryptAllKeys();
		await this.saveData(this.settings);
	}

	toggleView() {
		const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE);
		leaves.length > 0 ? this.deactivateView() : this.activateView();
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(CHAT_VIEWTYPE);
		this.activateViewPromise = this.app.workspace
		.getRightLeaf(false)!
		.setViewState({
			type: CHAT_VIEWTYPE,
			active: true,
		});
		await this.activateViewPromise;
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0],
		);
		this.chatIsVisible = true;
	}
	
	async deactivateView() {
		this.app.workspace.detachLeavesOfType(CHAT_VIEWTYPE);
		this.chatIsVisible = false;
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
