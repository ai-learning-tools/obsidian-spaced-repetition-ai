
import { ViewTypes } from '@/constants';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import SRPlugin from '@/main';
import Chat from '@/components/Chat'
import ChainManager from '@/LLM/ChainManager';

export default class ChatView extends ItemView {
  private chainManager: ChainManager;
  private debug = true;

  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: SRPlugin) {
    super(leaf);
    this.plugin = plugin;
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

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <React.StrictMode>
        <Chat 
          plugin={this.plugin}
          chainManager={this.chainManager}
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
