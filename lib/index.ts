import { PassThrough } from 'stream'
import { createWriteStream, promises as fs, readFileSync, WriteStream } from 'fs'
import { once } from 'events'

type BuilderReturns = string | Uint8Array
interface BuilderReadable {
    pipe(destination: PassThrough): unknown
}
export type Builder = BuilderReturns | ((callback: Callback) => void | BuilderReturns | Promise<BuilderReturns> | BuilderReadable) | BuilderReadable

type CallbackFn = (err?: unknown, output?: BuilderReturns) => void
type CallbackPromise = Promise<void>
interface CallbackWithPromise {
    promise: CallbackPromise
}
interface CallbackCancelled {
    canceled: boolean
}
interface CallbackWithStream {
    stream: PassThrough
}
interface CallbackStream {
    write(chunk: any, encoding?: BufferEncoding, cb?: (error: Error | null | undefined) => void): boolean
    write(chunk: any, cb?: (error: Error | null | undefined) => void): boolean
    end(cb?: () => void): void
    end(chunk: any, cb?: () => void): void
    emit(event: "close"): boolean
    emit(event: "data", chunk: any): boolean
    emit(event: "end"): boolean
    emit(event: "error", err: Error): boolean
    emit(event: "pause"): boolean
    emit(event: "readable"): boolean
    emit(event: "resume"): boolean
    emit(event: string | symbol, ...args: any[]): boolean
    end(chunk: any, encoding?: BufferEncoding, cb?: () => void): void
    on(event: "close", listener: () => void): CallbackStream
    on(event: "data", listener: (chunk: any) => void): CallbackStream
    on(event: "end", listener: () => void): CallbackStream
    on(event: "error", listener: (err: Error) => void): CallbackStream
    on(event: "pause", listener: () => void): CallbackStream
    on(event: "readable", listener: () => void): CallbackStream
    on(event: "resume", listener: () => void): CallbackStream
    on(event: string | symbol, listener: (...args: any[]) => void): CallbackStream
    once(event: "close", listener: () => void): CallbackStream
    once(event: "data", listener: (chunk: any) => void): CallbackStream
    once(event: "end", listener: () => void): CallbackStream
    once(event: "error", listener: (err: Error) => void): CallbackStream
    once(event: "pause", listener: () => void): CallbackStream
    once(event: "readable", listener: () => void): CallbackStream
    once(event: "resume", listener: () => void): CallbackStream
    once(event: string | symbol, listener: (...args: any[]) => void): CallbackStream
    removeListener(event: "close", listener: () => void): CallbackStream
    removeListener(event: "data", listener: (chunk: any) => void): CallbackStream
    removeListener(event: "end", listener: () => void): CallbackStream
    removeListener(event: "error", listener: (err: Error) => void): CallbackStream
    removeListener(event: "pause", listener: () => void): CallbackStream
    removeListener(event: "readable", listener: () => void): CallbackStream
    removeListener(event: "resume", listener: () => void): CallbackStream
    removeListener(event: string | symbol, listener: (...args: any[]) => void): CallbackStream
}

