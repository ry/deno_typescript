// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { testPerm, assert, assertEquals } from "./test_util.ts";

// TODO Add tests for modified, accessed, and created fields once there is a way
// to create temp files.
testPerm({ read: true }, async function statSyncSuccess(): Promise<void> {
  const packageInfo = Deno.statSync("package.json");
  assert(packageInfo.isFile());
  assert(!packageInfo.isSymlink());

  const testingInfo = Deno.statSync("testing");
  assert(testingInfo.isDirectory());
  assert(!testingInfo.isSymlink());

  const testsInfo = Deno.statSync("tests");
  assert(testsInfo.isDirectory());
  assert(!testsInfo.isSymlink());
});

testPerm({ read: false }, async function statSyncPerm(): Promise<void> {
  let caughtError = false;
  try {
    Deno.statSync("package.json");
  } catch (e) {
    caughtError = true;
    assertEquals(e.kind, Deno.ErrorKind.PermissionDenied);
    assertEquals(e.name, "PermissionDenied");
  }
  assert(caughtError);
});

testPerm({ read: true }, async function statSyncNotFound(): Promise<void> {
  let caughtError = false;
  let badInfo;

  try {
    badInfo = Deno.statSync("bad_file_name");
  } catch (err) {
    caughtError = true;
    assertEquals(err.kind, Deno.ErrorKind.NotFound);
    assertEquals(err.name, "NotFound");
  }

  assert(caughtError);
  assertEquals(badInfo, undefined);
});

testPerm({ read: true }, async function lstatSyncSuccess(): Promise<void> {
  const packageInfo = Deno.lstatSync("package.json");
  assert(packageInfo.isFile());
  assert(!packageInfo.isSymlink());

  const testingInfo = Deno.lstatSync("testing");
  assert(!testingInfo.isDirectory());
  assert(testingInfo.isSymlink());

  const testsInfo = Deno.lstatSync("tests");
  assert(testsInfo.isDirectory());
  assert(!testsInfo.isSymlink());
});

testPerm({ read: false }, async function lstatSyncPerm(): Promise<void> {
  let caughtError = false;
  try {
    Deno.lstatSync("package.json");
  } catch (e) {
    caughtError = true;
    assertEquals(e.kind, Deno.ErrorKind.PermissionDenied);
    assertEquals(e.name, "PermissionDenied");
  }
  assert(caughtError);
});

testPerm({ read: true }, async function lstatSyncNotFound(): Promise<void> {
  let caughtError = false;
  let badInfo;

  try {
    badInfo = Deno.lstatSync("bad_file_name");
  } catch (err) {
    caughtError = true;
    assertEquals(err.kind, Deno.ErrorKind.NotFound);
    assertEquals(err.name, "NotFound");
  }

  assert(caughtError);
  assertEquals(badInfo, undefined);
});

testPerm({ read: true }, async function statSuccess(): Promise<void> {
  const packageInfo = await Deno.stat("package.json");
  assert(packageInfo.isFile());
  assert(!packageInfo.isSymlink());

  const testingInfo = await Deno.stat("testing");
  assert(testingInfo.isDirectory());
  assert(!testingInfo.isSymlink());

  const testsInfo = await Deno.stat("tests");
  assert(testsInfo.isDirectory());
  assert(!testsInfo.isSymlink());
});

testPerm({ read: false }, async function statPerm(): Promise<void> {
  let caughtError = false;
  try {
    await Deno.stat("package.json");
  } catch (e) {
    caughtError = true;
    assertEquals(e.kind, Deno.ErrorKind.PermissionDenied);
    assertEquals(e.name, "PermissionDenied");
  }
  assert(caughtError);
});

testPerm({ read: true }, async function statNotFound(): Promise<void> {
  let caughtError = false;
  let badInfo;

  try {
    badInfo = await Deno.stat("bad_file_name");
  } catch (err) {
    caughtError = true;
    assertEquals(err.kind, Deno.ErrorKind.NotFound);
    assertEquals(err.name, "NotFound");
  }

  assert(caughtError);
  assertEquals(badInfo, undefined);
});

testPerm({ read: true }, async function lstatSuccess(): Promise<void> {
  const packageInfo = await Deno.lstat("package.json");
  assert(packageInfo.isFile());
  assert(!packageInfo.isSymlink());

  const testingInfo = await Deno.lstat("testing");
  assert(!testingInfo.isDirectory());
  assert(testingInfo.isSymlink());

  const testsInfo = await Deno.lstat("tests");
  assert(testsInfo.isDirectory());
  assert(!testsInfo.isSymlink());
});

testPerm({ read: false }, async function lstatPerm(): Promise<void> {
  let caughtError = false;
  try {
    await Deno.lstat("package.json");
  } catch (e) {
    caughtError = true;
    assertEquals(e.kind, Deno.ErrorKind.PermissionDenied);
    assertEquals(e.name, "PermissionDenied");
  }
  assert(caughtError);
});

testPerm({ read: true }, async function lstatNotFound(): Promise<void> {
  let caughtError = false;
  let badInfo;

  try {
    badInfo = await Deno.lstat("bad_file_name");
  } catch (err) {
    caughtError = true;
    assertEquals(err.kind, Deno.ErrorKind.NotFound);
    assertEquals(err.name, "NotFound");
  }

  assert(caughtError);
  assertEquals(badInfo, undefined);
});
