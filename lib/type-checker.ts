import ts from "typescript";
import libFiles from "./ts-libs.json";
import { TYPE_UTILS_LIB } from "./type-utils";

const LIBS = libFiles as Record<string, string>;

const USER_FILE = "quest.ts";
const UTILS_FILE = "type-utils.d.ts";
const DEFAULT_LIB = "lib.esnext.d.ts";

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
  lib: [DEFAULT_LIB],
};

function basename(fileName: string): string {
  const parts = fileName.split("/");
  return parts[parts.length - 1];
}

// Lib files (and the static type-utils file) never change across calls, so
// their parsed SourceFiles are cached - re-parsing ~600KB of lib.*.d.ts on
// every keystroke would make the live badge noticeably janky.
const staticSourceFileCache = new Map<string, ts.SourceFile>();

function createHost(userSource: string): ts.CompilerHost {
  const files: Record<string, string> = {
    [USER_FILE]: userSource,
    [UTILS_FILE]: TYPE_UTILS_LIB,
    ...LIBS,
  };

  function lookup(fileName: string): string | undefined {
    return files[fileName] ?? files[basename(fileName)];
  }

  return {
    getSourceFile(fileName, languageVersionOrOptions) {
      const text = lookup(fileName);
      if (text === undefined) return undefined;
      const languageVersion =
        typeof languageVersionOrOptions === "object"
          ? languageVersionOrOptions.languageVersion
          : languageVersionOrOptions;

      if (fileName === USER_FILE) {
        return ts.createSourceFile(fileName, text, languageVersion);
      }
      const cached = staticSourceFileCache.get(fileName);
      if (cached) return cached;
      const sourceFile = ts.createSourceFile(fileName, text, languageVersion);
      staticSourceFileCache.set(fileName, sourceFile);
      return sourceFile;
    },
    getDefaultLibFileName: () => DEFAULT_LIB,
    writeFile: () => {},
    getCurrentDirectory: () => "/",
    getDirectories: () => [],
    fileExists: (fileName) => lookup(fileName) !== undefined,
    readFile: (fileName) => lookup(fileName),
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
  };
}

export interface CheckedDiagnostic {
  message: string;
  line: number;
}

// Type-checks a single self-contained TypeScript source string entirely
// in-process via ts.createProgram - synchronous, deterministic, and
// independent of Monaco's web worker (which, in this app's environment, has
// shown a reproducible bug where diagnostics never resolve for a model that
// was set via direct API calls, and never validates at all without a real
// edit event).
export function checkTypeScript(source: string): CheckedDiagnostic[] {
  const host = createHost(source);
  const program = ts.createProgram({
    rootNames: [USER_FILE, UTILS_FILE],
    options: compilerOptions,
    host,
  });

  const sourceFile = program.getSourceFile(USER_FILE);
  if (!sourceFile) return [];

  const diagnostics = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ];

  return diagnostics.map((d) => ({
    message: ts.flattenDiagnosticMessageText(d.messageText, " "),
    line: d.start !== undefined ? sourceFile.getLineAndCharacterOfPosition(d.start).line + 1 : 0,
  }));
}
