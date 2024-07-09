import { randomUUID } from 'node:crypto'

import DiiaLogger from '@diia-inhouse/diia-logger'
import { mockInstance } from '@diia-inhouse/test'
import { HttpStatusCode } from '@diia-inhouse/types'

import DiiaIdSignHashesInitEventListener from '@src/externalEventListeners/diiaIdSignHashesInit'

describe('DiiaIdSignHashesInitEventListener', () => {
    const loggerMock = mockInstance(DiiaLogger)
    const diiaIdSignHashesInitEventListener = new DiiaIdSignHashesInitEventListener(loggerMock)

    describe('method: `handler`', () => {
        it('should just return in case no error received', async () => {
            const message = {
                uuid: randomUUID(),
            }

            expect(await diiaIdSignHashesInitEventListener.handler(message)).toBeUndefined()
        })

        it('should just log error in case error is received', async () => {
            const message = {
                uuid: randomUUID(),
                error: {
                    message: 'Unable to init',
                    http_code: HttpStatusCode.BAD_REQUEST,
                },
            }
            const { error } = message

            expect(await diiaIdSignHashesInitEventListener.handler(message)).toBeUndefined()

            expect(loggerMock.fatal).toHaveBeenCalledWith('Received error response on diia-id.sign.hashes.init', { error })
        })
    })
})
