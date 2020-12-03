import FileOutput, { Builder } from '../lib/index'
import mock from 'mock-fs'
import { readFileSync } from 'fs'
import { strictEqual } from 'assert'
import { Readable } from 'stream'

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

        /*it('pipe', async () => {
            await testUpdate(callback => {
                Readable.from('hi').pipe(callback as unknown as NodeJS.WritableStream)
            }, 'hi')
        })*/

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
