import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChatModels, ChatModelDisplayNames } from '@/constants';
import SRPlugin from '@/main';
import { TFile } from 'obsidian';
import defaultStyle from '@/components/defaultStyle';
import MentionsInput from '@/components/mentions/MentionsInput';
import Mention from '@/components/mentions/Mention'; // Fixed import path

interface ChatSegmentProps {
  plugin: SRPlugin;
}

const ChatSegment: React.FC<ChatSegmentProps> = ({ plugin }) => {
  const [message, setMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(ChatModels.GPT_35_TURBO);
  const [files, setFiles] = useState<TFile[]>([]);
  const [mentionedFiles, setMentionedFiles] = useState<TFile[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      const filesInVault = await plugin.getFilesInVault();
      setFiles(filesInVault);
      console.log('DEBUG-Athena', "files in vault", filesInVault);
    };
    fetchFiles();
  }, [plugin]);

  const handleMentionAdd = (id: string) => {
    const mentionedFile = files.find(file => file.path === id);
    if (mentionedFile && !mentionedFiles.includes(mentionedFile)) {
      setMentionedFiles([...mentionedFiles, mentionedFile]);
    }
  };

  const handleMentionsChange = (e: any, newValue: string) => {
    setMessage(newValue);
    const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
    const newMentionedFiles: TFile[] = [];
    let match;
    while ((match = mentionRegex.exec(newValue)) !== null) {
      console.log(match)
      const mentionedFile = files.find(file => file.path === match[2]);
      if (mentionedFile) {
        newMentionedFiles.push(mentionedFile);
      }
    }
    setMentionedFiles(newMentionedFiles);
  };

  return (
    <div className="w-full flex flex-col">
      <div>
        <MentionsInput
          value={message}
          onChange={handleMentionsChange}
          className="w-full resize-none p-2 height-auto overflow-hidden"
          placeholder="Type your message"
          suggestionsPortalHost={containerRef.current}
        >
          <Mention
            trigger="@"
            data={files.map((file) => ({ id: file.path, display: file.path }))}
            appendSpaceOnAdd={true}
            style={defaultStyle}
            markup="@[__display__](__id__)"
            displayTransform={(id, display) => `@${display}`}
            onAdd={(id) => handleMentionAdd(id)}
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

      <div
        id="suggestionPortal"
        className="flex"
        ref={containerRef}
        style={{ height: 'auto' }}
      ></div>
      
      {
        mentionedFiles.length > 0 && 
        <div>
        <p>Using:</p>
          <ul>
            {mentionedFiles.map(file => (
              <li key={file.path}>{file.path}</li>
            ))}
          </ul>
        </div>
      }

    </div>
  );
};

export default ChatSegment;
