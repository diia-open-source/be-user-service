import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDiiaIdIdentifiersAction from '@actions/v1/diiaId/getIdentifiers'

import DiiaIdService from '@services/diiaId'

describe(`Action ${GetDiiaIdIdentifiersAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const getDiiaIdIdentifiersAction = new GetDiiaIdIdentifiersAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return diiaId', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifiers = {
                identifiers: [],
                hasSigningHistory: true,
            }

            jest.spyOn(diiaIdServiceMock, 'getIdentifiersV1').mockResolvedValueOnce(identifiers)

            expect(await getDiiaIdIdentifiersAction.handler(args)).toMatchObject(identifiers)

            expect(diiaIdServiceMock.getIdentifiersV1).toHaveBeenCalledWith(args.session.user, args.headers)
        })
    })
})
