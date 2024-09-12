import { Editor, TFile, Vault, MarkdownView, App } from "obsidian";
import { EntryItemGeneration } from "@/constants";
import { errorMessage } from "./errorMessage";

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

export async function getFileCards(file: TFile, vault: Vault): Promise<EntryItemGeneration[]> {
  try {
    // const content = await getFileContent(file, vault);
    // TODO @belindamo: retrieve card using regex. 
    return [{
      front: 'This is the front',
      back: 'This is the back'
    }];

  } catch (e) {
    errorMessage(`Error getting flashcards from file ${file.name}: ${e}`);
  }
  return [];
}