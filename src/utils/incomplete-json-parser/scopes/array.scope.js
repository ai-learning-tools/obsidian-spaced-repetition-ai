"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayScope = void 0;
const literal_scope_1 = require("./literal.scope");
const object_scope_1 = require("./object.scope");
const scope_interface_1 = require("./scope.interface");
const utils_1 = require("./utils");
class ArrayScope extends scope_interface_1.Scope {
    array = [];
    state = "value";
    scope;
    write(letter) {
        if (this.finish) {
            throw new Error("Array already finished");
        }
        if (this.array.length === 0 &&
            this.state === "value" &&
            this.scope === undefined) {
            if (letter === "[") {
                return true;
            }
        }
        if (this.state === "value") {
            if (this.scope === undefined) {
                if ((0, utils_1.isWhitespace)(letter)) {
                    return true;
                }
                else if (letter === "{") {
                    this.scope = new object_scope_1.ObjectScope();
                    this.array.push(this.scope);
                    return this.scope.write(letter);
                }
                else if (letter === "[") {
                    this.scope = new ArrayScope();
                    this.array.push(this.scope);
                    return this.scope.write(letter);
                }
                else {
                    this.scope = new literal_scope_1.LiteralScope();
                    this.array.push(this.scope);
                    const success = this.scope.write(letter);
                    return success;
                }
            }
            else {
                const success = this.scope.write(letter);
                if (success) {
                    if (this.scope.finish)
                        this.state = "comma";
                    return true;
                }
                else {
                    if (this.scope.finish) {
                        this.state = "comma";
                        return true;
                    }
                    else if (letter === ",") {
                        this.scope = undefined;
                    }
                    else if ((letter = "]")) {
                        this.finish = true;
                        return true;
                    }
                    return true;
                }
            }
        }
        else if (this.state === "comma") {
            if ((0, utils_1.isWhitespace)(letter)) {
                return true;
            }
            else if (letter === ",") {
                this.state = "value";
                this.scope = undefined;
                return true;
            }
            else if (letter === "]") {
                this.finish = true;
                return true;
            }
            else {
                throw new Error(`Expected comma, got ${letter}`);
            }
        }
        else {
            throw new Error("Unexpected state");
        }
    }
    getOrAssume() {
        return this.array.map((scope) => scope.getOrAssume());
    }
}
exports.ArrayScope = ArrayScope;
