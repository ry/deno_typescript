
const ASSETS = "$asset$";
const OUT_DIR = "$deno$";

function println(...s) {
  Deno.core.print(s.join(" ") + "\n");
}

// Uint8Array -> string
function decode(ui8) {
  return String.fromCharCode.apply(null, ui8);
}

function encode(str) {
  const charCodes = str.split("").map(c => c.charCodeAt(0));
  const ui8 =  new Uint8Array(charCodes);
  // println(`encode ${ui8}`);
  return ui8;
}

const ops = {
  getSourceFile: 49,
};


// interface CompilerHost extends ModuleResolutionHost {
class Host {
  // useCaseSensitiveFileNames(): boolean;
  useCaseSensitiveFileNames() {
    return false;
  }

  // getDefaultLibFileName(options: CompilerOptions): string;
  getDefaultLibFileName(options) {
    return "";
    // return ASSETS + "/lib.deno_runtime.d.ts";
  }

  // getCurrentDirectory(): string;
  getCurrentDirectory() {
    return "";
  }

  // getCanonicalFileName(fileName: string): string
  getCanonicalFileName(fileName) {
    // console.log("getCanonicalFileName", fileName);
    return fileName;
  }


  // getSourceFile(fileName: string, languageVersion: ScriptTarget, onError?:
  // (message: string) => void, shouldCreateNewSourceFile?: boolean): SourceFile
  // | undefined;
  getSourceFile(
    fileName,
    languageVersion,
    onError,
    shouldCreateNewSourceFile
  ) {
    const s = JSON.stringify({
      fileName,
      languageVersion,
      shouldCreateNewSourceFile
    });
		println(`getSourceFile ${s}`);
    const msg = encode(s);
    let resUi8 = Deno.core.dispatch(ops.getSourceFile, msg);
    let resStr = decode(resUi8);
    let res = JSON.parse(resStr);

    if (res["ok"]) {
      let sourceCode = res["ok"];
      let sourceFile =  ts.createSourceFile(fileName, sourceCode, languageVersion);
      // println(`sourceFile ${JSON.stringify(sourceFile)}`);
      return sourceFile;
    } else if (res["err"]) {
      throw Error(res["err"]);
    } else {
      throw Error("unreachable");
    }
  }
  
  /*
    getSourceFileByPath?(fileName: string, path: Path, languageVersion: ScriptTarget, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): SourceFile | undefined;
    getCancellationToken?(): CancellationToken;
    getDefaultLibLocation?(): string;
    writeFile: WriteFileCallback;
    getCanonicalFileName(fileName: string): string;
    getNewLine(): string;
    readDirectory?(rootDir: string, extensions: ReadonlyArray<string>, excludes: ReadonlyArray<string> | undefined, includes: ReadonlyArray<string>, depth?: number): string[];
    resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames?: string[], redirectedReference?: ResolvedProjectReference): (ResolvedModule | undefined)[];
    resolveTypeReferenceDirectives?(typeReferenceDirectiveNames: string[], containingFile: string, redirectedReference?: ResolvedProjectReference): (ResolvedTypeReferenceDirective | undefined)[];
    getEnvironmentVariable?(name: string): string | undefined;
    createHash?(data: string): string;
    getParsedCommandLine?(fileName: string): ParsedCommandLine | undefined;
  */
}


function main(...rootNames) {
  println(`ts version ${ts.version}`);
  const host = new Host();
  const options = {
    allowJs: true,
    allowNonTsExtensions: true,
    checkJs: false,
    esModuleInterop: true,
    module: ts.ModuleKind.ESNext,
    outDir: OUT_DIR,
    resolveJsonModule: true,
    sourceMap: true,
    stripComments: true,
    target: ts.ScriptTarget.ESNext
  };
  const program = ts.createProgram(rootNames, options, host);

  println("done");
}

