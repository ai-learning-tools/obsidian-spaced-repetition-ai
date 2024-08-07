import { QA } from "@/sr/qa";
import SRPlugin from "@/main";
import { SRSettings } from "@/settings";

export interface IQuestionPostponementList {
    clear(): void;
    add(question: QA): void;
    includes(question: QA): boolean;
    write(): Promise<void>;
}

export class QuestionPostponementList implements IQuestionPostponementList {
    list: string[];
    plugin: SRPlugin;
    settings: SRSettings;

    constructor(plugin: SRPlugin, settings: SRSettings, list: string[]) {
        this.plugin = plugin;
        this.settings = settings;
        this.list = list;
    }

    clear(): void {
        this.list.splice(0);
    }

    add(question: QA): void {
        if (!this.includes(question)) this.list.push(question.qaText.textHash);
    }

    includes(question: QA): boolean {
        return this.list.includes(question.qaText.textHash);
    }

    async write(): Promise<void> {
        // This is null only whilst unit testing is being performed
        if (this.plugin == null) return;

        await this.plugin.saveSettings();
    }
}
