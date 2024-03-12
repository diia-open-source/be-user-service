import TestKit, { mockInstance } from '@diia-inhouse/test'

import AreSignedFileHashesValidAction from '@actions/v1/diiaId/areSignedFileHashesValid'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${AreSignedFileHashesValidAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)
    const areSignedFileHashesValidAction = new AreSignedFileHashesValidAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return true if signed file hashes valid', async () => {
            const args = {
                params: {
                    files: [
                        {
                            name: 'name',
                            hash: 'hash',
                            signature: 'signature',
                        },
                    ],
                    signAlgo: SignAlgo.DSTU,
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const result = {
                areValid: true,
                checkResults: [
                    {
                        name: 'name',
                        checked: true,
                    },
                ],
            }

            jest.spyOn(diiaIdServiceMock, 'areSignedFileHashesValid').mockResolvedValueOnce(result)

            expect(await areSignedFileHashesValidAction.handler(args)).toBeTruthy()

            expect(diiaIdServiceMock.areSignedFileHashesValid).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                mobileUid: args.headers.mobileUid,
                files: args.params.files,
                signAlgo: args.params.signAlgo,
            })
        })
    })
})
