"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastCharacterDigit = exports.getLastDigit = exports.getLastCharacter = void 0;
const getLastCharacter = (str) => {
    if (!str || str.length === 0) {
        return '';
    }
    return str[str.length - 1];
};
exports.getLastCharacter = getLastCharacter;
const getLastDigit = (str) => {
    if (!str || str.length === 0) {
        return null;
    }
    for (let i = str.length - 1; i >= 0; i--) {
        if (/\d/.test(str[i])) {
            return str[i];
        }
    }
    return null;
};
exports.getLastDigit = getLastDigit;
const isLastCharacterDigit = (str) => {
    if (!str || str.length === 0) {
        return false;
    }
    return /\d/.test(str[str.length - 1]);
};
exports.isLastCharacterDigit = isLastCharacterDigit;
//# sourceMappingURL=string.utils.js.map