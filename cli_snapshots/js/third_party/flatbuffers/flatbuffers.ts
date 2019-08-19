// 2019.08.19 Converted to TypeScript by Ryan Dahl <ry@tinyclouds.org>
//
// Based on type definitions for flatbuffers 1.9
// Project: http://google.github.io/flatbuffers/index.html
// Definitions by: Kamil Rojewski <kamil.rojewski@gmail.com>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export type Offset = number;

export interface Table {
  bb: ByteBuffer | null;
  bb_pos: number;
}

const SIZEOF_SHORT = 2;
const SIZEOF_INT = 4;
const FILE_IDENTIFIER_LENGTH = 4;

export enum Encoding {
  UTF8_BYTES = 1,
  UTF16_STRING = 2
}

const int32 = new Int32Array(2);
const float32 = new Float32Array(int32.buffer);
const float64 = new Float64Array(int32.buffer);
const isLittleEndian = new Uint16Array(new Uint8Array([1, 0]).buffer)[0] === 1;

export class Long {
  static ZERO: Long = new Long(0, 0);

  constructor(readonly low = 0, readonly high = 0) {}

  toFloat64(): number {
    return (this.low >>> 0) + this.high * 0x100000000;
  }

  equals(other: any): boolean {
    return this.low == other.low && this.high == other.high;
  }

  static create(low: number, high: number): Long {
    return low == 0 && high == 0 ? Long.ZERO : new Long(low, high);
  }
}

export class Builder {
  private bb: ByteBuffer;
  // Remaining space in the ByteBuffer.
  private space: number;
  // Minimum alignment encountered so far.
  private minalign = 1;
  // The vtable for the current table.
  private vtable: null | number[] = null;
  // The amount of fields we're actually using.
  private vtable_in_use = 0;
  // Whether we are currently serializing a table.
  private isNested = false;
  // Starting offset of the current struct/table.
  private object_start = 0;
  // List of offsets of all vtables.
  private vtables: number[] = [];
  // For the current vector being built.
  private vector_num_elems: number = 0;
  // False omits default values from the serialized data
  private force_defaults = false;

  constructor(opt_initial_size?: number) {
    if (!opt_initial_size) {
      var initial_size = 1024;
    } else {
      var initial_size = opt_initial_size;
    }
    this.bb = ByteBuffer.allocate(initial_size);
    this.space = initial_size;
  }

  /**
   * Reset all the state in this FlatBufferBuilder
   * so it can be reused to construct another buffer.
   */
  clear(): void {
    throw Error("unimplemented");
  }

  /**
   * In order to save space, fields that are set to their default value
   * don't get serialized into the buffer. Forcing defaults provides a
   * way to manually disable this optimization.
   *
   * @param forceDefaults true always serializes default values
   */
  forceDefaults(forceDefaults: boolean): void {
    this.force_defaults = forceDefaults;
  }

  /**
   * Get the ByteBuffer representing the FlatBuffer. Only call this after you've
   * called finish(). The actual data starts at the ByteBuffer's current position,
   * not necessarily at 0.
   */
  dataBuffer(): ByteBuffer {
    return this.bb;
  }

  /**
   * Get the ByteBuffer representing the FlatBuffer. Only call this after you've
   * called finish(). The actual data starts at the ByteBuffer's current position,
   * not necessarily at 0.
   */
  asUint8Array(): Uint8Array {
    return this.bb
      .bytes()
      .subarray(this.bb.position(), this.bb.position() + this.offset());
  }

  /**
   * Prepare to write an element of `size` after `additional_bytes` have been
   * written, e.g. if you write a string, you need to align such the int length
   * field is aligned to 4 bytes, and the string data follows it directly. If all
   * you need to do is alignment, `additional_bytes` will be 0.
   *
   * @param size This is the of the new element to write
   * @param additional_bytes The padding size
   */
  prep(size: number, additional_bytes: number): void {
    // Track the biggest thing we've ever aligned to.
    if (size > this.minalign) {
      this.minalign = size;
    }

    // Find the amount of alignment needed such that `size` is properly
    // aligned after `additional_bytes`
    var align_size =
      (~(this.bb.capacity() - this.space + additional_bytes) + 1) & (size - 1);

    // Reallocate the buffer if needed.
    while (this.space < align_size + size + additional_bytes) {
      var old_buf_size = this.bb.capacity();
      this.bb = Builder.growByteBuffer(this.bb);
      this.space += this.bb.capacity() - old_buf_size;
    }

    this.pad(align_size);
  }

