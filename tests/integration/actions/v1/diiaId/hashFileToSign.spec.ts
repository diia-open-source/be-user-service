import { ExternalCommunicator } from '@diia-inhouse/diia-queue'
import TestKit from '@diia-inhouse/test'

import HashFileToSignAction from '@src/actions/v1/diiaId/hashFileToSign'
import { SignAlgo } from '@src/generated/diia-id'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/diiaId/hashFileToSign'
import { DiiaIdHashFileResponse } from '@interfaces/externalEventListeners/diiaIdHashFile'

describe(`Action ${HashFileToSignAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>

    let action: HashFileToSignAction
    let external: ExternalCommunicator

    const testKit = new TestKit()

    beforeAll(async () => {
        app = await getApp()
        action = app.container.build(HashFileToSignAction)
        external = app.container.resolve<ExternalCommunicator>('external')
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return file hashes', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()

        jest.spyOn(external, 'receive').mockResolvedValueOnce(<DiiaIdHashFileResponse>{
            processId: '123',
            hash: { name: 'name', hash: 'hash' },
        })

        // Act
        const result = await action.handler({
            headers,
            params: {
                processId: '123',
                file: {
                    name: 'name',
                    file: Buffer.from('{}').toString('base64'),
                },
                signAlgo: SignAlgo.DSTU,
            },
        })

        // Assert
        expect(result).toEqual<ActionResult>({
            hashedFile: {
                name: 'name',
                hash: 'hash',
            },
        })
    })
})
