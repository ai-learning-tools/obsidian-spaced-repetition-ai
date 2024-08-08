import { ItemView, WorkspaceLeaf } from 'obsidian';
import { ViewTypes } from '@/constants';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import SRPlugin from '@/main';
import { DeckIterator } from '@/sr/DeckIterator';
import { Deck } from '@/sr/Deck';

export default class ReviewView extends ItemView {
  private deckIterator: DeckIterator;
  private deckTree: Deck;

  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: SRPlugin) {
      super(leaf);
      this.plugin = plugin;
      this.deckTree = plugin.deckTree;
      this.deckIterator = plugin.deckIterator;
  }

  async onload(): Promise<void> {
    await this.deckTree.updateDeck();
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
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <React.StrictMode>
        <div onClick={this.toggleAnswer}>
          <div>Review</div>
          <p>question</p>
          <div id="answer" className='hidden'>
            <p>---</p>
            <p>answer</p>
          </div>
          <button>again</button>
          <button>hard</button>
          <button>good</button>
          <button>easy</button>
        </div>
      </React.StrictMode>
    )
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
    }
  }
}