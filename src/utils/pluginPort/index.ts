import { Vault, TFile, TFolder } from "obsidian";

const MULTI_SCHEDULING_EXTRACTOR = /!([\d-]+),(\d+),(\d+)/gm;
const LEGACY_SCHEDULING_EXTRACTOR = /<!--SR:([\d-]+),(\d+),(\d+)-->/gm;

export type OldScheduleInfo = {
  fullComment: string;
  dueDate: Date;
  ease: number;
  interval: number;
};

export const parseOldSRInfo = (text: string) => {

  let scheduling: RegExpMatchArray[] = [
    ...text.matchAll(MULTI_SCHEDULING_EXTRACTOR),
  ];
  if (scheduling.length === 0) {
    scheduling = [...text.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
  }
  console.log(scheduling)

  const result: OldScheduleInfo|{}[] = [];
  for (let i = 0; i < scheduling.length; i++) {
    const match: RegExpMatchArray = scheduling[i];
    const fullComment = match[0].startsWith('!') ? `!${match[1]},${match[2]},${match[3]}` : `<!--SR:${match[1]},${match[2]},${match[3]}-->`;
    const dueDateStr = match[1];
    const interval = parseInt(match[2]);
    const ease = parseInt(match[3]);
    const dueDate = new Date(dueDateStr);
    if (dueDate) {
      const info: OldScheduleInfo = {
        fullComment,
        dueDate,
        ease,
        interval
      }
      result.push(info);
    } 
  }
  return result;
}

export const removeAllOldInfo = (text: string) => {
  text = text.replace(/<!--SR:.*?-->/g, '')  // Remove legacy scheduling info
    .replace(/![\d-]+,\d+,\d+/g, '')  // Remove multi-scheduling info
  return text;
}


export function sm2EaseToFsrsDifficulty(ease: number, minEase = 130,
  maxEase = 400,
): number {

  // Clamp the ease value to the allowed range
  const clampedEase = Math.max(minEase, Math.min(ease, maxEase));
  
  // Normalize to 0-1 scale
  const normalized = (clampedEase - minEase) / (maxEase - minEase);
  
  // Invert (1 - normalized) because higher ease means lower difficulty
  const inverted = 1 - normalized;
  
  // Map to 1-10 scale
  const difficulty = 1 + (inverted * 9);
  
  return Number(difficulty.toFixed(1));
}

export async function countOldSRCards(vault: Vault): Promise<number> {
    let totalCount = 0;

    // Function to process each file
    const processFile = async (file: TFile) => {
        if (file.extension === 'md') {
            const content = await vault.read(file);
            const oldScheduleInfo = parseOldSRInfo(content);
            totalCount += oldScheduleInfo.length;
        }
    };

    // Recursively process all files in the vault
    const processFolder = async (folder: TFolder) => {
        for (const child of folder.children) {
            if (child instanceof TFile) {
                await processFile(child);
            } else if (child instanceof TFolder) {
                await processFolder(child);
            }
        }
    };

    // Start processing from the root folder
    await processFolder(vault.getRoot());

    return totalCount;
}


