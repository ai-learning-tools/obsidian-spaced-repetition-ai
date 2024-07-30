
import { ViewTypes } from '@/constants';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import SRPlugin from '@/main';
import ChatSegment from '@/components/ChatSegment'
import SharedState from '@/sharedState';
import ChainManager from '@/LLM/chainManager';
import { SRSettings } from './SettingsPage';

export default class ChatView extends ItemView {
  private sharedState: SharedState;
  private chainManager: ChainManager;
  private debug = true;

  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: SRPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.sharedState = plugin.sharedState;
    this.chainManager = plugin.chainManager;
  }

  getViewType(): string {
    return ViewTypes.CHAT;
  }

// Return an icon for this view
  getIcon(): string {
    return 'message-square';
  }

  // Return a title for this view
  getTitle(): string {
    return 'Learning Chat';
  }

  getDisplayText(): string {
    return 'Learn';
  }

  async getChatVisibility(){
    // if (this.plugin.activateViewPromise) {
    //   await this.plugin.activateViewPromise;
    // }
    return this.plugin.chatIsVisible;
  }

  getFilesInVault() {
    return this.plugin.getFilesInVault
  }

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <React.StrictMode>
        <ChatSegment 
        plugin={this.plugin}
        sharedState={this.sharedState}
        chainManager={this.chainManager}
        debug={this.debug}
        />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
    }
  }
}
