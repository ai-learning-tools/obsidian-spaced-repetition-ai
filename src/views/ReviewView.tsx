import { ItemView, WorkspaceLeaf } from 'obsidian';
import { ViewTypes } from '@/constants';
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import SRPlugin from '@/main';
import MemoryManager from '@/memory/memoryManager';
import { DeckManager, Deck } from '@/fsrs/Deck';
import DeckDisplay from '@/components/DeckDisplay'
import { DeckMetaData, State } from '@/fsrs';
import NewDeckModel from '@/components/NewDeckModal';

export default class ReviewView extends ItemView {
  private memoryManager: MemoryManager;
  private deckManager: DeckManager;

  private root: Root | null = null;
  private selectedDeck: Deck | null = null;
  private isSyncing = false;

  constructor(leaf: WorkspaceLeaf, private plugin: SRPlugin) {
      super(leaf);
      this.plugin = plugin;
      this.memoryManager = plugin.memoryManager;
      this.deckManager = plugin.deckManager;
      this.navigation = false; // Set navigation to true
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
    await this.deckManager.syncMemoryWithNotes()
    await this.deckManager.populateDecks()
    const root = createRoot(this.containerEl.children[1]);
    this.root = root;
    this.renderDeckSelection();
  }

  async refresh(): Promise<void> {
    this.isSyncing = true;
    this.renderDeckSelection();
    await this.deckManager.syncMemoryWithNotes();
    await this.deckManager.populateDecks();
    this.isSyncing = false;
    this.renderDeckSelection();
  }

  addDeck(): void {
    const onDeckSubmit = async (metaData: DeckMetaData) => {
      this.memoryManager.addDeck(metaData)
      await this.refresh()
    }
    new NewDeckModel(this.app, onDeckSubmit).open()

  }

  renderDeckSelection(): void {
    if (this.deckManager.decks.length) {
      this.root?.render(   
        <React.StrictMode>
          <div className='flex flex-col'>
          <div className='flex flex-col bg-white border border-gray-300 w-full px-10 py-6 rounded-md'>
            <div className='grid grid-cols-5 gap-4 mb-4 font-semibold text-lg px-2'>
              <p className="col-span-2">Deck</p>
              <div className="text-center">New</div>
              <div className="text-center">Learn</div>
              <div className="text-center">Due</div>
            </div>
            {
              this.deckManager.decks.map(deck => {
                const count = deck.getCountForStates()
                const due = deck.getDue()



                return (
                  <div className='grid grid-cols-5 gap-4 bg-gray-100 rounded-lg p-2 mb-2'>
                  <p className="col-span-2 hover:underline"
                    onClick={() => {
                      this.showDeck(deck)
                    }}
                  >
                    {deck.name}
                  </p>
                  <p className="text-center">{count[State.New]}</p>
                  <p className="text-center">{count[State.Learning] + count[State.Relearning]}</p>
                  <p className="text-center">{due.length}</p>
                  </div>
                )
              })
            } 
            <div className="flex justify-end w-full pt-4 space-x-2">
              {this.isSyncing && <div className="spinner ml-2">Syncing</div>}
              <button className="p-2 flex items-center" onClick={this.refresh.bind(this)}>
                refresh
              </button>
              <button className="p-2" onClick={this.addDeck.bind(this)}>Add deck</button>
            </div>
          </div>
          </div>
        </React.StrictMode>
      )
    } else {
      this.root?.render(
        <React.StrictMode>
          <div>Add some cards man</div>
        </React.StrictMode>
      )
    }
  }

  showDeck(deck: Deck): void {
    this.selectedDeck = deck;
    this.root?.render(
      <React.StrictMode>
        <div>
          <button className="bg-indigo-400 m-2 p-2" onClick={() => this.renderDeckSelection()}>Back to Decks</button>
          <DeckDisplay className="flex w-full h-full flex-col justify-center" deck={deck}/>
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