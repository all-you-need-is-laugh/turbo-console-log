export type ExtensionProperties = {
  unity3d: boolean;
  wrapLogMessage: boolean;
  logMessagePrefix: string;
  addSemicolonInTheEnd: boolean;
  insertEnclosingClass: boolean;
  insertEnclosingFunction: boolean;
  delimiterInsideMessage: string;
  includeFileNameAndLineNum: boolean;
  quote: string;
  logType: enumLogType;
};

enum enumLogType {
  log = "log",
  warn = "warn",
  error = "error",
  debug = "debug",
  table = "table",
}

