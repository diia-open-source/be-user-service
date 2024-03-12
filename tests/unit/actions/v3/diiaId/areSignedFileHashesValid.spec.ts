import TestKit, { mockInstance } from '@diia-inhouse/test'

import AreSignedFileHashesValidAction from '@actions/v3/diiaId/areSignedFileHashesValid'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${AreSignedFileHashesValidAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdService = mockInstance(DiiaIdService)

    const action = new AreSignedFileHashesValidAction(diiaIdService)

    describe('Method `handler`', () => {
        it('should return signing file hashes result', async () => {
            const args = {
                params: {
                    files: [{ name: 'name', hash: 'hash', signature: 'signature' }],
                    returnOriginals: true,
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

            jest.spyOn(diiaIdService, 'areSignedFileHashesValid').mockResolvedValueOnce(result)

            expect(await action.handler(args)).toMatchObject(result)

            expect(diiaIdService.areSignedFileHashesValid).toHaveBeenCalledWith({
                userIdentifier: args.session.user.identifier,
                mobileUid: args.headers.mobileUid,
                files: args.params.files,
                returnOriginals: args.params.returnOriginals,
                signAlgo: args.params.signAlgo,
            })
        })
    })
})
