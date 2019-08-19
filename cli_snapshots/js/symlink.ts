// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import * as msg from "./msg_generated.ts";
import * as flatbuffers from "./flatbuffers.ts";
import * as dispatch from "./dispatch.ts";
import * as util from "./util.ts";
import { platform } from "./build.ts";

function req(
  oldname: string,
  newname: string,
  type?: string
): [flatbuffers.Builder, msg.Any, flatbuffers.Offset] {
  if (platform.os === "win" && type) {
    return util.notImplemented();
  }
  const builder = flatbuffers.createBuilder();
  const oldname_ = builder.createString(oldname);
  const newname_ = builder.createString(newname);
  const inner = msg.Symlink.createSymlink(builder, oldname_, newname_);
  return [builder, msg.Any.Symlink, inner];
}

/** Synchronously creates `newname` as a symbolic link to `oldname`. The type
 * argument can be set to `dir` or `file` and is only available on Windows
 * (ignored on other platforms).
 *
 *       Deno.symlinkSync("old/name", "new/name");
 */
export function symlinkSync(
  oldname: string,
  newname: string,
  type?: string
): void {
  dispatch.sendSync(...req(oldname, newname, type));
}

/** Creates `newname` as a symbolic link to `oldname`. The type argument can be
 * set to `dir` or `file` and is only available on Windows (ignored on other
 * platforms).
 *
 *       await Deno.symlink("old/name", "new/name");
 */
export async function symlink(
  oldname: string,
  newname: string,
  type?: string
): Promise<void> {
  await dispatch.sendAsync(...req(oldname, newname, type));
}
