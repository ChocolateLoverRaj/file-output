import FileOutput, { Builder, Callback } from '../lib/index'
import mock from 'mock-fs'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { strictEqual, rejects } from 'assert'
import { Readable } from 'stream'
import tick from 'p-immediate'

beforeEach(() => {
    mock()
})

afterEach(() => {
    mock.restore()
})

describe('update', () => {
    async function testUpdate(v: Builder, expected?: string): Promise<void> {
        const fileOutput = new FileOutput('file')
        await fileOutput.update(v)
        strictEqual(readFileSync('file', 'utf8'), expected ?? v)
    }

    it('string', async () => {
        await testUpdate('hi')
    })

    it('Uint8Array', async () => {
        const buff = Buffer.allocUnsafe(2)
        buff.write('hi')
        await testUpdate(buff, 'hi')
    })

    it('stream', async () => {
        await testUpdate(Readable.from('hi'), 'hi')
    })

    describe('fn', () => {
        it('string', async () => {
            await testUpdate(() => 'hi', 'hi')
        })

        it('Uint8Array', async () => {
            const buff = Buffer.allocUnsafe(2)
            buff.write('hi')
            await testUpdate(() => buff, 'hi')
        })

        it('stream', async () => {
            await testUpdate(Readable.from('hi'), 'hi')
        })

        it('pipe', async () => {
            await testUpdate(callback => {
                Readable.from('hi').pipe(callback as unknown as NodeJS.WritableStream)
            }, 'hi')
        })

        describe('callback', () => {
            it('string', async () => {
                await testUpdate(callback => {
                    callback(false, 'hi')
                }, 'hi')
            })

            it('Uint8Array', async () => {
                await testUpdate(callback => {
                    const buff = Buffer.allocUnsafe(2)
                    buff.write('hi')
                    callback(false, buff)
                }, 'hi')
            })
        })

        describe('promise', () => {
            it('string', async () => {
                await testUpdate(async () => 'hi', 'hi')
            })

            it('Uint8Array', async () => {
                const buff = Buffer.allocUnsafe(2)
                buff.write('hi')
                await testUpdate(async () => buff, 'hi')
            })
        })
    })
})

describe('cancel', () => {
    it('callback cancelled', async () => {
        const fileOutput = new FileOutput('file')
        let callback: Callback | undefined
        fileOutput.update(cb => {
            callback = cb
        })
        let callbackResolved: boolean = false
        callback && callback.then(() => {
            callbackResolved = true
        })
        await (fileOutput.cancel && fileOutput.cancel())
        strictEqual(callbackResolved, true)
        strictEqual(callback?.canceled, true)
    })

    it('write', async () => {
        const fileOutput = new FileOutput('file')
        fileOutput.update('hi')
        await Promise.resolve()
        await (fileOutput.cancel && fileOutput.cancel())
        strictEqual(readFileSync('file', 'utf8'), 'hi')
    })

    it('promise', async () => {
        const fileOutput = new FileOutput('file')
        fileOutput.update(async () => 'hi')
        await (fileOutput.cancel && fileOutput.cancel())
        strictEqual(existsSync('file'), false)
    })

    it('stream', async () => {
        const fileOutput = new FileOutput('file')
        fileOutput.update(Readable.from('hi'))
        await (fileOutput.cancel && fileOutput.cancel())
        strictEqual(existsSync('file'), false)
    })

    it('pipe', async () => {
        const fileOutput = new FileOutput('file')
        fileOutput.update(callback => {
            Promise.resolve().then(() => {
                Readable.from('hi').pipe(callback as unknown as NodeJS.WritableStream)
            })
        })
        await (fileOutput.cancel && fileOutput.cancel())
        strictEqual(existsSync('file'), false)
    })

    it('callback', async () => {
        const fileOutput = new FileOutput('file')
        fileOutput.update(callback => {
            Promise.resolve().then(() => {
                callback('hi')
            })
        })
        await (fileOutput.cancel && fileOutput.cancel())
        strictEqual(existsSync('file'), false)
    })
})

describe('overwrite', () => {
    async function testUpdate(v: Builder): Promise<void> {
        const fileOutput = new FileOutput('file')
        fileOutput.update(v)
        await fileOutput.update('hello')
        strictEqual(readFileSync('file', 'utf8'), 'hello')
    }

    it('write', async () => {
        await testUpdate('hi')
    })

    it('promise', async () => {
        await testUpdate(async () => 'hi')
    })

    it('stream', async () => {
        await testUpdate(Readable.from('hi'))
    })

    it('pipe', async () => {
        await testUpdate(callback => {
            Promise.resolve().then(() => {
                Readable.from('hi').pipe(callback as unknown as NodeJS.WritableStream)
            })
        })
    })

    it('callback', async () => {
        await testUpdate(callback => {
            Promise.resolve().then(() => {
                callback('hi')
            })
        })
    })
})

describe('destroy', () => {
    it('cancels', async () => {
        const fileOutput = new FileOutput('file')
        let canceled: boolean = false
        fileOutput.update(callback => {
            callback.then(() => {
                canceled = true
            })
        })
        await fileOutput.destroy()
        strictEqual(canceled, true)
    })

    it('unlinks file', async () => {
        const fileOutput = new FileOutput('file')
        await fileOutput.update('hi')
        await fileOutput.destroy()
        strictEqual(existsSync('file'), false)
    })

    it('no unlink', async () => {
        const fileOutput = new FileOutput('file')
        await fileOutput.update('hi')
        await fileOutput.destroy(false)
        strictEqual(existsSync('file'), true)
    })

    describe('detects no unlink', () => {
        it('no unlink', async () => {
            const fileOutput = new FileOutput('file', { fileDoesNotExist: true })
            writeFileSync('file', 'hi')
            await fileOutput.destroy()
            strictEqual(existsSync('file'), true)
        })

        it('unlink', async () => {
            const fileOutput = new FileOutput('file', { fileDoesNotExist: true })
            await fileOutput.update('hi')
            await fileOutput.destroy()
            strictEqual(existsSync('file'), false)
        })
    })
})

describe('read', () => {
    describe('writing', () => {
        it('promise', async () => {
            const fileOutput = new FileOutput('file')
            const update = fileOutput.update(async () => 'hi')
            strictEqual(await fileOutput.read(), 'hi')
            await update
        })

        it('stream', async () => {
            const fileOutput = new FileOutput('file')
            const update = fileOutput.update(Readable.from('hi'))
            strictEqual(await fileOutput.read(), 'hi')
            await update
        })
    })

    it('readFile', async () => {
        const fileOutput = new FileOutput('file')
        await fileOutput.update('hi')
        strictEqual(await fileOutput.read(), 'hi')
    })

    it('overwrite', async () => {
        const fileOutput = new FileOutput('file')
        fileOutput.update(async () => 'hi')
        const read = fileOutput.read()
        const update = fileOutput.update('hello')
        strictEqual(await read, 'hello')
        await update
    })

    it('destroy', async () => {
        const fileOutput = new FileOutput('file')
        const update = fileOutput.update('hi')
        const read = fileOutput.read()
        const destroy = fileOutput.destroy()
        await rejects(read, new Error('FileOutput was destroyed.'))
        await update
        await destroy
    })
})
