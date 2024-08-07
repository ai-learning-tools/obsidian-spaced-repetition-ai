import { TFile, Vault } from "obsidian";

export function extractNoteTitles(query: string): string[] {
  // Use a regular expression to extract note titles wrapped in [[]]
  const regex = /\[\[(.*?)\]\]/g;
  const matches = query.match(regex);
  const uniqueTitles = new Set(
    matches ? matches.map((match) => match.slice(2, -2)) : []
  );
  return Array.from(uniqueTitles);
}

export async function getNoteFileFromTitle(
  vault: Vault,
  noteTitle: string,
): Promise<TFile | null> {
  // Get all markdown files in the vault
  const files = vault.getMarkdownFiles();

  for (const file of files) {
    const title = file.basename;
    if (title === noteTitle) {
      return file;
    }
  }
  return null;
}

export async function getFileContent(
  file: TFile,
  vault: Vault,
): Promise<string | null> {
  if (file.extension != "md") return null;
  return await vault.cachedRead(file);
}