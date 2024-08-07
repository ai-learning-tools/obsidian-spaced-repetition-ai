import { Card } from '@/sr/card';
import { Deck } from '@/sr/deck';
import { QA, QAText } from '@/sr/qa';
import { Note } from '@/sr/note';
import { TopicPath } from '@/sr/topicPath';
import { ReviewResponse } from "@/sr/scheduler";
import { CardScheduleInfo } from '@/sr/cardSchedule';

export enum FlashcardReviewMode {
    Cram,
    Review
  }

export interface IFlashcardReviewSequencer {
  get hasCurrentCard(): boolean;
  get currentCard(): Card;
  get currentQA(): QA;
  get currentNote(): Note;
  get currentDeck(): Deck;
  get originalDeckTree(): Deck;

  setDeckTree(originalDeckTree: Deck, remainingDeckTree: Deck): void;
  setCurrentDeck(topicPath: TopicPath): void;
  getDeckStats(topicPath: TopicPath): DeckStats;
  skipCurrentCard(): void;
  determineCardSchedule(response: ReviewResponse, card: Card): CardScheduleInfo;
  processReview(response: ReviewResponse): Promise<void>;
  updateCurrentQuestionText(text: string): Promise<void>;
  
}

export class DeckStats {
  dueCount: number;
  newCount: number;
  totalCount: number;

  constructor(dueCount: number, newCount: number, totalCount: number) {
      this.dueCount = dueCount;
      this.newCount = newCount;
      this.totalCount = totalCount;
  }
}

export class FlashcardReviewSequencer implements IFlashcardReviewSequencer {
  // We need the original deck tree so that we can still provide the total cards in each deck
  private _originalDeckTree: Deck;

  // This is set by the caller, and must have the same deck hierarchy as originalDeckTree.
  private remainingDeckTree: Deck;

  private reviewMode: FlashcardReviewMode;
  private cardSequencer: IDeckTreeIterator;
  private settings: SRSettings;
  private cardScheduleCalculator: ICardScheduleCalculator;
  private questionPostponementList: IQuestionPostponementList;

  constructor(
      reviewMode: FlashcardReviewMode,
      cardSequencer: IDeckTreeIterator,
      settings: SRSettings,
      cardScheduleCalculator: ICardScheduleCalculator,
      questionPostponementList: IQuestionPostponementList,
  ) {
      this.reviewMode = reviewMode;
      this.cardSequencer = cardSequencer;
      this.settings = settings;
      this.cardScheduleCalculator = cardScheduleCalculator;
      this.questionPostponementList = questionPostponementList;
  }

  get hasCurrentCard(): boolean {
      return this.cardSequencer.currentCard != null;
  }

  get currentCard(): Card {
      return this.cardSequencer.currentCard;
  }

  get currentQA(): QA {
      return this.currentCard?.qa;
  }

  get currentDeck(): Deck {
      return this.cardSequencer.currentDeck;
  }

  get currentNote(): Note {
      return this.currentQA.note;
  }

  // originalDeckTree isn't modified by the review process
  // Only remainingDeckTree
  setDeckTree(originalDeckTree: Deck, remainingDeckTree: Deck): void {
      this.cardSequencer.setBaseDeck(remainingDeckTree);
      this._originalDeckTree = originalDeckTree;
      this.remainingDeckTree = remainingDeckTree;
      this.setCurrentDeck(TopicPath.emptyPath);
  }

  setCurrentDeck(topicPath: TopicPath): void {
      this.cardSequencer.setIteratorTopicPath(topicPath);
      this.cardSequencer.nextCard();
  }

  get originalDeckTree(): Deck {
      return this._originalDeckTree;
  }

  getDeckStats(topicPath: TopicPath): DeckStats {
      const totalCount: number = this._originalDeckTree
          .getDeck(topicPath)
          .getDistinctCardCount(CardListType.All, true);
      const remainingDeck: Deck = this.remainingDeckTree.getDeck(topicPath);
      const newCount: number = remainingDeck.getDistinctCardCount(CardListType.NewCard, true);
      const dueCount: number = remainingDeck.getDistinctCardCount(CardListType.DueCard, true);
      return new DeckStats(dueCount, newCount, totalCount);
  }

  skipCurrentCard(): void {
      this.cardSequencer.deleteCurrentQuestionFromAllDecks();
  }

  private deleteCurrentCard(): void {
      this.cardSequencer.deleteCurrentCardFromAllDecks();
  }

  async processReview(response: ReviewResponse): Promise<void> {
      switch (this.reviewMode) {
          case FlashcardReviewMode.Review:
              await this.processReview_ReviewMode(response);
              break;

          case FlashcardReviewMode.Cram:
              await this.processReview_CramMode(response);
              break;
      }
  }

  async processReview_ReviewMode(response: ReviewResponse): Promise<void> {
      if (response != ReviewResponse.Reset || this.currentCard.hasSchedule) {
          // We need to update the schedule if:
          //  (1) the user reviewed with easy/good/hard (either a new or due card),
          //  (2) or reset a due card
          // Nothing to do if a user resets a new card
          this.currentCard.scheduleInfo = this.determineCardSchedule(response, this.currentCard);

          // Update the source file with the updated schedule
          await this.currentQA.writeQuestion(this.settings);
      }

      // Move/delete the card
      if (response == ReviewResponse.Reset) {
          this.cardSequencer.moveCurrentCardToEndOfList();
          this.cardSequencer.nextCard();
      } else {
          if (this.settings.burySiblingCards) {
              await this.burySiblingCards();
              this.cardSequencer.deleteCurrentQuestionFromAllDecks();
          } else {
              this.deleteCurrentCard();
          }
      }
  }

  private async burySiblingCards(): Promise<void> {
      // We check if there are any sibling cards still in the deck,
      // We do this because otherwise we would be adding every reviewed card to the postponement list, even for a
      // question with a single card. That isn't consistent with the 1.10.1 behavior
      const remaining = this.currentDeck.getQuestionCardCount(this.currentQA);
      if (remaining > 1) {
          this.questionPostponementList.add(this.currentQA);
          await this.questionPostponementList.write();
      }
  }

  async processReview_CramMode(response: ReviewResponse): Promise<void> {
      if (response == ReviewResponse.Easy) this.deleteCurrentCard();
      else {
          this.cardSequencer.moveCurrentCardToEndOfList();
          this.cardSequencer.nextCard();
      }
  }

  determineCardSchedule(response: ReviewResponse, card: Card): CardScheduleInfo {
      let result: CardScheduleInfo;

      if (response == ReviewResponse.Reset) {
          // Resetting the card schedule
          result = this.cardScheduleCalculator.getResetCardSchedule();
      } else {
          // scheduled card
          if (card.hasSchedule) {
              result = this.cardScheduleCalculator.calcUpdatedSchedule(
                  response,
                  card.scheduleInfo,
              );
          } else {
              const currentNote: Note = card.qa.note;
              result = this.cardScheduleCalculator.getNewCardSchedule(
                  response,
                  currentNote.filePath,
              );
          }
      }
      return result;
  }

  async updateCurrentQuestionText(text: string): Promise<void> {
      const q: QAText = this.currentQA.qaText;

      q.actualQA = text;

      await this.currentQA.writeQuestion(this.settings);
  }
}

