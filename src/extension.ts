import * as vscode from "vscode";
import { ExtensionProperties, Message } from "./entities";

import { DebugMessage } from "./debug-message";
import { LineCodeProcessing } from "./line-code-processing";

import { JSDebugMessage } from "./debug-message/js";
import { JSLineCodeProcessing } from "./line-code-processing/js";

import { CSDebugMessage } from "./debug-message/cs";
import { CSUnityDebugMessage } from "./debug-message/csunity";
import { CSLineCodeProcessing } from "./line-code-processing/cs";

let lineCodeProcessing: LineCodeProcessing;
let debugMessage: DebugMessage;

export function activate(context: vscode.ExtensionContext) {
  lineCodeProcessing = getLineCodeProcessing()
  debugMessage = getDebugMessage(lineCodeProcessing);

  // Insert debug message
  vscode.commands.registerCommand(
    "turboConsoleLog.displayLogMessage",
    async () => {
      const editor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      updateLanguage();
      const tabSize: number | string = getTabSize(editor.options.tabSize);
      const document: vscode.TextDocument = editor.document;
      const config: vscode.WorkspaceConfiguration =
        vscode.workspace.getConfiguration("turboConsoleLog");
      const properties: ExtensionProperties = getExtensionProperties(config);
      for (let index = 0; index < editor.selections.length; index++) {
        const selection: vscode.Selection = editor.selections[index];

        let wordUnderCursor = "";
        const rangeUnderCursor: vscode.Range | undefined = document.getWordRangeAtPosition(
            selection.active
        );
        // if rangeUnderCursor is undefined, `document.getText(undefined)` will return the entire file.
        if (rangeUnderCursor) {
            wordUnderCursor = document.getText(rangeUnderCursor);
        }
        const selectedVar: string = document.getText(selection) || wordUnderCursor;
        const lineOfSelectedVar: number = selection.active.line;
        // Check if the selection line is not the last one in the document and the selected variable is not empty
        if (selectedVar.trim().length !== 0) {
          const {
            wrapLogMessage,
            logMessagePrefix,
            quote,
            addSemicolonInTheEnd,
            insertEnclosingClass,
            insertEnclosingFunction,
            insertEmptyLineBeforeLogMessage,
            insertEmptyLineAfterLogMessage,
            delimiterInsideMessage,
            includeFileNameAndLineNum,
            logType,
            logFunction
          } = properties;
          await editor.edit((editBuilder) => {
            debugMessage.msg(
              editBuilder,
              document,
              selectedVar,
              lineOfSelectedVar,
              wrapLogMessage,
              logMessagePrefix,
              quote,
              addSemicolonInTheEnd,
              insertEnclosingClass,
              insertEnclosingFunction,
              insertEmptyLineBeforeLogMessage,
              insertEmptyLineAfterLogMessage,
              delimiterInsideMessage,
              includeFileNameAndLineNum,
              tabSize,
              logType,
              logFunction
            );
          });
        }
      }
    }
  );
  // Comment all debug messages
  vscode.commands.registerCommand(
    "turboConsoleLog.commentAllLogMessages",
    () => {
      const editor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const tabSize: number = getTabSize(editor.options.tabSize);
      const document: vscode.TextDocument = editor.document;
      const config: vscode.WorkspaceConfiguration =
        vscode.workspace.getConfiguration("turboConsoleLog");
      const properties: ExtensionProperties = getExtensionProperties(config);
      const logMessages: Message[] = debugMessage.detectAll(
        document,
        properties.delimiterInsideMessage,
        properties.quote,
        tabSize
      );
      editor.edit((editBuilder) => {
        logMessages.forEach(({ spaces, lines }) => {
          lines.forEach((line: vscode.Range) => {
            editBuilder.delete(line);
            editBuilder.insert(
              new vscode.Position(line.start.line, 0),
              `${spaces}// ${document.getText(line).trim()}\n`
            );
          });
        });
      });
    }
  );
  // Uncomment all debug messages
  vscode.commands.registerCommand(
    "turboConsoleLog.uncommentAllLogMessages",
    () => {
      const editor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const tabSize: number = getTabSize(editor.options.tabSize);
      const document: vscode.TextDocument = editor.document;
      const config: vscode.WorkspaceConfiguration =
        vscode.workspace.getConfiguration("turboConsoleLog");
      const properties: ExtensionProperties = getExtensionProperties(config);
      const logMessages: Message[] = debugMessage.detectAll(
        document,
        properties.delimiterInsideMessage,
        properties.quote,
        tabSize
      );
      editor.edit((editBuilder) => {
        logMessages.forEach(({ spaces, lines }) => {
          lines.forEach((line: vscode.Range) => {
            editBuilder.delete(line);
            editBuilder.insert(
              new vscode.Position(line.start.line, 0),
              `${spaces}${document.getText(line).replace(/\//g, "").trim()}\n`
            );
          });
        });
      });
    }
  );
  // Delete all debug messages
  vscode.commands.registerCommand(
    "turboConsoleLog.deleteAllLogMessages",
    () => {
      const editor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const tabSize: number = getTabSize(editor.options.tabSize);
      const document: vscode.TextDocument = editor.document;
      const config: vscode.WorkspaceConfiguration =
        vscode.workspace.getConfiguration("turboConsoleLog");
      const properties: ExtensionProperties = getExtensionProperties(config);
      const logMessages: Message[] = debugMessage.detectAll(
        document,
        properties.delimiterInsideMessage,
        properties.quote,
        tabSize
      );
      editor.edit((editBuilder) => {
        logMessages.forEach(({ lines }) => {
          const firstLine = lines[0];
          const lastLine = lines[lines.length - 1];
          const lineBeforeFirstLine = new vscode.Range(
            new vscode.Position(firstLine.start.line - 1, 0), new vscode.Position(firstLine.end.line - 1, 0)
          );
          const lineAfterLastLine = new vscode.Range(
            new vscode.Position(lastLine.start.line + 1, 0), new vscode.Position(lastLine.end.line + 1, 0)
          );
          if(document.lineAt(lineBeforeFirstLine.start).text === '') {
            editBuilder.delete(lineBeforeFirstLine);
          }
          if(document.lineAt(lineAfterLastLine.start).text === '') {
            editBuilder.delete(lineAfterLastLine);
          }
          lines.forEach((line: vscode.Range) => {
            editBuilder.delete(line);
          });
        });
      });
    }
  );
}

