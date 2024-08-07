export enum CardType {
  SingleLineBasic,
  SingleLineReversed,
  MultiLineBasic,
  MultiLineReversed,
  Cloze,
}
import { CardScheduleInfo, NoteCardScheduleParser } from './cardSchedule';
import { SRSettings } from '@/settings';
import { cyrb53 } from '@/utils/utils';
import { Note } from './note';
import { Card } from './card';
import { TopicPathList } from './topicPath';
import { 
  OBSIDIAN_BLOCK_ID_ENDOFLINE_REGEX,
  OBSIDIAN_TAG_AT_STARTOFLINE_REGEX,
  SR_HTML_COMMENT_BEGIN,
  SR_HTML_COMMENT_END,
} from '@/constants';
import { ParsedQAInfo } from './parser';
import { TopicPathWithWs, TopicPath } from './topicPath';
import { stringTrimStart } from '@/utils/utils';
import { MultiLineTextFinder } from '@/utils/multiLineTextFinder';

export class QAText {
  
  // complete text as read from file
  original: string;

  // QA topic path (only present if topic path included in original text)
  topicPathWithWs: TopicPathWithWs;

  actualQA: string;

  // The block identifier (optional), e.g. "^quote-of-the-day"
  // Format of block identifiers:
  //      https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link+to+a+block+in+a+note
  //      Block identifiers can only consist of letters, numbers, and dashes.
  // If present, then first character is "^"
  obsidianBlockId: string;

  // hash of string (topicPath + actualQuestion)
  textHash: string;

  constructor(
    original: string,
    topicPathWithWs: TopicPathWithWs,
    actualQuestion: string,
    blockId: string,
  ) {
    this.original = original;
    this.topicPathWithWs = topicPathWithWs;
    this.actualQA = actualQuestion;
    this.obsidianBlockId = blockId;
    this.textHash = cyrb53(this.formatTopicAndQA());
  }

  static create(original: string, settings: SRSettings): QAText {
    const [topicPathWithWs, actualQuestion, blockId] = this.splitText(original, settings);

    return new QAText(original, topicPathWithWs, actualQuestion, blockId);
  }


  static splitText(original: string, settings: SRSettings): [TopicPathWithWs, string, string] {
      const originalWithoutSR = NoteCardScheduleParser.removeCardScheduleInfo(original);
      let actualQuestion: string = originalWithoutSR.trimEnd();

      let topicPathWithWs: TopicPathWithWs;
      let blockId: string;

      // originalWithoutSR - [[preTopicPathWs] TopicPath [postTopicPathWs]] Question [whitespace blockId]
      const topicPath = TopicPath.getTopicPathFromCardText(originalWithoutSR);
      if (topicPath?.hasPath) {
          // cardText2 - TopicPath postTopicPathWs Question [whitespace blockId]
          const [preTopicPathWs, cardText2] = stringTrimStart(originalWithoutSR);

          // cardText3 - postTopicPathWs Question [whitespace blockId]
          const cardText3: string = cardText2.replaceAll(OBSIDIAN_TAG_AT_STARTOFLINE_REGEX, "");

          // actualQuestion - Question [whitespace blockId]
          let postTopicPathWs: string | null = null;
          [postTopicPathWs, actualQuestion] = stringTrimStart(cardText3);
          if (!settings.convertFoldersToDecks) {
              topicPathWithWs = new TopicPathWithWs(topicPath, preTopicPathWs, postTopicPathWs);
          }
      }

      // actualQuestion - Question [whitespace blockId]
      [actualQuestion, blockId] = this.extractObsidianBlockId(actualQuestion);

      return [topicPathWithWs, actualQuestion, blockId];
  }

  static extractObsidianBlockId(text: string): [string, string] {
    let question: string = text;
    let blockId: string = '';
    const match = text.match(OBSIDIAN_BLOCK_ID_ENDOFLINE_REGEX);
    if (match) {
        blockId = match[0].trim();
        const newLength = question.length - blockId.length;
        question = question.substring(0, newLength).trimEnd();
    }
    return [question, blockId];
}

