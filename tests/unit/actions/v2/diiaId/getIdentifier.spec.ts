import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDiiaIdIdentifierAction from '@actions/v2/diiaId/getIdentifier'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${GetDiiaIdIdentifierAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdService = mockInstance(DiiaIdService)

    const action = new GetDiiaIdIdentifierAction(diiaIdService)

    describe('Method `handler`', () => {
        it('should return identifier', async () => {
            const args = {
                params: { signAlgo: SignAlgo.DSTU },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifierResponse = {
                identifier: 'identifier',
                hasSigningHistory: true,
                stubMessage: {
                    text: 'text',
                },
            }

            jest.spyOn(diiaIdService, 'getIdentifierV2').mockResolvedValueOnce(identifierResponse)

            expect(await action.handler(args)).toMatchObject(identifierResponse)

            expect(diiaIdService.getIdentifierV2).toHaveBeenCalledWith(args.session.user, args.headers, args.params.signAlgo)
        })
    })
})
