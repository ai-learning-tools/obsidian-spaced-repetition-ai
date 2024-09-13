import { Scope } from "./scope.interface";
export declare class LiteralScope extends Scope {
    content: string;
    write(letter: string): boolean;
    getOrAssume(): boolean | null | string | number | undefined;
}
