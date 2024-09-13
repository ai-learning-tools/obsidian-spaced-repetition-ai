import { Scope } from "./scope.interface";
export declare class ArrayScope extends Scope {
    array: Scope[];
    state: "value" | "comma";
    scope?: Scope;
    write(letter: string): boolean;
    getOrAssume(): any[];
}
