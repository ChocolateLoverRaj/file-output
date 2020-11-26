import { EventEmitter, once } from 'events'
import { PassThrough } from 'stream'
import { writeFile } from 'fs/promises'

class Canceler extends PassThrough implements Promise<void> {
    [Symbol.toStringTag] = 'Manager'
    promise: Promise<void>
    canceled: boolean = false

    constructor(emitter: EventEmitter) {
        super()
        this.promise = once(emitter, 'cancel').then(() => {
            this.canceled = true
        })
    }

    then<TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) {
        return this.promise.then<TResult1, TResult2>(onfulfilled, onrejected)
    }
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) {
        return this.promise.then<TResult>(onrejected)
    }
    finally(onfinally?: (() => void) | undefined | null) {
        return this.promise.finally(onfinally)
    }
}
type BuilderReturns = string | Buffer
type Builder = BuilderReturns | ((canceler?: Canceler) => void | BuilderReturns | Promise<BuilderReturns> | ReadableStream)

class FileOutput {
    outputPath: string
    emitter: EventEmitter

    constructor(outputPath: string) {
        this.outputPath = outputPath
        this.emitter = new EventEmitter()
    }

    async update(builder: Builder) {
        if (typeof builder === 'function') {
            const canceler: Canceler = new Canceler(this.emitter)
            builder(canceler)
        }
        else {
            await writeFile(this.outputPath, builder)
        }
    }
}

export default FileOutput
