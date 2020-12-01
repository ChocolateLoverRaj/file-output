/// <reference types="node" />
import { EventEmitter } from 'events';
import Readable from 'stream';
declare type CallbackFn = () => void;
declare type CallbackPromise = Promise<void>;
interface CallbackWithPromise {
    promise: CallbackPromise;
}
declare type Callback = CallbackFn & CallbackWithPromise & CallbackPromise;
declare type BuilderReturns = string | Buffer;
declare type Builder = BuilderReturns | ((callback?: Callback) => void | BuilderReturns | Promise<BuilderReturns>) | Readable;
declare class FileOutput {
    outputPath: string;
    emitter: EventEmitter;
    constructor(outputPath: string);
    update(builder: Builder): Promise<void>;
}
export default FileOutput;
