import { dirname } from 'dirname-filename-esm'
import { join } from 'path'
import FileOutput from './index.js'
import { Readable } from 'stream'

const __dirname = dirname(import.meta)

const fileOutput = new FileOutput(join(__dirname, './output.txt'))

fileOutput.update(Readable.from([]))
