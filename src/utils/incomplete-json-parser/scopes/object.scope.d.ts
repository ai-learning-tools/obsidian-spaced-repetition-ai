import { LiteralScope } from "./literal.scope";
import { Scope } from "./scope.interface";
export declare class ObjectScope extends Scope {
    object: any;
    state: "key" | "colons" | "value" | "comma";
    keyScope?: LiteralScope;
    valueScope?: Scope;
    write(letter: string): boolean;
    getOrAssume(): object | undefined;
}
