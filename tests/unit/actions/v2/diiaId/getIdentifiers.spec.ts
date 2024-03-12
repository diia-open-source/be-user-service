import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDiiaIdIdentifiersAction from '@actions/v2/diiaId/getIdentifiers'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${GetDiiaIdIdentifiersAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdService = mockInstance(DiiaIdService)

    const action = new GetDiiaIdIdentifiersAction(diiaIdService)

    describe('Method `handler`', () => {
        it('should return identifier', async () => {
            const args = {
                params: { signAlgo: SignAlgo.DSTU },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const response = {
                identifiers: [{ identifier: 'identifier', signAlgo: SignAlgo.DSTU }],
                buttonHistoryName: 'buttonHistoryName',
            }

            jest.spyOn(diiaIdService, 'getIdentifiers').mockResolvedValueOnce(response)

            expect(await action.handler(args)).toMatchObject(response)

            expect(diiaIdService.getIdentifiers).toHaveBeenCalledWith(args.session.user, args.headers)
        })
    })
})
