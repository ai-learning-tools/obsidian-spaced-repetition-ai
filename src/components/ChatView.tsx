
import { CHAT_VIEWTYPE } from '@/constants';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import SRPlugin from `@/main`;


export default class CopilotView extends ItemView {
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: SRPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return CHAT_VIEWTYPE;
  }

// Return an icon for this view
  getIcon(): string {
    return 'message-square';
  }

  // Return a title for this view
  getTitle(): string {
    return 'Copilot Chat';
  }

  getDisplayText(): string {
    return 'Copilot';
  }

  async getChatVisibility(){
    // if (this.plugin.activateViewPromise) {
    //   await this.plugin.activateViewPromise;
    // }
    return this.plugin.isChatVisible();
  }

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <React.StrictMode>
        <div>
          <h1>Chat here</h1>
          <p>Chat with AI assitant for card generation</p>
        </div>
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
    }
  }
}
