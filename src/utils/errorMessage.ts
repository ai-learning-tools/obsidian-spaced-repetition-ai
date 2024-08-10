import { Notice } from "obsidian";

export const errorMessage = (msg: string) => {
  new Notice(msg);
  console.error(msg);
}