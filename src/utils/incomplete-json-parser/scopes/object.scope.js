"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectScope = void 0;
const array_scope_1 = require("./array.scope");
const literal_scope_1 = require("./literal.scope");
const scope_interface_1 = require("./scope.interface");
const utils_1 = require("./utils");
class ObjectScope extends scope_interface_1.Scope {
    object = {};
    state = "key";
    keyScope;
    valueScope;
    write(letter) {
        if (this.finish) {
            throw new Error("Object already finished");
            return false;
        }
        if (Object.keys(this.object).length === 0 &&
            this.state === "key" &&
            this.keyScope === undefined &&
            this.valueScope === undefined) {
            if (letter === "{")
                return true;
        }
        if (this.state === "key") {
            if (this.keyScope === undefined) {
                if ((0, utils_1.isWhitespace)(letter)) {
                    return true;
                }
                else if (letter === '"') {
                    this.keyScope = new literal_scope_1.LiteralScope();
                    return this.keyScope.write(letter);
                }
                else {
                    throw new Error(`Expected ", got ${letter}`);
                    return false;
                }
            }
            else {
                const success = this.keyScope.write(letter);
                const key = this.keyScope.getOrAssume();
                if (typeof key === "string") {
                    if (this.keyScope.finish) {
                        this.state = "colons";
                    }
                    return true;
                }
                else {
                    throw new Error(`Key is not a string: ${key}`);
                    return false;
                }
            }
        }
        else if (this.state === "colons") {
            if ((0, utils_1.isWhitespace)(letter)) {
                return true;
            }
            else if (letter === ":") {
                this.state = "value";
                this.valueScope = undefined;
                return true;
            }
            else {
                throw new Error(`Expected colons, got ${letter}`);
                return false;
            }
        }
        else if (this.state === "value") {
            if (this.valueScope === undefined) {
                if ((0, utils_1.isWhitespace)(letter)) {
                    return true;
                }
                else if (letter === "{") {
                    this.valueScope = new ObjectScope();
                    return this.valueScope.write(letter);
                }
                else if (letter === "[") {
                    this.valueScope = new array_scope_1.ArrayScope();
                    return this.valueScope.write(letter);
                }
                else {
                    this.valueScope = new literal_scope_1.LiteralScope();
                    return this.valueScope.write(letter);
                }
            }
            else {
                const success = this.valueScope.write(letter);
                if (this.valueScope.finish) {
                    const key = this.keyScope.getOrAssume();
                    this.object[key] = this.valueScope.getOrAssume();
                    this.state = "comma";
                    return true;
                }
                else if (success) {
                    return true;
                }
                else {
                    if ((0, utils_1.isWhitespace)(letter)) {
                        return true;
                    }
                    else if (letter === ",") {
                        const key = this.keyScope.getOrAssume();
                        this.object[key] = this.valueScope.getOrAssume();
                        this.state = "key";
                        this.keyScope = undefined;
                        this.valueScope = undefined;
                        return true;
                    }
                    else if (letter === "}") {
                        const key = this.keyScope.getOrAssume();
                        this.object[key] = this.valueScope.getOrAssume();
                        this.finish = true;
                        return true;
                    }
                    else {
                        throw new Error(`Expected comma, got ${letter}`);
                    }
                }
            }
        }
        else if (this.state === "comma") {
            if ((0, utils_1.isWhitespace)(letter)) {
                return true;
            }
            else if (letter === ",") {
                this.state = "key";
                this.keyScope = undefined;
                this.valueScope = undefined;
                return true;
            }
            else if (letter === "}") {
                this.finish = true;
                return true;
            }
            else {
                throw new Error(`Expected comma or }, got "${letter}"`);
            }
        }
        else {
            throw new Error("Unexpected state");
            return false;
        }
    }
    getOrAssume() {
        const assume = { ...this.object };
        if (this.keyScope || this.valueScope) {
            const key = this.keyScope?.getOrAssume();
            const value = this.valueScope?.getOrAssume();
            if (typeof key === "string" && key.length > 0) {
                if (typeof value !== "undefined")
                    assume[key] = value;
                else
                    assume[key] = null;
            }
        }
        return assume;
    }
}
exports.ObjectScope = ObjectScope;
