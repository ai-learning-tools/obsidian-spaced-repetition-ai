"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncompleteJsonParser = void 0;
const scopes_1 = require("./scopes");
const utils_1 = require("./scopes/utils");
class IncompleteJsonParser {
    scope;
    finish = false;
    parse(chunk) {
        const parser = new IncompleteJsonParser();
        parser.write(chunk);
        return parser.getObjects();
    }
    reset() {
        this.scope = undefined;
        this.finish = false;
    }
    write(chunk) {
        for (let i = 0; i < chunk.length; i++) {
            if (this.finish)
                throw new Error("Parser is already finished");
            const letter = chunk[i];
            if (this.scope === undefined) {
                if ((0, utils_1.isWhitespace)(letter))
                    continue;
                else if (letter === "{")
                    this.scope = new scopes_1.ObjectScope();
                else if (letter === "[")
                    this.scope = new scopes_1.ArrayScope();
                else
                    this.scope = new scopes_1.LiteralScope();
                this.scope.write(letter);
            }
            else {
                const success = this.scope.write(letter);
                if (success) {
                    if (this.scope.finish) {
                        this.finish = true;
                        continue;
                    }
                }
                else {
                    throw new Error("Failed to parse the JSON string");
                }
            }
        }
    }
    getObjects() {
        if (this.scope) {
            return this.scope.getOrAssume();
        }
        else {
            throw new Error("No input to parse");
        }
    }
}
exports.IncompleteJsonParser = IncompleteJsonParser;
