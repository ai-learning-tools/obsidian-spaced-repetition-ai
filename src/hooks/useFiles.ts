import { useState, useEffect } from 'react';
import { TFile } from 'obsidian';

export function useFiles(files: TFile[], activeFile: TFile | null, includeCurrentFile: boolean) {
  const [mentionedFiles, setMentionedFiles] = useState<TFile[]>(() => {
    if (includeCurrentFile && activeFile) {
      return [activeFile];
    }
    return [];
  });

  useEffect(() => {
    if (includeCurrentFile && activeFile) {
      setMentionedFiles(prevFiles => {
        const filteredFiles = prevFiles.filter(file => file.path !== activeFile.path);
        return [...filteredFiles, activeFile];
      });
    } else {
      setMentionedFiles(prevFiles => prevFiles.filter(file => file.path !== activeFile?.path));
    }
  }, [activeFile, includeCurrentFile]);

  const handleFileAdd = (id: string) => {
    const mentionedFile = files.find(file => file.path === id);
    if (mentionedFile && !mentionedFiles.some(file => file.path === mentionedFile.path)) {
      setMentionedFiles(prevFiles => [...prevFiles, mentionedFile]);
    }
  };

  const removeFile = (index: number) => {
    setMentionedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  return {
    mentionedFiles,
    handleFileAdd,
    removeFile,
  };
}
