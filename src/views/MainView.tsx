import { ItemView, WorkspaceLeaf } from "obsidian";
import SRPlugin from '@/main';
import { ViewType, SubviewType } from "../constants";
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import Chat from "../components/Chat";
import NavBar from '@/components/NavBar';
import Review from '@/components/Review';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { ChatMessage } from "@/chatMessage";

export default class MainView extends ItemView {
  private root: Root | null = null;
  private plugin: SRPlugin;
  private messageHistory: ChatMessage[];
  
  constructor(leaf: WorkspaceLeaf, plugin: SRPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.messageHistory = [{ 
      userMessage: null,
      modifiedMessage: null,
      aiString: null,
      aiEntries: null
    }];
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
    const MainContent: React.FC = () => {
      const messageHistoryHook = useMessageHistory(this.messageHistory);
      this.messageHistory = messageHistoryHook.messageHistory;
      const [subviewType, setSubviewType] = React.useState(this.plugin.subviewType);

      return (
        <div className='learn-plugin'>
          <NavBar 
            currentSubview={subviewType}
            changeSubview={(subview: SubviewType) => {
              this.plugin.subviewType = subview;
              setSubviewType(subview);
            }}
          />
          {this.plugin.subviewType === SubviewType.CHAT && (
            <Chat
              plugin={this.plugin}
              messageHistoryHook={messageHistoryHook}
            />
          )}
          {this.plugin.subviewType === SubviewType.REVIEW && (
            <Review
              plugin={this.plugin}
            />
          )}
        </div>
      );
    };

    return <MainContent />;
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