export function deactivate() {}

function getExtensionProperties(
  workspaceConfig: vscode.WorkspaceConfiguration
) {
  const unity3d = workspaceConfig.unity3d || false;
  const wrapLogMessage = workspaceConfig.wrapLogMessage || false;
  const logMessagePrefix = workspaceConfig.logMessagePrefix
    ? workspaceConfig.logMessagePrefix
    : "";
  const addSemicolonInTheEnd = workspaceConfig.addSemicolonInTheEnd || false;
  const insertEnclosingClass = workspaceConfig.insertEnclosingClass;
  const insertEnclosingFunction = workspaceConfig.insertEnclosingFunction;
  const insertEmptyLineBeforeLogMessage = workspaceConfig.insertEmptyLineBeforeLogMessage;
  const insertEmptyLineAfterLogMessage = workspaceConfig.insertEmptyLineAfterLogMessage;
  const quote = workspaceConfig.quote || '"';
  const delimiterInsideMessage = workspaceConfig.delimiterInsideMessage || "~";
  const includeFileNameAndLineNum =
    workspaceConfig.includeFileNameAndLineNum || false;
  const logType = workspaceConfig.logType || "log";
  const logFunction = workspaceConfig.logFunction || 'log';
  const extensionProperties: ExtensionProperties = {
    unity3d,
    wrapLogMessage,
    logMessagePrefix,
    addSemicolonInTheEnd,
    insertEnclosingClass,
    insertEnclosingFunction,
    insertEmptyLineBeforeLogMessage,
    insertEmptyLineAfterLogMessage,
    quote,
    delimiterInsideMessage,
    includeFileNameAndLineNum,
    logType,
    logFunction
  };
  return extensionProperties;
}

function getTabSize(tabSize: string | number | undefined): number {
  if (tabSize && typeof tabSize === "number") {
    return tabSize;
  } else if (tabSize && typeof tabSize === "string") {
    return parseInt(tabSize);
  } else {
    return 4;
  }
}

function updateLanguage() {
  console.log(vscode.window.activeTextEditor?.document.languageId);
  lineCodeProcessing = getLineCodeProcessing();
  debugMessage = getDebugMessage(lineCodeProcessing);
}

function getLineCodeProcessing(){
  if(vscode.window.activeTextEditor?.document.languageId == "csharp")
  {
    return new CSLineCodeProcessing();
  }
  else if(vscode.window.activeTextEditor?.document.languageId == "typescript" || vscode.window.activeTextEditor?.document.languageId == "javascript")
  {
    return new JSLineCodeProcessing();
  }
  else
  {
    return new JSLineCodeProcessing();
  }
}

function getDebugMessage(lcp :LineCodeProcessing) {
  const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("turboConsoleLog");
  const properties: ExtensionProperties = getExtensionProperties(config);

  if(vscode.window.activeTextEditor?.document.languageId == "csharp")
  {
    if(properties.unity3d)
      return new CSUnityDebugMessage(lcp);
    else
      return new CSDebugMessage(lcp);
  }
  else if(vscode.window.activeTextEditor?.document.languageId == "typescript" || vscode.window.activeTextEditor?.document.languageId == "javascript")
  {
    return new JSDebugMessage(lcp);
  }
  else
  {
    return new JSDebugMessage(lcp);
  }
}
