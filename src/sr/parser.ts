import { CardType } from "./qa";

export class ParsedQAInfo {
  cardType: CardType;
  text: string;

  // Line numbers start at 0
  firstLineNum: number;
  lastLineNum: number;

  constructor(cardType: CardType, text: string, firstLineNum: number, lastLineNum: number) {
      this.cardType = cardType;
      this.text = text;
      this.firstLineNum = firstLineNum;
      this.lastLineNum = lastLineNum;
  }

  isQuestionLineNum(lineNum: number): boolean {
      return lineNum >= this.firstLineNum && lineNum <= this.lastLineNum;
  }
}