  pad(byte_size: number): void {
    for (var i = 0; i < byte_size; i++) {
      this.bb.writeInt8(--this.space, 0);
    }
  }

  writeInt8(value: number): void {
    this.bb.writeInt8((this.space -= 1), value);
  }

  writeInt16(value: number): void {
    this.bb.writeInt16((this.space -= 2), value);
  }

  writeInt32(value: number): void {
    this.bb.writeInt32((this.space -= 4), value);
  }

  writeInt64(value: Long): void {
    this.bb.writeInt64((this.space -= 8), value);
  }

  writeFloat32(value: number): void {
    this.bb.writeFloat32((this.space -= 4), value);
  }

  writeFloat64(value: number): void {
    this.bb.writeFloat64((this.space -= 8), value);
  }

  addInt8(value: number): void {
    this.prep(1, 0);
    this.writeInt8(value);
  }

  addInt16(value: number): void {
    this.prep(2, 0);
    this.writeInt16(value);
  }

  addInt32(value: number): void {
    this.prep(4, 0);
    this.writeInt32(value);
  }

  addInt64(value: Long): void {
    this.prep(8, 0);
    this.writeInt64(value);
  }

  addFloat32(value: number): void {
    this.prep(4, 0);
    this.writeFloat32(value);
  }

  addFloat64(value: number): void {
    this.prep(8, 0);
    this.writeFloat64(value);
  }

  addFieldInt8(voffset: number, value: number, defaultValue: number): void {
    if (this.force_defaults || value != defaultValue) {
      this.addInt8(value);
      this.slot(voffset);
    }
  }

  addFieldInt16(voffset: number, value: number, defaultValue: number): void {
    if (this.force_defaults || value != defaultValue) {
      this.addInt16(value);
      this.slot(voffset);
    }
  }

  addFieldInt32(voffset: number, value: number, defaultValue: number): void {
    if (this.force_defaults || value != defaultValue) {
      this.addInt32(value);
      this.slot(voffset);
    }
  }

  addFieldInt64(voffset: number, value: Long, defaultValue: Long): void {
    if (this.force_defaults || !value.equals(defaultValue)) {
      this.addInt64(value);
      this.slot(voffset);
    }
  }

  addFieldFloat32(voffset: number, value: number, defaultValue: number): void {
    if (this.force_defaults || value != defaultValue) {
      this.addFloat32(value);
      this.slot(voffset);
    }
  }

  addFieldFloat64(voffset: number, value: number, defaultValue: number): void {
    if (this.force_defaults || value != defaultValue) {
      this.addFloat64(value);
      this.slot(voffset);
    }
  }

  addFieldOffset(voffset: number, value: Offset, defaultValue: Offset): void {
    if (this.force_defaults || value != defaultValue) {
      this.addOffset(value);
      this.slot(voffset);
    }
  }

  /**
   * Structs are stored inline, so nothing additional is being added. `d` is always 0.
   */
  addFieldStruct(voffset: number, value: Offset, defaultValue: Offset): void {
    if (value != defaultValue) {
      this.nested(value);
      this.slot(voffset);
    }
  }

  /**
   * Structures are always stored inline, they need to be created right
   * where they're used.  You'll get this assertion failure if you
   * created it elsewhere.
   *
   * @param obj The offset of the created object
   */
  nested(obj: Offset): void {
    if (obj != this.offset()) {
      throw new Error("FlatBuffers: struct must be serialized inline.");
    }
  }

