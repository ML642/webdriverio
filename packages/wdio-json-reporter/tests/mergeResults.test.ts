import fs from 'node:fs/promises'
import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import mergeResults from '../src/mergeResults.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const fixtureDir = path.resolve(__dirname, '__fixtures__')

let resultsDir: string

beforeEach(async () => {
    resultsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-json-reporter-'))
    await fs.cp(fixtureDir, resultsDir, { recursive: true })
})

afterEach(async () => {
    await fs.rm(resultsDir, { force: true, recursive: true })
})

describe('mergeResults', () => {
    it('should merge json result correctly', async () => {
        const result = await mergeResults(resultsDir, 'wdio-.*.json')
        expect(result.capabilities).toHaveLength(2)
        expect(result.specs).toHaveLength(2)
        expect(result.suites).toHaveLength(2)
    })

    it('writes the merged result using the default filename', async () => {
        const result = await mergeResults(resultsDir, 'wdio-.*.json')
        const contents = await fs.readFile(path.join(resultsDir, 'wdio-merged.json'), 'utf8')

        expect(JSON.parse(contents)).toEqual(result)
    })

    it('reports a missing results directory clearly', async () => {
        const missingDir = path.join(resultsDir, 'missing')

        await expect(mergeResults(missingDir, 'wdio-.*.json'))
            .rejects.toThrow(`Directory "${missingDir}" does not exist.`)
    })

    it('preserves file order when reads complete out of order', async () => {
        const readFile = fs.readFile.bind(fs)
        vi.spyOn(fs, 'readFile').mockImplementation(async (file, options) => {
            if (path.basename(file.toString()) === 'wdio-0-0-json-reporter.json') {
                await new Promise((resolve) => setTimeout(resolve, 25))
            }

            return readFile(file, options as BufferEncoding)
        })

        const result = await mergeResults(resultsDir, 'wdio-.*.json')

        expect(result.specs).toEqual([
            'file:///path/to/project/mocha.test.js',
            'file:///path/to/project/mocha2.test.js'
        ])
    })
})
