/// <reference types="node" />
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
declare class Canceler extends PassThrough implements Promise<void> {
    [Symbol.toStringTag]: string;
    promise: Promise<void>;
    canceled: boolean;
    constructor(emitter: EventEmitter);
    then<TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<TResult>;
    finally(onfinally?: (() => void) | undefined | null): Promise<void>;
}
declare type BuilderReturns = string | Buffer;
declare type Builder = BuilderReturns | ((canceler?: Canceler) => void | BuilderReturns | Promise<BuilderReturns> | ReadableStream);
declare class FileOutput {
    outputPath: string;
    emitter: EventEmitter;
    constructor(outputPath: string);
    update(builder: Builder): Promise<void>;
}
export default FileOutput;