  /**
   * Should not be creating any other object, string or vector
   * while an object is being constructed
   */
  notNested(): void {
    if (this.isNested) {
      throw new Error("FlatBuffers: object serialization must not be nested.");
    }
  }

  /**
   * Set the current vtable at `voffset` to the current location in the buffer.
   */
  slot(voffset: number): void {
    this.vtable[voffset] = this.offset();
  }

  /**
   * @returns Offset relative to the end of the buffer.
   */
  offset(): Offset {
    return this.bb.capacity() - this.space;
  }

  /**
   * Doubles the size of the backing ByteBuffer and copies the old data towards
   * the end of the new buffer (since we build the buffer backwards).
   *
   * @param bb The current buffer with the existing data
   * @returns A new byte buffer with the old data copied
   * to it. The data is located at the end of the buffer.
   */
  static growByteBuffer(bb: ByteBuffer): ByteBuffer {
    var old_buf_size = bb.capacity();

    // Ensure we don't grow beyond what fits in an int.
    if (old_buf_size & 0xc0000000) {
      throw new Error("FlatBuffers: cannot grow buffer beyond 2 gigabytes.");
    }

    var new_buf_size = old_buf_size << 1;
    var nbb = ByteBuffer.allocate(new_buf_size);
    nbb.setPosition(new_buf_size - old_buf_size);
    nbb.bytes().set(bb.bytes(), new_buf_size - old_buf_size);
    return nbb;
  }

  /**
   * Adds on offset, relative to where it will be written.
   *
   * @param offset The offset to add
   */
  addOffset(offset: Offset): void {
    this.prep(SIZEOF_INT, 0); // Ensure alignment is already done.
    this.writeInt32(this.offset() - offset + SIZEOF_INT);
  }

  /**
   * Start encoding a new object in the buffer.  Users will not usually need to
   * call this directly. The FlatBuffers compiler will generate helper methods
   * that call this method internally.
   */
  startObject(numfields: number): void {
    this.notNested();
    if (this.vtable == null) {
      this.vtable = [];
    }
    this.vtable_in_use = numfields;
    for (var i = 0; i < numfields; i++) {
      this.vtable[i] = 0; // This will push additional elements as needed
    }
    this.isNested = true;
    this.object_start = this.offset();
  }

  /**
   * Finish off writing the object that is under construction.
   *
   * @returns The offset to the object inside `dataBuffer`
   */
  endObject(): Offset {
    if (this.vtable == null || !this.isNested) {
      throw new Error("FlatBuffers: endObject called without startObject");
    }

    this.addInt32(0);
    var vtableloc = this.offset();

    // Trim trailing zeroes.
    var i = this.vtable_in_use - 1;
    for (; i >= 0 && this.vtable[i] == 0; i--) {}
    var trimmed_size = i + 1;

    // Write out the current vtable.
    for (; i >= 0; i--) {
      // Offset relative to the start of the table.
      this.addInt16(this.vtable[i] != 0 ? vtableloc - this.vtable[i] : 0);
    }

    var standard_fields = 2; // The fields below:
    this.addInt16(vtableloc - this.object_start);
    var len = (trimmed_size + standard_fields) * SIZEOF_SHORT;
    this.addInt16(len);

    // Search for an existing vtable that matches the current one.
    var existing_vtable = 0;
    var vt1 = this.space;
    outer_loop: for (i = 0; i < this.vtables.length; i++) {
      var vt2 = this.bb.capacity() - this.vtables[i];
      if (len == this.bb.readInt16(vt2)) {
        for (var j = SIZEOF_SHORT; j < len; j += SIZEOF_SHORT) {
          if (this.bb.readInt16(vt1 + j) != this.bb.readInt16(vt2 + j)) {
            continue outer_loop;
          }
        }
        existing_vtable = this.vtables[i];
        break;
      }
    }

    if (existing_vtable) {
      // Found a match:
      // Remove the current vtable.
      this.space = this.bb.capacity() - vtableloc;

      // Point table to existing vtable.
      this.bb.writeInt32(this.space, existing_vtable - vtableloc);
    } else {
      // No match:
      // Add the location of the current vtable to the list of vtables.
      this.vtables.push(this.offset());

      // Point table to current vtable.
      this.bb.writeInt32(
        this.bb.capacity() - vtableloc,
        this.offset() - vtableloc
      );
    }

    this.isNested = false;
    return vtableloc;
  }

