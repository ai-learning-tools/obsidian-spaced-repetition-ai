import { Editor, TFile, Vault, MarkdownView, App } from "obsidian";
import { EntryItemGeneration } from "@/constants";

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
