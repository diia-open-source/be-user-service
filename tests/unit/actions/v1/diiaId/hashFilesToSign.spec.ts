import TestKit, { mockInstance } from '@diia-inhouse/test'

import HashFilesToSignAction from '@actions/v1/diiaId/hashFilesToSign'

import DiiaIdService from '@services/diiaId'

import { HashedFile } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${HashFilesToSignAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const hashFilesToSignAction = new HashFilesToSignAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return hashed files', async () => {
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
                    options: {
                        signType: DiiaIdSignType.EU_SIGN_TYPE_CADES_BES,
                        noSigningTime: true,
                        noContentTimestamp: true,
                    },
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const hashedFiles: HashedFile[] = []

            jest.spyOn(diiaIdServiceMock, 'hashFilesToSign').mockResolvedValueOnce(hashedFiles)

            expect(await hashFilesToSignAction.handler(args)).toMatchObject({ hashedFiles })

            expect(diiaIdServiceMock.hashFilesToSign).toHaveBeenCalledWith(
                args.session.user,
                args.headers.mobileUid,
                args.params.files,
                args.params.signAlgo,
                args.params.options,
            )
        })
    })
})