  finish(root_table: Offset, file_identifier?: string): void {
    if (file_identifier) {
      this.prep(this.minalign, SIZEOF_INT + FILE_IDENTIFIER_LENGTH);
      if (file_identifier.length != FILE_IDENTIFIER_LENGTH) {
        throw new Error(
          "FlatBuffers: file identifier must be length " +
            FILE_IDENTIFIER_LENGTH
        );
      }
      for (var i = FILE_IDENTIFIER_LENGTH - 1; i >= 0; i--) {
        this.writeInt8(file_identifier.charCodeAt(i));
      }
    }
    this.prep(this.minalign, SIZEOF_INT);
    this.addOffset(root_table);
    this.bb.setPosition(this.space);
  }

  /**
   * This checks a required field has been set in a given table that has
   * just been constructed.
   */
  requiredField(table: Offset, field: number): void {
    var table_start = this.bb.capacity() - table;
    var vtable_start = table_start - this.bb.readInt32(table_start);
    var ok = this.bb.readInt16(vtable_start + field) != 0;

    // If this fails, the caller will show what field needs to be set.
    if (!ok) {
      throw new Error("FlatBuffers: field " + field + " must be set");
    }
  }

  /**
   * Start a new array/vector of objects.  Users usually will not call
   * this directly. The FlatBuffers compiler will create a start/end
   * method for vector types in generated code.
   *
   * @param elem_size The size of each element in the array
   * @param num_elems The number of elements in the array
   * @param alignment The alignment of the array
   */
  startVector(elem_size: number, num_elems: number, alignment: number): void {
    this.notNested();
    this.vector_num_elems = num_elems;
    this.prep(SIZEOF_INT, elem_size * num_elems);
    this.prep(alignment, elem_size * num_elems); // Just in case alignment > int.
  }

  /**
   * Finish off the creation of an array and all its elements. The array must be
   * created with `startVector`.
   *
   * @returns The offset at which the newly created array
   * starts.
   */
  endVector(): Offset {
    this.writeInt32(this.vector_num_elems);
    return this.offset();
  }

  /**
   * Encode the string `s` in the buffer using UTF-8. If a Uint8Array is passed
   * instead of a string, it is assumed to contain valid UTF-8 encoded data.
   *
   * @param s The string to encode
   * @return The offset in the buffer where the encoded string starts
   */
  createString(s: string | Uint8Array): Offset {
    var utf8;
    if (s instanceof Uint8Array) {
      utf8 = s;
    } else {
      utf8 = [];
      var i = 0;

      while (i < s.length) {
        var codePoint;

        // Decode UTF-16
        var a = s.charCodeAt(i++);
        if (a < 0xd800 || a >= 0xdc00) {
          codePoint = a;
        } else {
          var b = s.charCodeAt(i++);
          codePoint = (a << 10) + b + (0x10000 - (0xd800 << 10) - 0xdc00);
        }

        // Encode UTF-8
        if (codePoint < 0x80) {
          utf8.push(codePoint);
        } else {
          if (codePoint < 0x800) {
            utf8.push(((codePoint >> 6) & 0x1f) | 0xc0);
          } else {
            if (codePoint < 0x10000) {
              utf8.push(((codePoint >> 12) & 0x0f) | 0xe0);
            } else {
              utf8.push(
                ((codePoint >> 18) & 0x07) | 0xf0,
                ((codePoint >> 12) & 0x3f) | 0x80
              );
            }
            utf8.push(((codePoint >> 6) & 0x3f) | 0x80);
          }
          utf8.push((codePoint & 0x3f) | 0x80);
        }
      }
    }

    this.addInt8(0);
    this.startVector(1, utf8.length, 1);
    this.bb.setPosition((this.space -= utf8.length));
    for (
      var i = 0, offset = this.space, bytes = this.bb.bytes();
      i < utf8.length;
      i++
    ) {
      bytes[offset++] = utf8[i];
    }
    return this.endVector();
  }

