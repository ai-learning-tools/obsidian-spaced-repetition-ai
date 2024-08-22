import { ItemView, WorkspaceLeaf } from 'obsidian';
import { ViewTypes } from '@/constants';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import SRPlugin from '@/main';
import MemoryManager from '@/memory/memoryManager';
import { DeckManager } from '@/fsrs/Deck';

export default class ReviewView extends ItemView {
  private memoryManager: MemoryManager;
  private deckManager: DeckManager;

  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: SRPlugin) {
      super(leaf);
      this.plugin = plugin;
      this.memoryManager = plugin.memoryManager;
      this.deckManager = plugin.deckManager;
  }

  async onload(): Promise<void> {
    // TODO: move this else where
  }

  getViewType(): string {
    return ViewTypes.REVIEW;
  }

  getIcon(): string {
    return 'message-square';
  }

  getTitle(): string {
    return 'Review cards'
  }

  getDisplayText(): string {
    return 'Review';
  }

  toggleAnswer(): void {
    if (document.getElementById('answer')?.hasClass('hidden')) {
      document.getElementById('answer')?.removeClass('hidden');
    } else {
      document.getElementById('answer')?.addClass('hidden');
    }
  }

  async onOpen(): Promise<void> {
    await this.deckManager.populateDecks()
    const root = createRoot(this.containerEl.children[1]);
    if (this.deckManager.decks.length) {
      root.render(   
        <React.StrictMode>
          <div>
          {
           this.deckManager.decks[0].cards.map(card => 
            <div>{card.id}</div>
           )
          }
          </div>
        </React.StrictMode>
      )
    } else {
      root.render(
        <React.StrictMode>
          <div>Add some cards man</div>
        </React.StrictMode>
      )
    }
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
    }
  }
}