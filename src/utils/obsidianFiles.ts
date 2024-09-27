import { TFile, Vault, Plugin } from "obsidian";
import { EntryItemGeneration } from "@/constants";
import { errorMessage } from "./errorMessage";
import { FRONT_CARD_REGEX, BACK_CARD_REGEX } from "@/constants";
import { Entry } from "@/fsrs";

export async function getSortedFiles(
  vault: Vault
): Promise<TFile[]> {
  const files = vault.getFiles();
  files.sort((a, b) => b.stat.mtime - a.stat.mtime);
  return files;
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

export async function writeIdToCardInFile(vault: Vault, entry: Entry, id: string) {
  try {
    const file = vault.getAbstractFileByPath(entry.path) as TFile;
    if (!file) {
      console.error(`File not found at path: ${entry.path}`);
      return;
    }

    const content = await vault.read(file);
    const entryRegex = /(?:^|\n{2,})([^\n](?:(?!\n{2,})[\s\S])*?)\n\?\n([^\n](?:(?!\n{2,})[\s\S])*?)(?:\n<!--LEARN:(.*?)-->)?(?=(?:\n{2,})|\n$|$)/g;

    let match;
    while ((match = entryRegex.exec(content)) !== null) {
      const [fullMatch, front, back, matchedID] = match;

      if (
        front.trim() == entry.front.trim()
        && back.trim() == entry.back.trim() 
        && matchedID == undefined
      ) {
        const newCard = `${fullMatch}\n<!--LEARN:${id}-->`
        const updatedContent = content.replace(fullMatch, newCard);
        await vault.modify(file, updatedContent)
        return;
      }
    }

    console.error(`No matching card was found for entry: ${entry}`)
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