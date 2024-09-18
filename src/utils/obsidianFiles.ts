import { Editor, TFile, Vault, MarkdownView, App } from "obsidian";
import { EntryItemGeneration } from "@/constants";
import { errorMessage } from "./errorMessage";
import { FRONT_CARD_REGEX, BACK_CARD_REGEX } from "@/constants";

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
export async function writeCardtoFile(entry: EntryItemGeneration, file: TFile, vault: Vault) {
  if (entry.front && entry.back) {
    const frontWithLineBreaks = entry.front.replace(/\n/g, '<br>');
    const backWithLineBreaks = entry.back.replace(/\n/g, '\n> ');
    
    const card = `
  > [!card]+ ${frontWithLineBreaks}
  > ${backWithLineBreaks}
  `;
    
    await vault.append(
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