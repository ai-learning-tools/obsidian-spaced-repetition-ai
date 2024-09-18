"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = void 0;
class Scope {
    finish = false;
    write(letter) {
        return false;
    }
    getOrAssume() {
        return undefined;
    }
}
exports.Scope = Scope;
