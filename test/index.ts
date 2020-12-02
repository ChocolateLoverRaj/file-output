import FileOutput from '../lib/index'
import mock from 'mock-fs'

it('mock fs', () => {
    mock({
        f: {
            'a.js': 'hello'
        }
    })
    new FileOutput('').update('hi')
})
