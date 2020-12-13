import { PassThrough } from 'stream'
import { createWriteStream, promises as fs } from 'fs'
import { EventEmitter, once } from 'events'

// This can be directly written to a file
type BuilderReturns = string | Uint8Array
// Anything with a pipe function is accepted as a readable stream
interface BuilderReadable {
    pipe(destination: PassThrough): unknown
}
// Any of these methods are acceptable
// Directly call with a string or Uint8Array or readable stream
// Function which returns a string or Uint8Array or readable stream
// Function which returns a promise resolving a string or Uint8Array
// Calling callback given to function
// Writing or piping to callback
export type Builder = BuilderReturns | ((callback: Callback) => void | BuilderReturns | Promise<BuilderReturns> | BuilderReadable) | BuilderReadable

// The actual callable function
type CallbackFn = (err?: unknown, output?: BuilderReturns) => void
// A void promise
type CallbackPromise = Promise<void>
// Contains a property called promise, which is used to call then, catch, and finally methods
interface CallbackWithPromise {
    promise: CallbackPromise
}
// A property to check if it's cancelled
interface CallbackCancelled {
    canceled: boolean
}
// An internal property called stream, which is used for writing and piping
interface CallbackWithStream {
    stream: PassThrough
}
// A (write stream)-like interface
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

// All the properties that the callback function has in addition to just being a function
type CallbackObj = CallbackCancelled & CallbackWithPromise & CallbackPromise & CallbackWithStream & CallbackStream
// The callback function with additional properties
export type Callback = CallbackFn & CallbackObj
// Used to manage inputs
interface CallbackManager {
    callbackPromise: Promise<BuilderReturns>
    streamPromise: Promise<PassThrough>,
    callbackPromiseResolve: () => Promise<void>
    callback: Callback
}
// Used by the update method to get a callback to call builder with
function getCallback(): CallbackManager {
    // Functions to resolve / reject the callback promise
    let cbFnPromiseResolve: (value: BuilderReturns | PromiseLike<BuilderReturns>) => void
    let cbFnPromiseReject: (reason?: any) => void
    const cbFnPromise = new Promise<BuilderReturns>((resolve, reject) => {
        cbFnPromiseResolve = resolve
        cbFnPromiseReject = reject
    })
    // Function to resolve the stream promise
    let streamPromiseResolve: (value: PassThrough | PromiseLike<PassThrough>) => void
    const streamPromise = new Promise<PassThrough>(resolve => {
        streamPromiseResolve = resolve
    })
    // Changes callback style to promise style
    const callbackFn: CallbackFn = (err, output) => {
        if (output) {
            cbFnPromiseResolve(output)
        } else {
            cbFnPromiseReject(err)
        }
    }
    // Initially not cancelled
    const callbackCancelled: CallbackCancelled = {
        canceled: false
    }
    // Function used to set cancelled state on callback
    let callbackPromiseResolve: () => Promise<void> = async () => { }
    const callbackWithPromise: CallbackWithPromise = {
        promise: new Promise<void>(resolve => {
            callbackPromiseResolve = async () => {
                // Promise is resolved
                resolve()
                // Cancelled property is true
                callback.canceled = true
            }
        })
    }
    // A promise like interface
    const callbackPromise: CallbackPromise = {
        [Symbol.toStringTag]: 'Callback',
        then: <TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) => callbackWithPromise.promise.then<TResult1, TResult2>(onfulfilled, onrejected),
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) => callbackWithPromise.promise.catch<TResult>(onrejected),
        finally: (onfinally?: (() => void) | undefined | null) => callbackWithPromise.promise.finally(onfinally)
    }
    // Stream referenced by callbackStream
    const callbackWithStream: CallbackWithStream = {
        stream: new PassThrough()
    }
    // Writable like interface
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
    // Use the spread operator to join together the properties
    const callbackObj: CallbackObj = {
        ...callbackCancelled,
        ...callbackWithPromise,
        ...callbackPromise,
        ...callbackWithStream,
        ...callbackStream
    }
    // Assign properties to callback function
    const callback: Callback = Object.assign<CallbackFn, CallbackObj>(callbackFn, callbackObj)
    // Return callback function, as well as apis for cancelling and getting output
    return {
        callbackPromise: cbFnPromise,
        streamPromise: streamPromise,
        callbackPromiseResolve: callbackPromiseResolve,
        callback: callback
    }
}

