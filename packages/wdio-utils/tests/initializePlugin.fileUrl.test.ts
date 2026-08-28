import path from 'node:path'
import url from 'node:url'
import { describe, expect, it } from 'vitest'

import initializePlugin from '../src/initializePlugin.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const pluginPath = path.resolve(__dirname, '__fixtures__', 'plugins', 'plugin%fixture.mjs')

describe('initializePlugin file URLs', () => {
    it('loads an absolute plugin path containing a URL-reserved character', async () => {
        const { default: Service } = await initializePlugin(pluginPath, 'service')
        const service = new Service({} as any, {}, {})

        expect(service.foo).toBe('foo')
    })
})
