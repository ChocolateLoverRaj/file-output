/// <reference types="node" />
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
declare type BuilderReturns = string | Uint8Array;
interface BuilderReadable {
    pipe(destination: PassThrough): unknown;
}
declare type Builder = BuilderReturns | ((callback: Callback) => void | BuilderReturns | Promise<BuilderReturns> | BuilderReadable) | BuilderReadable;
declare type CallbackFn = (output: BuilderReturns) => void;
declare type CallbackPromise = Promise<void>;
interface CallbackWithPromise {
    promise: CallbackPromise;
}
interface CallbackCancelled {
    canceled: boolean;
}
interface CallbackStream {
    write(str: string): Promise<void>;
    end(): Promise<void>;
}
declare type CallbackObj = CallbackCancelled & CallbackWithPromise & CallbackPromise & CallbackStream;
declare type Callback = CallbackFn & CallbackObj;
declare class FileOutput {
    outputPath: string;
    emitter: EventEmitter;
    constructor(outputPath: string);
    update(builder: Builder): Promise<void>;
}
export default FileOutput;