type CallbackObj = CallbackCancelled & CallbackWithPromise & CallbackPromise & CallbackWithStream & CallbackStream
export type Callback = CallbackFn & CallbackObj
interface CallbackManager {
    callbackPromise: Promise<BuilderReturns>
    streamPromise: Promise<PassThrough>,
    callbackPromiseResolve: () => Promise<void>
    callback: Callback
}
function getCallback(): CallbackManager {
    let cbFnPromiseResolve: (value: BuilderReturns | PromiseLike<BuilderReturns>) => void
    let cbFnPromiseReject: (reason?: any) => void
    const cbFnPromise = new Promise<BuilderReturns>((resolve, reject) => {
        cbFnPromiseResolve = resolve
        cbFnPromiseReject = reject
    })
    let streamPromiseResolve: (value: PassThrough | PromiseLike<PassThrough>) => void
    const streamPromise = new Promise<PassThrough>(resolve => {
        streamPromiseResolve = resolve
    })
    const callbackFn: CallbackFn = (err, output) => {
        if (output) {
            cbFnPromiseResolve(output)
        } else {
            cbFnPromiseReject(err)
        }
    }
    const callbackCancelled: CallbackCancelled = {
        canceled: false
    }
    let callbackPromiseResolve: () => Promise<void> = async () => { }
    const callbackWithPromise: CallbackWithPromise = {
        promise: new Promise<void>(resolve => {
            callbackPromiseResolve = async () => {
                resolve()
                callback.canceled = true
            }
        })
    }
    const callbackPromise: CallbackPromise = {
        [Symbol.toStringTag]: 'Callback',
        then: <TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) => callbackWithPromise.promise.then<TResult1, TResult2>(onfulfilled, onrejected),
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) => callbackWithPromise.promise.catch<TResult>(onrejected),
        finally: (onfinally?: (() => void) | undefined | null) => callbackWithPromise.promise.finally(onfinally)
    }
    const callbackWithStream: CallbackWithStream = {
        stream: new PassThrough()
    }
    const callbackStream: CallbackStream = {
        write(chunk: any, arg2?: BufferEncoding | ((error: Error | null | undefined) => void), cb?: (error: Error | null | undefined) => void) {
            streamPromiseResolve(callbackWithStream.stream)
            if (typeof arg2 === 'string') {
                return callbackWithStream.stream.write(chunk, arg2, cb)
            } else {
                return callbackWithStream.stream.write(chunk, arg2)
            }
        },
        end(arg1?: (() => void) | any, arg2?: (() => void) | BufferEncoding, cb?: () => void) {
            if (typeof arg2 === 'string') {
                callbackWithStream.stream.end(arg1, arg2, cb)
            } else {
                callbackWithStream.stream.end(arg1, arg2)
            }
        },
        emit(event: string | symbol, ...args: any[]) {
            if (event === 'pipe') {
                streamPromiseResolve(callbackWithStream.stream)
            }
            return callbackWithStream.stream.emit(event, ...args)
        },
        on(event: string | symbol, listener: (...args: any[]) => void) {
            callbackWithStream.stream.on(event, listener)
            return callbackStream
        },
        once(event: string | symbol, listener: (...args: any[]) => void) {
            callbackWithStream.stream.once(event, listener)
            return callbackStream
        },
        removeListener(event: string | symbol, listener: (...args: any[]) => void) {
            callbackWithStream.stream.removeListener(event, listener)
            return callbackStream
        }
    }
    const callbackObj: CallbackObj = {
        ...callbackCancelled,
        ...callbackWithPromise,
        ...callbackPromise,
        ...callbackWithStream,
        ...callbackStream
    }
    const callback: Callback = Object.assign<CallbackFn, CallbackObj>(callbackFn, callbackObj)
    return {
        callbackPromise: cbFnPromise,
        streamPromise: streamPromise,
        callbackPromiseResolve: callbackPromiseResolve,
        callback: callback
    }
}

class FileOutput {
    outputPath: string
    cancel?: () => Promise<void>

    constructor(outputPath: string) {
        this.outputPath = outputPath
    }

    async update(builder: Builder) {
        const cancelPromise = this.cancel && this.cancel()

        const write = async (output: BuilderReturns, callbackPromiseResolve?: () => Promise<void>) => {
            let cancelled = false
            this.cancel = async () => {
                cancelled = true
                callbackPromiseResolve && await callbackPromiseResolve()
            }
            await cancelPromise
            if (!cancelled) {
                const write = fs.writeFile(this.outputPath, output)
                this.cancel = async () => {
                    callbackPromiseResolve && await callbackPromiseResolve()
                    await write
                }
                await write
            }
        }
        const stream = async (output: BuilderReadable | PassThrough, callbackPromiseResolve?: () => Promise<void>) => {
            let cancelled = false
            this.cancel = async () => {
                cancelled = true
                callbackPromiseResolve && await callbackPromiseResolve()
            }
            await cancelPromise
            if (!cancelled) {
                const passThrough = new PassThrough()
                output.pipe(passThrough)
                await new Promise((resolve, reject) => {
                    const writeStream = createWriteStream(this.outputPath)
                    passThrough.pipe(writeStream)
                    this.cancel = async () => {
                        passThrough.unpipe(writeStream)
                        writeStream.close()
                        callbackPromiseResolve && await callbackPromiseResolve()
                    }
                    writeStream.on('close', resolve)
                    writeStream.on('error', reject)
                })
            }
        }
        if (typeof builder === 'function') {
            const {
                callbackPromise,
                streamPromise,
                callbackPromiseResolve,
                callback
            } = getCallback()
            const output = builder(callback)
            if (typeof output === 'string' || output instanceof Uint8Array) {
                await write(output, callbackPromiseResolve)
            } else if (output && 'pipe' in output) {
                await stream(output, callbackPromiseResolve)
            } else if (output) {
                let canceled
                this.cancel = async () => {
                    canceled = true
                    callbackPromiseResolve()
                }
                await output
                if (!canceled) {
                    await write(await output, callbackPromiseResolve)
                }
            } else {
                const cancelPromise = new Promise<void>(resolve => {
                    this.cancel = async () => {
                        resolve()
                        callbackPromiseResolve()
                    }
                })
                const output = await Promise.race<void | BuilderReturns | PassThrough>([
                    cancelPromise,
                    callbackPromise,
                    streamPromise
                ])
                if (output instanceof PassThrough) {
                    await stream(output, callbackPromiseResolve)
                } else if (output) {
                    await write(output, callbackPromiseResolve)
                }
            }
        } else if (typeof builder === 'string' || builder instanceof Uint8Array) {
            await write(builder)
        } else {
            await stream(builder)
        }
    }
}

export default FileOutput
