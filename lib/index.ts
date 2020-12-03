import { PassThrough } from 'stream'
import { createWriteStream, promises as fs } from 'fs'

type BuilderReturns = string | Uint8Array
interface BuilderReadable {
    pipe(destination: PassThrough): unknown
}
export type Builder = BuilderReturns | ((callback: Callback) => void | BuilderReturns | Promise<BuilderReturns> | BuilderReadable) | BuilderReadable

type CallbackFn = (err: unknown, output: BuilderReturns) => void
type CallbackPromise = Promise<void>
interface CallbackWithPromise {
    promise: CallbackPromise
}
interface CallbackCancelled {
    canceled: boolean
}
interface CallbackStream {
    write(str: string): Promise<void>
    end(): Promise<void>
}

type CallbackObj = CallbackCancelled & CallbackWithPromise & CallbackPromise & CallbackStream
type Callback = CallbackFn & CallbackObj
function getCallback(callbackFn: CallbackFn): Callback {
    const callbackCancelled: CallbackCancelled = {
        canceled: false
    }
    const callbackWithPromise: CallbackWithPromise = {
        promise: new Promise(() => { })
    }
    const callbackPromise: CallbackPromise = {
        [Symbol.toStringTag]: 'Callback',
        then: <TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) => callbackWithPromise.promise.then<TResult1, TResult2>(onfulfilled, onrejected),
        catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) => callbackWithPromise.promise.catch<TResult>(onrejected),
        finally: (onfinally?: (() => void) | undefined | null) => callbackWithPromise.promise.finally(onfinally)
    }
    const callbackStream: CallbackStream = {
        async write() { },
        async end() { }
    }
    const callbackObj: CallbackObj = {
        ...callbackCancelled,
        ...callbackWithPromise,
        ...callbackPromise,
        ...callbackStream
    }
    const callback: Callback = Object.assign<CallbackFn, CallbackObj>(callbackFn, callbackObj)
    return callback
}

class FileOutput {
    outputPath: string

    constructor(outputPath: string) {
        this.outputPath = outputPath
    }

    async update(builder: Builder) {
        const write = async (output: BuilderReturns) => {
            await fs.writeFile(this.outputPath, output)
        }
        const stream = (output: BuilderReadable) => {
            const writeStream = createWriteStream(this.outputPath)
            const passThrough = new PassThrough()
                .on('data', data => {
                    writeStream.write(data)
                })
                .once('end', () => {
                    writeStream.end()
                })
            output.pipe(passThrough)
        }
        if (typeof builder === 'function') {
            let callbackFn: CallbackFn | undefined
            const callbackPromise = new Promise<BuilderReturns>((resolve, reject) => {
                callbackFn = (err, output) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(output)
                    }
                }
            })
            const callback: Callback = getCallback(callbackFn as CallbackFn)
            const output = builder(callback)
            if (typeof output === 'string' || output instanceof Uint8Array) {
                await write(output)
            } else if (output && 'pipe' in output) {
                stream(output)
            } else if (output) {
                await write(await output)
            } else {
                await write(await callbackPromise)
            }

        } else if (typeof builder === 'string' || builder instanceof Uint8Array) {
            await write(builder)
        } else {
            stream(builder)
        }
    }
}

export default FileOutput
