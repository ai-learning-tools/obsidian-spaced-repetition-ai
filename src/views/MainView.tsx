import { ItemView, WorkspaceLeaf } from "obsidian";
import SRPlugin from '@/main';
import { ViewType, SubviewType } from "../constants";
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import Chat from "../components/Chat";
import NavBar from '@/components/NavBar';
import Review from '@/components/Review';

export default class MainView extends ItemView {
  private root: Root | null = null;
  
  constructor(leaf: WorkspaceLeaf, private plugin: SRPlugin) {
    super(leaf);
    this.plugin = plugin;
  }
  
  getViewType(): string {
    return ViewType.MAIN;
  }

  getIcon(): string {
    return 'documents';
  }

  getTitle(): string {
    return 'Notes to Flashcards';
  }

  getDisplayText(): string {
    return 'Notes to Flashcards';
  }

  renderContent(): React.ReactNode {
    return (
      <div className='learn-plugin'>
        <NavBar 
          currentSubview={this.plugin.subviewType}
          changeSubview={(subview: SubviewType) => {
            this.plugin.subviewType = subview;
            this.root?.render(this.renderContent());
          }}
        />
        {this.plugin.subviewType === SubviewType.CHAT && (
          <Chat
            plugin={this.plugin}
          />
        )}
        {this.plugin.subviewType === SubviewType.REVIEW && (
          <Review
            plugin={this.plugin}
          />
        )}
      </div>
    );
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <React.StrictMode>
        {this.renderContent()}
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
    }
  }

}