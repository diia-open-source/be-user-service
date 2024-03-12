import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDpsHashFilesToSignAction from '@actions/v1/diiaId/getDpsHashFilesToSign'

import DiiaIdService from '@services/diiaId'

import { HashedFile } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${GetDpsHashFilesToSignAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const getDpsHashFilesToSignAction = new GetDpsHashFilesToSignAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return hashedFiles', async () => {
            const args = {
                params: {
                    files: [
                        {
                            name: 'name',
                            file: 'file',
                            isRequireInternalSign: true,
                        },
                    ],
                    signAlgo: SignAlgo.DSTU,
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const hashedFiles: HashedFile[] = []

            jest.spyOn(diiaIdServiceMock, 'getDpsHashFilesToSign').mockResolvedValueOnce(hashedFiles)

            expect(await getDpsHashFilesToSignAction.handler(args)).toMatchObject({ hashedFiles })

            expect(diiaIdServiceMock.getDpsHashFilesToSign).toHaveBeenCalledWith(
                args.session.user.identifier,
                args.headers.mobileUid,
                args.params.files,
                args.params.signAlgo,
            )
        })
    })
})
