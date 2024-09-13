export declare class IncompleteJsonParser {
    private scope?;
    private finish;
    parse(chunk: string): any;
    reset(): void;
    write(chunk: string): void;
    getObjects(): any;
}
