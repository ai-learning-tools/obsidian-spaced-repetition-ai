import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChatModels, ChatModelDisplayNames } from '@/constants';
import SRPlugin from '@/main';
import { TFile } from 'obsidian';
import { MentionsInput, Mention } from 'react-mentions';
import defaultStyle from '@/components/defaultStyle'

interface ChatSegmentProps {
  plugin: SRPlugin;
}

let container: HTMLDivElement | null

const ChatSegment: React.FC<ChatSegmentProps> = ({ plugin }) => {
  const [message, setMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(ChatModels.GPT_35_TURBO);
  const [files, setFiles] = useState<TFile[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const filesInVault = await plugin.getFilesInVault();
      setFiles(filesInVault);
      console.log('DEBUG-Athena2', filesInVault);
    };
    fetchFiles();
  }, [plugin]);

  return (
    <div className="w-full flex flex-col">
      <div
      >
        <MentionsInput
          value={message}
          onChange={(e, newValue) => setMessage(newValue)}
          className="w-full resize-none p-2 height-auto overflow-hidden"
          placeholder="Type your message"
          suggestionsPortalHost={container}
          style={defaultStyle}
        >
          <Mention
            trigger="@"
            data={files.map((file) => ({ id: file.path, display: file.name }))}
            appendSpaceOnAdd={true}
            style={defaultStyle}
            markup="@[__display__](__id__)"
            displayTransform={(id, display) => `@${display}`}
          />
        </MentionsInput>
        </div>
        <div className="flex flex-row align-center justify-start space-x-4 text-gray-400">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-center"
            style={{ width: `${selectedModel.length}ch` }}
          >
            {Object.entries(ChatModelDisplayNames).map(([key, displayName]) => (
              <option key={key} value={key}>
                {displayName}
              </option>
            ))}
          </select>
          <p>/ Command</p>
          <p>@ Mention</p>
        </div>

        <select className="w-full">
          <option key={'A'} value={'B'}>
            B
          </option>
        </select>
      <div id="suggestionPortal" className="border-2 h-40" ref={ el => { container = el }} style={{ position: 'relative', zIndex: 1000 }}></div>
      <div>
        <p>Using</p>
        <p>current file</p>
      </div>
      <div>
        <p>Generating...</p>
      </div>
      <div>
        <h3>Files in Vault:</h3>
        <ul>
          {files.map((file) => (
            <li key={file.path}>{file.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChatSegment;

