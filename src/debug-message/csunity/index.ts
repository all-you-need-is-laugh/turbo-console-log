import { CSDebugMessage } from '../cs';

export class CSUnityDebugMessage extends CSDebugMessage {
  protected getLogMessage (message: string, selected: string, quote: string, prefix: string, semicolon: string): string {
    // ignore other variants for now
    quote = `"`;
    const postfix = selected ? `${selected} ` : '';
    const args = selected ? ` + ${selected}` : '';
    return `Debug.Log(${quote}${prefix}${message}${postfix}${quote}${args})${semicolon}`;
  }
  protected getDebugLogMessageRegExp (): RegExp {
    return /Debug\.Log\(/;
  }
  protected getDebugLogMessageArgsRegExp (delemiterInsideMessage: string): RegExp {
    return new RegExp(`${delemiterInsideMessage}{1}"\\+[a-zA-Z0-9_-]\\);`);
  }
}
