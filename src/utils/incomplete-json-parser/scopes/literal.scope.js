"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiteralScope = void 0;
const scope_interface_1 = require("./scope.interface");
class LiteralScope extends scope_interface_1.Scope {
    content = "";
    write(letter) {
        if (this.finish)
            throw new Error("Literal already finished");
        this.content += letter;
        const assume = this.getOrAssume();
        if (typeof assume === "undefined") {
            this.content = this.content.slice(0, -1);
            return false;
        }
        if ((typeof assume === "string" &&
            this.content.length >= 2 &&
            !this.content.endsWith('\\"') &&
            this.content.endsWith('"')) ||
            (typeof assume === "boolean" && this.content === "true") ||
            (typeof assume === "boolean" && this.content === "false") ||
            (assume === null && this.content === "null")) {
            this.finish = true;
        }
        return true;
    }
    getOrAssume() {
        if (this.content === "")
            return null;
        if ("null".startsWith(this.content))
            return null;
        if ("true".startsWith(this.content))
            return true;
        if ("false".startsWith(this.content))
            return false;
        if (this.content.startsWith('"')) {
            if (!this.content.endsWith('\\"') && this.content.endsWith('"'))
                return this.content.slice(1, -1).replaceAll('\\"', '"');
            return this.content.slice(1).replaceAll('\\"', '"');
        }
        if (this.content === "-")
            return 0;
        const numberRegex = /^-?\d+(\.\d*)?$/;
        if (numberRegex.test(this.content)) {
            return parseFloat(this.content);
        }
        return undefined;
    }
}
exports.LiteralScope = LiteralScope;
