import toMd from 'jsdoc-to-markdown'
import { writeFileSync } from 'fs'
import { ensureDirSync } from 'fs-extra'
import { join } from 'path'

ensureDirSync(join(__dirname, '../doc'))
writeFileSync(join(__dirname, '../doc/api.md'), toMd.renderSync({
    files: join(__dirname, '../lib/index.js')
}))