// It could either be writing a promise or streaming
enum WritingTypes {
    PROMISE = 0,
    STREAM = 1
}
// Options for constructor
interface Options {
    /** 
     * Set to true for better performance when calling the destroy method if you know for sure the file doesn't exist
     * @default false */
    fileDoesNotExist?: boolean
    /** 
     * Whether or not it's okay to read previous content of file.
     * @default true */
    readExisting?: boolean
}
class FileOutput extends EventEmitter {
    // The path to write and read from
    outputPath: string
    // Remember if the file doesn't exist
    fileDoesNotExist: boolean
    // If it's okay to read from file
    fileGood: boolean
    // A function cancelling an update operation
    cancel?: () => Promise<void>
    // Cache of value being written or data being streamed
    writing?: {
        type: WritingTypes.PROMISE
        // This can be referenced because it's kept in memory
        value: BuilderReturns
    } | {
        type: WritingTypes.STREAM
        // An array of chunks that have already been written
        cache: Array<string> | Array<Uint8Array>
        // The active stream
        stream: PassThrough
    }

    constructor(outputPath: string, options?: Options) {
        super()
        this.outputPath = outputPath
        // Use options, by default it's false
        this.fileDoesNotExist = options?.fileDoesNotExist ?? false
        // Use options, by default it's true. File not existing overwrites this option to false.
        this.fileGood = !this.fileDoesNotExist && (options?.readExisting ?? true)
    }

    // Write to the file
    async update(builder: Builder) {
        // Cancel the previous update
        const cancelPromise = this.cancel && this.cancel()

        // Asynchronously write to the file
        const write = async (output: BuilderReturns, callbackPromiseResolve?: () => Promise<void>) => {
            // Whether or not it's cancelled
            let cancelled = false
            this.cancel = async () => {
                cancelled = true
                // Cancel callback if given
                callbackPromiseResolve && await callbackPromiseResolve()
            }
            // Wait for existing file operation to close
            await cancelPromise
            // Do not write if cancelled
            if (!cancelled) {
                const write = fs.writeFile(this.outputPath, output)
                // The file does exist now, because we created it
                this.fileDoesNotExist = false
                this.writing = {
                    type: WritingTypes.PROMISE,
                    value: output
                }
                // Emit write (used by read)
                this.emit('write')
                // There's no way to cancel a writeFile operation, so we need to wait for it to be complete
                this.cancel = async () => {
                    callbackPromiseResolve && await callbackPromiseResolve()
                    await write
                }
                await write
                // The file is good because it contains updated data
                this.fileGood = true
                // Clear cache from memory
                delete this.writing
            }
        }
        // Stream to file
        const stream = async (output: BuilderReadable | PassThrough, callbackPromiseResolve?: () => Promise<void>) => {
            // Whether or not this is cancelled
            let cancelled = false
            this.cancel = async () => {
                cancelled = true
                callbackPromiseResolve && await callbackPromiseResolve()
            }
            // Begin piping data to a PassThrough
            const passThrough = new PassThrough()
            output.pipe(passThrough)
            this.writing = {
                type: WritingTypes.STREAM,
                cache: [],
                stream: passThrough
            }
            // Emit write event
            this.emit('write')
            passThrough.on('data', data => {
                // Throw in garbage if cancelled
                if (!cancelled) {
                    // Add chunk to cache of chunks
                    this.writing?.type === WritingTypes.STREAM && this.writing.cache.push(data)
                }
            })
            // Wait for existing file operation to be complete before creating write stream
            await cancelPromise
            // Make sure it hasn't been cancelled
            if (!cancelled) {
                // new Promise for complex (resolve / reject)ing
                await new Promise((resolve, reject) => {
                    const writeStream = createWriteStream(this.outputPath)
                    // File exists now because we created it
                    this.fileDoesNotExist = false
                    // Write every cached chunk so far
                    if (this.writing?.type === WritingTypes.STREAM) {
                        for (const chunk of this.writing.cache) {
                            writeStream.write(chunk)
                        }
                    }
                    // Pipe future chunks into write stream
                    passThrough.pipe(writeStream)
                    // Unpipe and close stream if cancelled
                    this.cancel = async () => {
                        passThrough.unpipe(writeStream)
                        writeStream.close()
                        callbackPromiseResolve && await callbackPromiseResolve()
                    }
                    writeStream.on('close', resolve)
                    writeStream.on('error', reject)
                })
                // We wrote to the file, so it's good
                this.fileGood = true
                // Clear cache from memory
                delete this.writing
            }
        }
        // Call builder with callback if it's a function
        if (typeof builder === 'function') {
            // Get callback api
            const {
                callbackPromise,
                streamPromise,
                callbackPromiseResolve,
                callback
            } = getCallback()
            // Call builder, providing callback
            const output = builder(callback)
            // If it synchronously returns a string or Uint8Array, write it
            if (typeof output === 'string' || output instanceof Uint8Array) {
                await write(output, callbackPromiseResolve)
            }
            // If it returns a readable, stream it
            else if (output && 'pipe' in output) {
                await stream(output, callbackPromiseResolve)
            }
            // Check if it's returning a promise
            else if (output) {
                let canceled
                this.cancel = async () => {
                    canceled = true
                    callbackPromiseResolve()
                }
                await output
                // Write if not cancelled
                if (!canceled) {
                    await write(await output, callbackPromiseResolve)
                }
            }
            // If it doesn't return anything, that means it will use callback function or write to it
            else {
                // Cancel method as a promise
                const cancelPromise = new Promise<void>(resolve => {
                    this.cancel = async () => {
                        resolve()
                        callbackPromiseResolve()
                    }
                })
                // Accepts 2 different outputs, and also handles cancelling
                const output = await Promise.race<void | BuilderReturns | PassThrough>([
                    cancelPromise,
                    callbackPromise,
                    streamPromise
                ])
                // Callback has been written to
                if (output instanceof PassThrough) {
                    await stream(output, callbackPromiseResolve)
                }
                // Callback function has been called
                else if (output) {
                    await write(output, callbackPromiseResolve)
                }
            }
        }
        // Directly write output if it's a string or Uint8Array 
        else if (typeof builder === 'string' || builder instanceof Uint8Array) {
            await write(builder)
        }
        // Stream the builder if it's a readable stream
        else {
            await stream(builder)
        }
    }

