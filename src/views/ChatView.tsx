
import { ViewTypes } from '@/constants';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import SRPlugin from '@/main';
import Chat from '@/components/Chat'
import AIManager from '@/llm/AIManager';

export default class ChatView extends ItemView {
  private aiManager: AIManager;

  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: SRPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.aiManager = plugin.aiManager;
  }

  getViewType(): string {
    return ViewTypes.CHAT;
  }

// Return an icon for this view
  getIcon(): string {
    return 'documents';
  }

  // Return a title for this view
  getTitle(): string {
    return 'Learning Chat';
  }

  getDisplayText(): string {
    return 'Learn';
  }

  async onOpen(): Promise<void> {
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <React.StrictMode>
        <Chat 
          plugin={this.plugin}
          aiManager={this.aiManager}
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
