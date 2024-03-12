const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import DiiaLogger from '@diia-inhouse/diia-logger'
import { mockInstance } from '@diia-inhouse/test'

import MockProvider from '@providers/creditHistory/mock'

const loggerMock = mockInstance(DiiaLogger)

const provider = new MockProvider(loggerMock)

describe('MockProvider', () => {
    it('should return uuid', async () => {
        uuidV4Stub.mockReturnValueOnce('uuid')

        expect(await provider.subscribe()).toBe('uuid')
    })

    it('should return undefined after publish subscription', async () => {
        expect(await provider.publishSubscription()).toBeUndefined()
    })

    it('should return undefined after unsubscription', async () => {
        expect(await provider.unsubscribe()).toBeUndefined()
    })
})