  formatTopicAndQA(): string {
    let result: string = "";
    if (this.topicPathWithWs) {
      result += this.topicPathWithWs.formatWithWs();
    }

    result += this.actualQA;
    return result;
  }

}

export class QA {
  note: Note;
  parsedQAInfo: ParsedQAInfo;
  topicPathList: TopicPathList;
  qaText: QAText;
  qaContext: string[];
  cards: Card[];
  hasChanged: boolean;

  get questionType(): CardType {
      return this.parsedQAInfo.cardType;
  }
  get lineNo(): number {
      return this.parsedQAInfo.firstLineNum;
  }

  constructor(init?: Partial<QA>) {
      Object.assign(this, init);
  }


  setCardList(cards: Card[]): void {
      this.cards = cards;
      this.cards.forEach((card) => (card.qa = this));
  }

  formatScheduleAsHtmlComment(settings: SRSettings): string {
    let result: string = SR_HTML_COMMENT_BEGIN;

      // We always want the correct schedule format, so we use this if there is no schedule for a card
    for (let card of this.cards) {
        const schedule: CardScheduleInfo = card.hasSchedule
            ? card.scheduleInfo
            : CardScheduleInfo.getDummyScheduleForNewCard(settings);
        result += schedule.formatSchedule();
    }

    result += SR_HTML_COMMENT_END;
    return result;
  }

  formatForNote(settings: SRSettings): string {
      let result: string = this.qaText.formatTopicAndQA();
      const blockId: string = this.qaText.obsidianBlockId;
      const hasSchedule: boolean = this.cards.some((card) => card.hasSchedule);
      if (hasSchedule) {
          result = result.trimEnd();
          const scheduleHtml = this.formatScheduleAsHtmlComment(settings);
          if (blockId) {
            result += ` ${blockId}\n${scheduleHtml}`;
          } else {
              result += '\n' + scheduleHtml;
          }
      } else {
          // No schedule, so the block ID always comes after the question text, without anything after it
          if (blockId) result += ` ${blockId}`;
      }
      return result;
  }

  updateQuestionText(noteText: string, settings: SRSettings): string {
      const originalText: string = this.qaText.original;

      // Get the entire text for the question including:
      //      1. the topic path (if present),
      //      2. the question text
      //      3. the schedule HTML comment (if present)
      const replacementText = this.formatForNote(settings);

      let newText = MultiLineTextFinder.findAndReplace(noteText, originalText, replacementText);
      if (newText) {
          this.qaText = QAText.create(replacementText, settings);
      } else {
          console.error(
              `updateQuestionText: Text not found: ${originalText.substring(
                  0,
                  100,
              )} in note: ${noteText.substring(0, 100)}`,
          );
          newText = noteText;
      }
      return newText;
  }

  async writeQuestion(settings: SRSettings): Promise<void> {
      const fileText: string = await this.note.file.read();

      const newText: string = this.updateQuestionText(fileText, settings);
      await this.note.file.write(newText);
      this.hasChanged = false;
  }

  formatTopicPathList(): string {
      return this.topicPathList.format("|");
  }

  static Create(
      settings: SRSettings,
      parsedQAInfo: ParsedQAInfo,
      noteTopicPathList: TopicPathList,
      context: string[],
  ): QA {
      const qaText: QAText = QAText.create(parsedQAInfo.text, settings);

      let topicPathList: TopicPathList = noteTopicPathList;
      if (qaText.topicPathWithWs) {
          topicPathList = new TopicPathList([qaText.topicPathWithWs.topicPath]);
      }

      const result: QA = new QA({
          parsedQAInfo,
          topicPathList,
          qaText,
          qaContext: context,
          cards: [],
          hasChanged: false,
      });

      return result;
  }
}
