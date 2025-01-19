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
    return 'Spaced Repetition AI';
  }

  getDisplayText(): string {
    return 'Spaced Repetition AI';
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
          {/* Instead of conditionally rendering/unmounting, 
            we mount both components but hide one with CSS. 
            This prevents us unnecessary mounting and unmounting    
        */}
        
        {/* CHAT subview */}
        <div
          className="mt-8 mx-auto max-w-[768px]"
          style={{
            display: this.plugin.subviewType === SubviewType.CHAT ? "block" : "none",
          }}
        >
          <Chat plugin={this.plugin} messageHistoryHook={messageHistoryHook}/>
        </div>

        {/* REVIEW subview */}
        <div
          className="mt-8 mx-auto max-w-[768px]"
          style={{
            display: this.plugin.subviewType === SubviewType.REVIEW ? "block" : "none",
          }}
        >
          <Review plugin={this.plugin} />
        </div>
        </div>
      );
    }

    return <MainContent/>
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
