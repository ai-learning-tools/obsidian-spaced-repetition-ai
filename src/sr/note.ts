import { ISRFile } from "./srFile";

export class Note {
  file: ISRFile;
  questionList: Question[];

  get hasChanged(): boolean {
    return this.questionList.some((question) => question.hasChanged);
  }

  get filePath(): string {
    return this.file.path;
  }

  constructor(file: ISRFile, questionList: Question[]) {
    this.file = file;
    this.questionList = questionList;
    questionList.forEach((question) => (question.note = this));
  }

  // TODO
}