import { EventEmitter, once } from 'events'
import Readable from 'stream'
import { writeFile } from 'fs/promises'

type CallbackFn = () => void
type CallbackPromise = Promise<void>
interface CallbackWithPromise {
    promise: CallbackPromise
}
interface CallbackCancelled {
    canceled: boolean
}
type Callback = CallbackFn & CallbackCancelled & CallbackWithPromise & CallbackPromise
function getCallback(): Callback {
    const callbackFn: CallbackFn = () => { }
    const callbackCancelled: CallbackCancelled = {
        canceled: false
    }
    const callbackWithPromise: CallbackWithPromise = {
        promise: new Promise(() => { })
    }
    const callback: Callback = Object.assign<CallbackFn, CallbackCancelled, CallbackWithPromise, CallbackPromise>(
        callbackFn,
        callbackCancelled,
        callbackWithPromise,
        {
            [Symbol.toStringTag]: 'Callback',
            then: <TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) => callbackWithPromise.promise.then<TResult1, TResult2>(onfulfilled, onrejected),
            catch: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) => callbackWithPromise.promise.catch<TResult>(onrejected),
            finally: (onfinally?: (() => void) | undefined | null) => callbackWithPromise.promise.finally(onfinally)
        }
    )
    return callback
}

type BuilderReturns = string | Buffer
type Builder = BuilderReturns | ((callback?: Callback) => void | BuilderReturns | Promise<BuilderReturns>) | Readable

class FileOutput {
    outputPath: string
    emitter: EventEmitter

    constructor(outputPath: string) {
        this.outputPath = outputPath
        this.emitter = new EventEmitter()
    }

    async update(builder: Builder) {
        if (typeof builder === 'function') {
            const callback: Callback = getCallback()
            builder(callback)
        } else {
            console.log('write away!', builder)
        }
    }
}

export default FileOutput
