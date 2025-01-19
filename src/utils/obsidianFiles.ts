import { TFile, Vault, Plugin } from "obsidian";
import { EntryItemGeneration } from "@/constants";
import { errorMessage } from "./errorMessage";
import { FRONT_CARD_REGEX, BACK_CARD_REGEX } from "@/constants";
import { Entry } from "@/fsrs";
import { DIRECTORY } from "@/constants";
import { EntryType } from "@/fsrs/models";

export async function getFilteredFiles(
  vault: Vault
): Promise<TFile[]> {
  const files = vault.getFiles();
  const filteredFiles = files.filter(file => !file.path.startsWith(DIRECTORY));
  filteredFiles.sort((a, b) => b.stat.mtime - a.stat.mtime);
  return filteredFiles;
}

export async function getFileContent(
  file: TFile,
  vault: Vault,
): Promise<string | null> {
  try {
    return await vault.cachedRead(file); // faster performance
  } catch (error) {
    errorMessage(error);
    return null;
  }
}

// Currently appends to end of file
export async function writeCardtoFile(entry: EntryItemGeneration, file: TFile, plugin: Plugin) {
  if (entry.front && entry.back) {
    const { front, back } = entry;
    // Check if either front or back are multiline
    const isMultiline = front.includes('\n') || back.includes('\n');

    let card;
    if (isMultiline) { 
      const multilineSeparator = plugin.settings.multilineSeparator;
      card = `\n\n${front}\n${multilineSeparator}\n${back}\n\n`
    } else {
      const inlineSeparator = plugin.settings.inlineSeparator;
      card = `\n\n${front} ${inlineSeparator} ${back}\n\n`
    }

    await plugin.app.vault.append(
      file,
      card
    );
  }
}

export async function writeIdToCardInFile(vault: Vault, entry: Entry, separator: string) {
  try {
    const file = vault.getAbstractFileByPath(entry.path) as TFile;
    if (!file) {
      console.error(`File not found at path: ${entry.path}`);
      return;
    }

    // console.log('to add', entry.id, entry.lineToAddId, entry.path, entry.front, entry.back)

    const content = await vault.read(file);
    const lines = content.split('\n');
    if (entry.lineToAddId !== undefined) {
      const separatorWithId = `[[SR/memory/${entry.id}.md|${separator}]]`
      if (entry.entryType == EntryType.Multiline) {
        lines[entry.lineToAddId] = separatorWithId;
      } else {
        lines[entry.lineToAddId] = lines[entry.lineToAddId].replace(separator, separatorWithId);
      }
      const updatedContent = lines.join('\n');
      await vault.modify(file, updatedContent);
    } else {
      console.error(`Error: lineToAddId is undefined for entry with id ${entry.id} in file at path ${entry.path}`);
    }
    
  } catch (e) {
    console.error(`Error writing ID to card in file at path ${entry.path}: ${e}`);
  }
}

export async function getFileCards(file: TFile, vault: Vault): Promise<EntryItemGeneration[]> {
  try {
    const content = await getFileContent(file, vault);
    if (!content) return [];

    const cards: EntryItemGeneration[] = [];
    let frontMatch;
    while ((frontMatch = FRONT_CARD_REGEX.exec(content)) !== null) {
      const [, front] = frontMatch;
      const backMatch = BACK_CARD_REGEX.exec(content.slice(frontMatch.index + frontMatch[0].length));
      if (backMatch) {
        const [, back] = backMatch;
        cards.push({
          front: front.trim().replace(/<br>/g, '\n'), // Replace <br> with newlines in front
          back: back.trim().replace(/^\s*>\s*/gm, '').trim() // Remove leading '> ' and trim each line
        });
        // Reset lastIndex of BACK_CARD_REGEX
        BACK_CARD_REGEX.lastIndex = 0;
        // Move the lastIndex of FRONT_CARD_REGEX to after the back content
        FRONT_CARD_REGEX.lastIndex = frontMatch.index + frontMatch[0].length + backMatch[0].length;
      }
    }

    return cards;

  } catch (e) {
    errorMessage(`Error getting flashcards from file ${file.name}: ${e}`);
  }
  return [];
}