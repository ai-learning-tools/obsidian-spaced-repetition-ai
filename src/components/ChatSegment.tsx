import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChatModels, ChatModelDisplayNames } from '@/constants';
import SRPlugin from '@/main';
import { TFile } from 'obsidian';
import { MentionsInput, Mention } from 'react-mentions';
import defaultStyle from '@/components/defaultStyle';

interface ChatSegmentProps {
  plugin: SRPlugin;
}
let container: HTMLDivElement | null
const ChatSegment: React.FC<ChatSegmentProps> = ({ plugin }) => {
  const [message, setMessage] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(ChatModels.GPT_35_TURBO);
  const [files, setFiles] = useState<TFile[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      <div>
        <MentionsInput
          value={message}
          onChange={(e, newValue) => setMessage(newValue)}
          className="w-full resize-none p-2 height-auto overflow-hidden"
          placeholder="Type your message"
          suggestionsPortalHost={containerRef.current}
          // style={defaultStyle}
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
      <div
        id="suggestionPortal"
        className="flex border-2 h-40"
        ref={containerRef}
      ></div>
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
  // return (
  //   <div
  //     id="suggestionPortal"
  //     style={{
  //       height: '400px',
  //     }}
  //     ref={el => {
  //       container = el
  //     }}
  //   >
  //     <h3>Bottom guard example</h3>
  //     <p>
  //       Note that the bottom input will open the suggestions list above the
  //       cursor.
  //       Also, the middle one will render its suggestions always on top,
  //       even if it has enough space below.
  //     </p>
  //     <div
  //       style={{
  //         position: 'absolute',
  //         height: '300px',
  //         width: '400px',
  //         overflow: 'auto',
  //         border: '1px solid green',
  //         padding: '8px',
  //       }}
  //     >
  //       <MentionsInput
  //         value={message}
  //         onChange={(e, newValue) => setMessage(newValue)}
  //         style={defaultStyle}
  //         placeholder={"Mention people using '@'"}
  //         a11ySuggestionsListLabel={"Suggested mentions"}
  //         suggestionsPortalHost={container}
  //         allowSuggestionsAboveCursor={true}
  //       >
  //         <Mention data={files.map((file) => ({ id: file.path, display: file.name }))} />
  //       </MentionsInput>
 
  //     </div>
  //     <div
  //     style={{
  //       position: "fixed",
  //       left: "240px",
  //       top: "204.266px",
  //       zIndex: 1,
  //       backgroundColor: "white",
  //       marginTop: "14px",
  //       minWidth: "100px"
  //     }}
  //   >
  //     <ul
  //       id="6c54358d62601"
  //       role="listbox"
  //       aria-label="Suggested mentions"
  //       style={{
  //         margin: 0,
  //         padding: 0,
  //         listStyleType: "none",
  //         backgroundColor: "white",
  //         border: "1px solid rgba(0, 0, 0, 0.15)",
  //         fontSize: "14px"
  //       }}
  //     >
  //       <li
  //         id="6c54358d62601-0"
  //         role="option"
  //         aria-selected="true"
  //         style={{
  //           cursor: "pointer",
  //           padding: "5px 15px",
  //           borderBottom: "1px solid rgba(0, 0, 0, 0.15)",
  //           backgroundColor: "rgb(206, 228, 229)"
  //         }}
  //       >
  //         <span>
  //           <b></b>Hello.md
  //         </span>
  //       </li>
  //       <li
  //         id="6c54358d62601-1"
  //         role="option"
  //         aria-selected="false"
  //         style={{
  //           cursor: "pointer",
  //           padding: "5px 15px",
  //           borderBottom: "1px solid rgba(0, 0, 0, 0.15)"
  //         }}
  //       >
  //         <span>
  //           <b></b>Test.md
  //         </span>
  //       </li>
  //       <li
  //         id="6c54358d62601-2"
  //         role="option"
  //         aria-selected="false"
  //         style={{
  //           cursor: "pointer",
  //           padding: "5px 15px",
  //           borderBottom: "1px solid rgba(0, 0, 0, 0.15)"
  //         }}
  //       >
  //         <span>
  //           <b></b>Welcome.md
  //         </span>
  //       </li>
  //     </ul>
  //   </div>
  //   </div>
  // )
};

export default ChatSegment;
