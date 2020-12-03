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