  /**
   * Conveniance function for creating Long objects.
   */
  createLong(low: number, high: number): Long {
    return Long.create(low, high);
  }
}

export class ByteBuffer {
  private position_ = 0;
  constructor(private bytes_: Uint8Array) {}

  // Create and allocate a new ByteBuffer with a given size.
  static allocate(byte_size: number): ByteBuffer {
    return new ByteBuffer(new Uint8Array(byte_size));
  }

  clear(): void {
    throw Error("unimplemented");
  }

  /** Get the underlying `Uint8Array`. */
  bytes(): Uint8Array {
    return this.bytes_;
  }

  /** Get the buffer's position. */
  position(): number {
    return this.position_;
  }

  /** Set the buffer's position. */
  setPosition(position: number): void {
    this.position_ = position;
  }

  /** Get the buffer's capacity. */
  capacity(): number {
    return this.bytes_.length;
  }

  readInt8(offset: number): number {
    return (this.readUint8(offset) << 24) >> 24;
  }

  readUint8(offset: number): number {
    return this.bytes_[offset];
  }

  readInt16(offset: number): number {
    return (this.readUint16(offset) << 16) >> 16;
  }

  readUint16(offset: number): number {
    return this.bytes_[offset] | (this.bytes_[offset + 1] << 8);
  }

  readInt32(offset: number): number {
    return (
      this.bytes_[offset] |
      (this.bytes_[offset + 1] << 8) |
      (this.bytes_[offset + 2] << 16) |
      (this.bytes_[offset + 3] << 24)
    );
  }

  readUint32(offset: number): number {
    return this.readInt32(offset) >>> 0;
  }

  readInt64(offset: number): Long {
    return new Long(this.readInt32(offset), this.readInt32(offset + 4));
  }

  readUint64(offset: number): Long {
    return new Long(this.readUint32(offset), this.readUint32(offset + 4));
  }

  readFloat32(offset: number): number {
    int32[0] = this.readInt32(offset);
    return float32[0];
  }

  readFloat64(offset: number): number {
    int32[isLittleEndian ? 0 : 1] = this.readInt32(offset);
    int32[isLittleEndian ? 1 : 0] = this.readInt32(offset + 4);
    return float64[0];
  }

  writeInt8(offset: number, value: number): void {
    this.bytes_[offset] = /** @type {number} */ (value);
  }

  writeUint8(offset: number, value: number): void {
    this.bytes_[offset] = value;
  }

  writeInt16(offset: number, value: number): void {
    this.bytes_[offset] = value;
    this.bytes_[offset + 1] = value >> 8;
  }

  writeUint16(offset: number, value: number): void {
    this.bytes_[offset] = value;
    this.bytes_[offset + 1] = value >> 8;
  }

  writeInt32(offset: number, value: number): void {
    this.bytes_[offset] = value;
    this.bytes_[offset + 1] = value >> 8;
    this.bytes_[offset + 2] = value >> 16;
    this.bytes_[offset + 3] = value >> 24;
  }

  writeUint32(offset: number, value: number): void {
    this.bytes_[offset] = value;
    this.bytes_[offset + 1] = value >> 8;
    this.bytes_[offset + 2] = value >> 16;
    this.bytes_[offset + 3] = value >> 24;
  }

  writeInt64(offset: number, value: Long): void {
    this.writeInt32(offset, value.low);
    this.writeInt32(offset + 4, value.high);
  }

  writeUint64(offset: number, value: Long): void {
    this.writeUint32(offset, value.low);
    this.writeUint32(offset + 4, value.high);
  }

  writeFloat32(offset: number, value: number): void {
    float32[0] = value;
    this.writeInt32(offset, int32[0]);
  }

