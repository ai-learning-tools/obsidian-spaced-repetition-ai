// TODO @review
// https://github.com/open-spaced-repetition/fsrs4anki/blob/main/fsrs4anki_scheduler.js#L115

import { genHexString } from "@/utils/utils";

interface FSRSData {
    again: { d: number; s: number; v: string; seed: number };
    hard: { d: number; s: number; v: string; seed: number };
    good: { d: number; s: number; v: string; seed: number };
    easy: { d: number; s: number; v: string; seed: number };
}

interface CardState {
    normal?: {
        new?: NewState;
        learning?: LearningState;
        review?: ReviewState;
        relearning?: LearningState;
    };
    filtered?: {
        rescheduling?: {
            originalState: CardState['normal'];
        };
    };
}

interface CardStates {
    current: CardState;
    again: CardState;
    hard: CardState;
    good: CardState;
    easy: CardState;
}

interface ReviewState {
    scheduledDays: number;
    elapsedDays?: number;
    easeFactor: number;
}

interface LearningState {
    step: number;
    remainingSteps: number;
    scheduledDays: number;
}

interface NewState {
    scheduledDays: number;
    position: number;
}


export class Card {
    front: string;
    back: string;
    id: string;
    firstLineNum: number;
    lastLineNum: number;
    states: CardStates;
    customData: FSRSData;

    constructor(
        front: string,
        back: string,
        id: string,
        firstLineNum: number,
        lastLineNum: number,
    ) {
        this.front = front;
        this.back = back;
        this.id = id;
        this.firstLineNum = firstLineNum;
        this.lastLineNum = lastLineNum;
    }

    review(): void {
        // TODO @review
        console.log('Reviewing card:', this.id);
        
        if (this.isNew()) {
        } else if (this.isLearning()) {
        } else if (this.isReview()) {
        }
    }

    isNew(): boolean {
        return true;
    }

    isLearning(): boolean {
        // TODO @review
        return false;
    }

    isReview(): boolean {
        // TODO @review
        return false;
    }
}
