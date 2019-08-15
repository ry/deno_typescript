const ASSETS = "$asset$";

function println(...s) {
  Deno.core.print(s.join(" ") + "\n");
}


function unreachable() {
  throw Error("unreachable");
}

function assert(cond) {
  if (!cond) {
  	throw Error("assert");
	}
}

// decode(Uint8Array): string
function decodeAscii(ui8) {
  let out = "";
  for (let i = 0; i < ui8.length; i++) {
    out += String.fromCharCode(ui8[i]);
  }
  return out;
}

function encode(str) {
  const charCodes = str.split("").map(c => c.charCodeAt(0));
  const ui8 =  new Uint8Array(charCodes);
  // println(`encode ${ui8}`);
  return ui8;
}

const ops = {
  getSourceFile: 49,
  exit: 50,
  writeFile: 51,
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
    const msg = JSONmsg({
      fileName,
      languageVersion,
      shouldCreateNewSourceFile
    });
    let resUi8 = Deno.core.dispatch(ops.getSourceFile, msg);
    let resStr = decodeAscii(resUi8);
    let res = JSON.parse(resStr);

    if (res["ok"]) {
      let sourceCode = res["ok"];
      let sourceFile =  ts.createSourceFile(fileName, sourceCode, languageVersion);
      // println(`sourceFile ${JSON.stringify(sourceFile)}`);
      return sourceFile;
    } else if (res["err"]) {
      throw Error(res["err"]);
    } else {
      unreachable();
    }
  }

  /*
    writeFile(
      fileName: string,
      data: string,
      writeByteOrderMark: boolean,
      onError?: (message: string) => void,
      sourceFiles?: ReadonlyArray<ts.SourceFile>
    ): void
  */
  writeFile(
    fileName,
    data,
    writeByteOrderMark,
    onError = null,
    sourceFiles = null
  ) {
    println(`writeFile ${fileName}`);
    writeFile(fileName, data);
  }

  // getSourceFileByPath?(fileName: string, path: Path, languageVersion: ScriptTarget, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): SourceFile | undefined;
  getSourceFileByPath(fileName, path, languageVersion, onError, shouldCreateNewSourceFile) {
    unreachable();
  }

  // getCancellationToken?(): CancellationToken;
  getCancellationToken() {
    unreachable();
  }

  // getDefaultLibLocation?(): string;
  getDefaultLibLocation() {
    // unreachable();
    // return ASSETS + "/lib.deno_runtime.d.ts";
    return ASSETS;
  }

  // getCanonicalFileName(fileName: string): string;
  getCanonicalFileName(fileName) {
    return fileName;
  }

  // getNewLine(): string
  getNewLine() {
    return "\n";
  }

  // readDirectory?(rootDir: string, extensions: ReadonlyArray<string>, excludes: ReadonlyArray<string> | undefined, includes: ReadonlyArray<string>, depth?: number): string[];
  readDirectory() {
    unreachable();
  }

  // resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames?: string[], redirectedReference?: ResolvedProjectReference): (ResolvedModule | undefined)[];
  resolveModuleNames() {
    unreachable();
  }

  // resolveTypeReferenceDirectives?(typeReferenceDirectiveNames: string[], containingFile: string, redirectedReference?: ResolvedProjectReference): (ResolvedTypeReferenceDirective | undefined)[];
  /*
  resolveTypeReferenceDirectives() {
    unreachable();
  }
  */
  
  // getEnvironmentVariable?(name: string): string | undefined;
  getEnvironmentVariable() {
    unreachable();
  }

  // createHash?(data: string): string;
  createHash() {
    unreachable();
  }

  // getParsedCommandLine?(fileName: string): ParsedCommandLine | undefined;
  getParsedCommandLine() {
    unreachable();
  }
}


function main(configText, rootNames) {
  println(`>>> ts version ${ts.version}`);
  println(`>>> rootNames ${rootNames}`);
  const host = new Host();

  assert(rootNames.length > 0);

	const { config, error } = ts.parseConfigFileTextToJson(
		"builtin_tsconfig.json",
    configText
  );
  if (error) {
    println(`err ${error}`);
    const msg = ts.formatDiagnosticsWithColorAndContext([error], host);
    println(msg);
    exit(1);
	}
  const program = ts.createProgram(rootNames, config, host);
  let diagnostics = ts.getPreEmitDiagnostics(program)
  if (diagnostics && diagnostics.length === 0) {
    const emitResult = program.emit();
    diagnostics = emitResult.diagnostics;
  }

  if (diagnostics && diagnostics.length) {
    const msg = ts.formatDiagnosticsWithColorAndContext(diagnostics, host);
    println(msg);
    exit(1);
  }

  println("done");
}


function JSONmsg(obj) {
  const s = JSON.stringify(obj);
  const msg = encode(s);
  // println(`JSONmsg ${msg}`);
  return msg;
}

function exit(code) {
  Deno.core.dispatch(ops.exit, JSONmsg({ code }));
  unreachable();
}

function writeFile(fileName, data) {
  let resUi8 = Deno.core.dispatch(ops.writeFile, JSONmsg({ fileName, data }));
  let resStr = decodeAscii(resUi8);
  let res = JSON.parse(resStr);
  if (!res["ok"]) {
    throw Error(`writeFile failed ${res["err"]}`);
  }
}