  writeFloat64(offset: number, value: number): void {
    float64[0] = value;
    this.writeInt32(offset, int32[isLittleEndian ? 0 : 1]);
    this.writeInt32(offset + 4, int32[isLittleEndian ? 1 : 0]);
  }

  getBufferIdentifier(): string {
    throw Error("unimplemented");
  }

  /**
   * Look up a field in the vtable, return an offset into the object, or 0 if the
   * field is not present.
   */
  __offset(bb_pos: number, vtable_offset: number): number {
    var vtable = bb_pos - this.readInt32(bb_pos);
    return vtable_offset < this.readInt16(vtable)
      ? this.readInt16(vtable + vtable_offset)
      : 0;
  }

  /**
   * Initialize any Table-derived type to point to the union at the given offset.
   */
  __union<T extends Table>(t: T, offset: number): T {
    t.bb_pos = offset + this.readInt32(offset);
    t.bb = this;
    return t;
  }

  /**
   * Create a JavaScript string from UTF-8 data stored inside the FlatBuffer.
   * This allocates a new string and converts to wide chars upon each access.
   *
   * To avoid the conversion to UTF-16, pass Encoding.UTF8_BYTES as
   * the "optionalEncoding" argument. This is useful for avoiding conversion to
   * and from UTF-16 when the data will just be packaged back up in another
   * FlatBuffer later on.
   *
   * @param optionalEncoding Defaults to UTF16_STRING
   */
  __string(offset: number, opt_encoding?: Encoding): string | Uint8Array {
    offset += this.readInt32(offset);

    var length = this.readInt32(offset);
    var result = "";
    var i = 0;

    offset += SIZEOF_INT;

    if (opt_encoding === Encoding.UTF8_BYTES) {
      return this.bytes_.subarray(offset, offset + length);
    }

    while (i < length) {
      var codePoint;

      // Decode UTF-8
      var a = this.readUint8(offset + i++);
      if (a < 0xc0) {
        codePoint = a;
      } else {
        var b = this.readUint8(offset + i++);
        if (a < 0xe0) {
          codePoint = ((a & 0x1f) << 6) | (b & 0x3f);
        } else {
          var c = this.readUint8(offset + i++);
          if (a < 0xf0) {
            codePoint = ((a & 0x0f) << 12) | ((b & 0x3f) << 6) | (c & 0x3f);
          } else {
            var d = this.readUint8(offset + i++);
            codePoint =
              ((a & 0x07) << 18) |
              ((b & 0x3f) << 12) |
              ((c & 0x3f) << 6) |
              (d & 0x3f);
          }
        }
      }

      // Encode UTF-16
      if (codePoint < 0x10000) {
        result += String.fromCharCode(codePoint);
      } else {
        codePoint -= 0x10000;
        result += String.fromCharCode(
          (codePoint >> 10) + 0xd800,
          (codePoint & ((1 << 10) - 1)) + 0xdc00
        );
      }
    }

    return result;
  }

  /**
   * Retrieve the relative offset stored at "offset"
   */
  __indirect(offset: number): number {
    return offset + this.readInt32(offset);
  }

  /**
   * Get the start of data of a vector whose offset is stored at "offset" in this object.
   */
  __vector(offset: number): number {
    return offset + this.readInt32(offset) + SIZEOF_INT; // data starts after the length
  }

  /**
   * Get the length of a vector whose offset is stored at "offset" in this object.
   */
  __vector_len(offset: number): number {
    return this.readInt32(offset + this.readInt32(offset));
  }

  __has_identifier(ident: string): boolean {
    if (ident.length != FILE_IDENTIFIER_LENGTH) {
      throw new Error(
        "FlatBuffers: file identifier must be length " + FILE_IDENTIFIER_LENGTH
      );
    }
    for (var i = 0; i < FILE_IDENTIFIER_LENGTH; i++) {
      if (
        ident.charCodeAt(i) != this.readInt8(this.position_ + SIZEOF_INT + i)
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Conveniance function for creating Long objects.
   */
  createLong(low: number, high: number): Long {
    return Long.create(low, high);
  }
}
