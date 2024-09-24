import { TFile, Vault, Plugin } from "obsidian";
import { EntryItemGeneration } from "@/constants";
import { errorMessage } from "./errorMessage";
import { FRONT_CARD_REGEX, BACK_CARD_REGEX } from "@/constants";
import { DIRECTORY } from "@/constants";

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
  if (file.extension != "md") return null;
  return await vault.cachedRead(file);
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