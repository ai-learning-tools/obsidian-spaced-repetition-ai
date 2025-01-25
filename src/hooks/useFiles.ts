import { useState, useEffect } from 'react';
import { TFile } from 'obsidian';

export function useFiles(files: TFile[], activeFile: TFile | null, includeCurrentFile: boolean) {
  // Track files and their source (auto-included vs manually added)
  const [mentionedFiles, setMentionedFiles] = useState<Array<{
    file: TFile;
    isAutoIncluded: boolean;
  }>>([]);

  useEffect(() => {
    if (includeCurrentFile && activeFile) {
      setMentionedFiles(prevFiles => {
        // Keep only manually added files
        const manuallyAddedFiles = prevFiles.filter(entry => !entry.isAutoIncluded);
        
        // Add the new active file as auto-included
        return [...manuallyAddedFiles, { file: activeFile, isAutoIncluded: true }];
      });
    } else {
      // Remove any auto-included files
      setMentionedFiles(prevFiles => prevFiles.filter(entry => !entry.isAutoIncluded));
    }
  }, [activeFile, includeCurrentFile]);

  const handleFileAdd = (id: string) => {
    const fileToAdd = files.find(file => file.path === id);
    if (fileToAdd && !mentionedFiles.some(entry => 
      entry.file.path === fileToAdd.path
    )) {
      setMentionedFiles(prevFiles => [...prevFiles, { file: fileToAdd, isAutoIncluded: false }]);
    }
  };

  const removeFile = (index: number) => {
    setMentionedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  return {
    mentionedFiles: mentionedFiles.map(entry => entry.file),
    handleFileAdd,
    removeFile,
  };
}
