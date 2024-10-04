import { useState, useEffect } from 'react';
import { TFile } from 'obsidian';
import { EntryItemGeneration } from '@/constants';

export function useMessageContext(files: TFile[], activeFileCards: EntryItemGeneration[], activeFile: TFile | null, includeCurrentFile: boolean) {
  const [mentionedFiles, setMentionedFiles] = useState<TFile[]>(() => {
    if (includeCurrentFile && activeFile) {
      return [activeFile];
    }
    return [];
  });
  const [mentionedCards, setMentionedCards] = useState<EntryItemGeneration[]>([]);
  const [remainingActiveCards, setRemainingActiveCards] = useState<EntryItemGeneration[]>(activeFileCards);

  useEffect(() => {
    const newRemainingCards = activeFileCards.filter(card => 
      !mentionedCards.some(mentionedCard => mentionedCard.front === card.front)
    );
    setRemainingActiveCards(newRemainingCards);
  }, [activeFileCards, mentionedCards]);

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

  const handleCardAdd = (id: string) => {
    if (!activeFileCards) return;
    const mentionedCard = activeFileCards.find(card => card.front === id);
    if (mentionedCard && !mentionedCards.includes(mentionedCard)) {
      setMentionedCards(prevCards => [...prevCards, mentionedCard]);
      setRemainingActiveCards(prevCards => prevCards.filter(card => card.front !== id));
    }
  };

  const removeFile = (index: number) => {
    setMentionedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const removeCard = (index: number) => {
    const removedCard = mentionedCards[index];
    setMentionedCards(prevCards => prevCards.filter((_, i) => i !== index));
    if (removedCard) {
      setRemainingActiveCards(prevCards => [...prevCards, removedCard]);
    }
  };

  return {
    mentionedFiles,
    mentionedCards,
    remainingActiveCards,
    handleFileAdd,
    handleCardAdd,
    removeFile,
    removeCard,
  };
}
