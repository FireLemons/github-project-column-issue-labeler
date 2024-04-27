"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isShallowLabelingRule = exports.isShallowColumn = exports.LabelingAction = void 0;
const TypeChecker = __importStar(require("./typeChecker"));
var LabelingAction;
(function (LabelingAction) {
    LabelingAction["ADD"] = "ADD";
    LabelingAction["REMOVE"] = "REMOVE";
    LabelingAction["SET"] = "SET";
})(LabelingAction || (exports.LabelingAction = LabelingAction = {}));
function isShallowColumn(value) {
    if (!(TypeChecker.isObject(value))) {
        return false;
    }
    try {
        TypeChecker.validateObjectMember(value, 'name', TypeChecker.Type.string);
        TypeChecker.validateObjectMember(value, 'labelingRules', TypeChecker.Type.array);
    }
    catch {
        return false;
    }
    return true;
}
exports.isShallowColumn = isShallowColumn;
function isShallowLabelingRule(value) {
    if (!(TypeChecker.isObject(value))) {
        return false;
    }
    try {
        TypeChecker.validateObjectMember(value, 'action', TypeChecker.Type.string);
        if (!(Object.values(LabelingAction).includes(value.action))) {
            return false;
        }
        TypeChecker.validateObjectMember(value, 'labels', TypeChecker.Type.array);
    }
    catch {
        return false;
    }
    return true;
}
exports.isShallowLabelingRule = isShallowLabelingRule;
