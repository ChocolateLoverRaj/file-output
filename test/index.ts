import FileOutput, { Builder, Callback } from '../lib/index'
import mock from 'mock-fs'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { strictEqual, rejects } from 'assert'
import { Readable } from 'stream'
import tick from 'p-immediate'
import toString from 'stream-to-string'

beforeEach(() => {
  mock()
})

afterEach(() => {
  mock.restore()
})

describe('update', () => {
  async function testUpdate (v: Builder, expected?: string): Promise<void> {
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
          callback(undefined, 'hi')
        }, 'hi')
      })

      it('Uint8Array', async () => {
        await testUpdate(callback => {
          const buff = Buffer.allocUnsafe(2)
          buff.write('hi')
          callback(undefined, buff)
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
    const update = fileOutput.update(cb => {
      callback = cb
    })
    let callbackResolved: boolean = false
    callback
      ?.then(() => {
        callbackResolved = true
      })
      .catch(() => {
        // TODO: #1
      })
    await fileOutput.cancel?.()
    strictEqual(callbackResolved, true)
    strictEqual(callback?.canceled, true)
    await update
  })

  it('write', async () => {
    const fileOutput = new FileOutput('file')
    const update = fileOutput.update('hi')
    await Promise.resolve()
    await fileOutput.cancel?.()
    strictEqual(readFileSync('file', 'utf8'), 'hi')
    await update
  })

  it('promise', async () => {
    const fileOutput = new FileOutput('file')
    const update = fileOutput.update(async () => 'hi')
    await fileOutput.cancel?.()
    strictEqual(existsSync('file'), false)
    await update
  })

  it('stream', async () => {
    const fileOutput = new FileOutput('file')
    const update = fileOutput.update(Readable.from('hi'))
    await fileOutput.cancel?.()
    strictEqual(existsSync('file'), false)
    await update
  })

  it('pipe', async () => {
    const fileOutput = new FileOutput('file')
    const update = fileOutput.update(callback => {
      Promise.resolve()
        .then(() => {
          Readable.from('hi').pipe(callback as unknown as NodeJS.WritableStream)
        })
        .catch(() => {
          // TODO: #1
        })
    })
    await fileOutput.cancel?.()
    strictEqual(existsSync('file'), false)
    await update
  })

  it('callback', async () => {
    const fileOutput = new FileOutput('file')
    const update = fileOutput.update(callback => {
      Promise.resolve()
        .then(() => {
          callback(undefined, 'hi')
        })
        .catch(() => {
          // TODO: #1
        })
    })
    await fileOutput.cancel?.()
    strictEqual(existsSync('file'), false)
    await update
  })
})

describe('overwrite', () => {
  async function testUpdate (v: Builder): Promise<void> {
    const fileOutput = new FileOutput('file')
    const update = fileOutput.update(v)
    await fileOutput.update('hello')
    strictEqual(readFileSync('file', 'utf8'), 'hello')
    await update
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
      Promise.resolve()
        .then(() => {
          Readable.from('hi').pipe(callback as unknown as NodeJS.WritableStream)
        })
        .catch(() => {
          // TODO: #1
        })
    })
  })

  it('callback', async () => {
    await testUpdate(callback => {
      Promise.resolve()
        .then(() => {
          callback(undefined, 'hi')
        })
        .catch(() => {
          // TODO: #1
        })
    })
  })
})

describe('destroy', () => {
  it('cancels', async () => {
    const fileOutput = new FileOutput('file')
    let canceled: boolean = false
    const update = fileOutput.update(callback => {
      callback
        .then(() => {
          canceled = true
        })
        .catch(e => {
          throw e
        })
    })
    await fileOutput.destroy()
    strictEqual(canceled, true)
    await update
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
    var update = fileOutput.update(async () => 'hi')
    const read = fileOutput.read()
    update = fileOutput.update('hello')
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

  it('future', async () => {
    const fileOutput = new FileOutput('file', { readExisting: false })
    const read = fileOutput.read()
    await tick()
    await fileOutput.update('hi')
    strictEqual(await read, 'hi')
  })
})

describe('readStream', () => {
  describe('writing', () => {
    it('promise', async () => {
      const fileOutput = new FileOutput('file', { readExisting: false })
      const update = fileOutput.update(async () => 'hi')
      strictEqual(await toString(fileOutput.readStream()), 'hi')
      await update
    })

    it('stream', async () => {
      const fileOutput = new FileOutput('file')
      const update = fileOutput.update(Readable.from('hi'))
      strictEqual(await toString(fileOutput.readStream()), 'hi')
      await update
    })
  })

  it('createReadStream', async () => {
    const fileOutput = new FileOutput('file')
    await fileOutput.update('hi')
    strictEqual(await toString(fileOutput.readStream()), 'hi')
  })

  it('overwrite', async () => {
    const fileOutput = new FileOutput('file')
    var update = fileOutput.update(Readable.from(['hi', ' ', 'hello']))
    const readStream = fileOutput.readStream()
    update = fileOutput.update('hello')
    await rejects(toString(readStream), new Error('Write has been cancelled and it is outdated.'))
    await update
  })

  it('destroy', async () => {
    const fileOutput = new FileOutput('file', { readExisting: false })
    const readStream = fileOutput.readStream()
    const destroy = fileOutput.destroy()
    await rejects(toString(readStream), new Error('FileOutput was destroyed.'))
    await destroy
  })

  it('future', async () => {
    const fileOutput = new FileOutput('file', { readExisting: false })
    const read = fileOutput.readStream()
    await tick()
    await fileOutput.update('hi')
    strictEqual(await toString(read), 'hi')
  })
})

describe('file good', () => {
  describe('constructor', () => {
    it('false', () => {
      strictEqual(new FileOutput('file', { readExisting: false }).fileGood, false)
    })

    it('implicit false', () => {
      strictEqual(new FileOutput('file', { fileDoesNotExist: true }).fileGood, false)
    })
  })

  it('write promise', async () => {
    const fileOutput = new FileOutput('file', { readExisting: false })
    await fileOutput.update('hi')
    strictEqual(fileOutput.fileGood, true)
  })

  it('write stream', async () => {
    const fileOutput = new FileOutput('file', { readExisting: false })
    await fileOutput.update(Readable.from('hi'))
    strictEqual(fileOutput.fileGood, true)
  })
})
