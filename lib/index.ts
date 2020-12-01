import { EventEmitter } from 'events'
import { PassThrough } from 'stream'

type BuilderReturns = string | Uint8Array
interface BuilderReadable {
    pipe(destination: PassThrough): unknown
}
type Builder = BuilderReturns | ((callback: Callback) => void | BuilderReturns | Promise<BuilderReturns> | BuilderReadable) | BuilderReadable

type CallbackFn = (output: BuilderReturns) => void
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
function getCallback(): Callback {
    const callbackFn: CallbackFn = () => { }
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
    emitter: EventEmitter

    constructor(outputPath: string) {
        this.outputPath = outputPath
        this.emitter = new EventEmitter()
    }

    async update(builder: Builder) {
        const write = (output: BuilderReturns) => {
            console.log('write away!', output)
        }
        const stream = (output: BuilderReadable) => {
            console.log('Streams not supported yet')
        }
        if (typeof builder === 'function') {
            const callback: Callback = getCallback()
            const output = builder(callback)
            if (typeof output === 'string' || output instanceof Uint8Array) {
                write(output)
            } else if (output && 'pipe' in output) {
                stream(output)
            } else if (output) {
                write(await output)
            }
        } else if (typeof builder === 'string' || builder instanceof Uint8Array) {
            write(builder)
        } else {
            stream(builder)
        }
    }
}

export default FileOutput
