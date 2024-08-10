import { Card } from "./Card";
import { DEFAULT_FSRS_WEIGHTS } from "@/constants";
import { Vault, TFile, TFolder } from "obsidian";
import { errorMessage } from "@/utils/errorMessage";

export class Deck {
    path: string;
    vault: Vault;
    weights: number[];
    desiredRetention: number;
    maxInterval: number;
    parent: Deck | null;

    files: TFile[];
    subdecks: Deck[] = [];
    newCards: Card[] = [];
    learningCards: Card[] = [];
    dueCards: Card[] = [];

    constructor(
      path: string,
      vault: Vault,
      parent: Deck | null = null,
      weights: number[] = DEFAULT_FSRS_WEIGHTS,
      desiredRetention: number = 0.9,
      maxInterval: number = 36500,
    ) {
      this.path = path;
      this.vault = vault;
      this.weights = weights;
      this.desiredRetention = desiredRetention;
      this.maxInterval = maxInterval;
      this.parent = parent;
    }

    // this re-retrieves subdecks, newCards, learningCards, dueCards, files
    async updateDeck() {
      if (!this.vault) {
        errorMessage('Deck not initialized properly');
        return;
      }
      // Reset arrays before updating
      this.newCards = [];
      this.learningCards = [];
      this.dueCards = [];
      this.subdecks = [];

      const folders = await this.vault.getAllFolders();
      this.files = await this.vault.getMarkdownFiles().filter(file => file.path.startsWith(this.path));
      
      // Get all subdecks (subfolders)
      const deckFolders = folders.filter(folder => folder.path.startsWith(this.path));
      for (const subfolder of deckFolders) {
        const subdeck = new Deck(subfolder.path, this.vault, this);
        this.subdecks.push(subdeck);
      }

      // Process files in the current deck
      for (const file of this.files) {
        const content = await this.vault.read(file);
        const flashcards = this.extractFlashcards(content, file.path);
        
        const targetDecks = [this, ...this.subdecks.filter(subdeck => file.path.startsWith(subdeck.path))];
        
        for (const card of flashcards) {
          for (const deck of targetDecks) {
            if (card.isNew()) {
              deck.newCards.push(card);
            } else if (card.isLearning()) {
              deck.learningCards.push(card);
            } else if (card.isReview()) {
              deck.dueCards.push(card);
            }
          }
        }
      }

      if (this.path === '') { // for debugging
        // Log the current deck's cards and subdecks
        console.log(`Deck: ${this.path}`);
        console.log('New cards:', this.newCards.length);
        console.log('Learning cards:', this.learningCards.length);
        console.log('Due cards:', this.dueCards.length);
        console.log('Subdecks:', this.subdecks.length);
  
        // Log details for each subdeck
        this.subdecks.forEach(subdeck => {
          console.log(`\nSubdeck: ${subdeck.path}`);
          console.log('New cards:', subdeck.newCards.length);
          console.log('Learning cards:', subdeck.learningCards.length);
          console.log('Due cards:', subdeck.dueCards.length);
        }); 

      }
    }

    private extractFlashcards(content: string, filePath: string): Card[] {
      const flashcards: Card[] = [];
      const lines = content.split('\n');
      let currentCard: { question: string[], answer: string[], startLine: number, endLine: number } | null = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('[!card]') || line.startsWith('> [!card]') || line.startsWith('> > [!card]')) {
          if (currentCard) {
            flashcards.push(new Card(
              currentCard.question.join('\n').trim(),
              currentCard.answer.join('\n').trim(),
              filePath,
              currentCard.startLine,
              currentCard.endLine
            ));
          }
          currentCard = {
            question: [line.replace(/^>*\s*\[!card\]\s*/, '').trim()],
            answer: [],
            startLine: i,
            endLine: i
          };
        } else if (currentCard) {
          const trimmedLine = line.replace(/^>+\s*/, '').trim();
          if (trimmedLine.startsWith('<!--SR:')) {
            // Ignore spaced repetition metadata
            continue;
          }
          if (currentCard.answer.length === 0 && trimmedLine !== '') {
            currentCard.question.push(trimmedLine);
          } else {
            currentCard.answer.push(trimmedLine);
          }
          currentCard.endLine = i;
        }

        // Check if we've reached the end of a card or section
        if (currentCard && (line === '' || i === lines.length - 1)) {
          flashcards.push(new Card(
            currentCard.question.join('\n').trim(),
            currentCard.answer.join('\n').trim(),
            filePath,
            currentCard.startLine,
            currentCard.endLine
          ));
          currentCard = null;
        }
      }

      return flashcards;
    }
}
