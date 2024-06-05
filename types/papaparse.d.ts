// types/papaparse.d.ts
declare module "papaparse" {
  interface ParseConfig {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: string | boolean;
    step?: (results: ParseResult, parser: Parser) => void;
    complete?: (results: ParseResult, file: File) => void;
    error?: (error: ParseError, file: File) => void;
    download?: boolean;
    skipEmptyLines?: boolean | "greedy";
    chunk?: (results: ParseResult, parser: Parser) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => any;
    delimitersToGuess?: string[];
  }

  interface UnparseConfig {
    quotes?: boolean | boolean[];
    quoteChar?: string;
    escapeChar?: string;
    delimiter?: string;
    header?: boolean;
    newline?: string;
    skipEmptyLines?: boolean | "greedy";
    columns?: string[] | UnparseObject;
  }

  interface UnparseObject {
    fields: string[];
    data: any[];
  }

  interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  interface ParseResult {
    data: any[];
    errors: ParseError[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
    };
  }

  interface Parser {
    abort: () => void;
    getCharIndex: () => number;
  }

  function parse(input: string | File, config?: ParseConfig): ParseResult;
  function unparse(data: any, config?: UnparseConfig): string;

  export = { parse, unparse };
}
