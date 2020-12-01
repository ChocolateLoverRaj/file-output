/// <reference types="node" />
import { EventEmitter } from 'events';
import Readable from 'stream';
declare type CallbackFn = () => void;
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
declare type BuilderReturns = string | Uint8Array;
declare type Builder = BuilderReturns | ((callback?: Callback) => void | BuilderReturns | Promise<BuilderReturns>) | Readable;
declare class FileOutput {
    outputPath: string;
    emitter: EventEmitter;
    constructor(outputPath: string);
    update(builder: Builder): Promise<void>;
}
export default FileOutput;
