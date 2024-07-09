import { randomUUID } from 'node:crypto'

import { BadRequestError } from '@diia-inhouse/errors'
import { mockInstance } from '@diia-inhouse/test'
import { HttpStatusCode } from '@diia-inhouse/types'

import DiiaIdCertificateCreateEventListener from '@src/externalEventListeners/diiaIdCertificateCreate'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe('DiiaIdCertificateCreateEventListener', () => {
    const diiaIdServiceMock = mockInstance(DiiaIdService)
    const diiaIdCertificateCreateEventListener = new DiiaIdCertificateCreateEventListener(diiaIdServiceMock)

    describe('method: `handler`', () => {
        it('should successfully invoke diia id certificate creation', async () => {
            const now = new Date()
            const message = {
                uuid: randomUUID(),
                response: {
                    certificateSerialNumber: randomUUID(),
                    creationDate: now,
                    expirationDate: new Date(now.getTime() + 300000),
                    identifier: 'identifier',
                    registryUserIdentifier: 'registry-user-identifier',
                    signAlgo: SignAlgo.DSTU,
                },
            }
            const { response } = message

            jest.spyOn(diiaIdServiceMock, 'handleCreateCertificateResponse').mockResolvedValueOnce()

            expect(await diiaIdCertificateCreateEventListener.handler(message)).toBeUndefined()

            expect(diiaIdServiceMock.handleCreateCertificateResponse).toHaveBeenCalledWith(response)
        })

        it('should fail with error', async () => {
            const message = {
                uuid: randomUUID(),
                error: {
                    message: 'Unable to create certificate',
                    http_code: HttpStatusCode.BAD_REQUEST,
                },
            }

            await expect(async () => {
                await diiaIdCertificateCreateEventListener.handler(message)
            }).rejects.toEqual(new BadRequestError('Failed to create certificate', { message }))
        })
    })
})