    // Get a string promise of file contents
    async read() {
        // Wait for file to start being written to
        if (!(this.fileGood || this.writing)) {
            await once(this, 'write')
        }
        // Get the result
        const read = async () => {
            if (this.writing) {
                // If it's being written to as a promise
                if (this.writing.type === WritingTypes.PROMISE) {
                    // this.writing.value is either a string or Uint8Array
                    return this.writing.value
                }
                // This is being streamed
                else {
                    // Wait for stream to finish
                    await once(this.writing.stream, 'end')
                    // Concat chunks
                    return ([] as Array<BuilderReturns>).concat(...this.writing.cache).join('')
                }
            } else {
                // Read from file it was written to
                return await fs.readFile(this.outputPath, 'utf8')
            }
        }
        // Keep reading, rereading on overwrites
        while (true) {
            // Either successfully read, overwritten, or destroyed
            const res = await Promise.race([
                read(),
                once(this, 'write'),
                once(this, 'destroy').then(() => Symbol('DESTROYED'))
            ])
            if (res instanceof Uint8Array) {
                return res.toString()
            } else if (typeof res === 'string') {
                return res
            } else if (typeof res === 'symbol') {
                throw new Error('FileOutput was destroyed.')
            }
        }
    }

    /**
     * Cancel update and unlink file
     * @param unlinkFile Whether or not to unlink file if it exists
     * @default true
     */
    async destroy(unlinkFile: boolean = true) {
        // Emit destroy event (for read)
        this.emit('destroy')
        // Cancel existing update
        this.cancel && await this.cancel()
        // Unlink file if specified
        // We don't need to unlink file if we know it doesn't exist
        if (!this.fileDoesNotExist && unlinkFile) {
            try {
                await fs.unlink(this.outputPath)
            } catch (e) {
                // ENOENT codes are okay because our goal it to make sure the file is deleted
                // Any other errors are actual errors
                if (e.code !== 'ENOENT') {
                    throw e
                }
            }
        }
    }
}

export default FileOutput
