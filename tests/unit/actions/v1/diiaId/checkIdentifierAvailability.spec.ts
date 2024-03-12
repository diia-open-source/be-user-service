import TestKit, { mockInstance } from '@diia-inhouse/test'

import CheckDiiaIdIdentifierAvailabilityAction from '@actions/v1/diiaId/checkIdentifierAvailability'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${CheckDiiaIdIdentifierAvailabilityAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)
    const checkDiiaIdIdentifierAvailabilityAction = new CheckDiiaIdIdentifierAvailabilityAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return identifier', async () => {
            const args = {
                params: { signAlgo: SignAlgo.DSTU },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifiers = [{ identifier: args.session.user.identifier, signAlgo: args.params.signAlgo }]

            jest.spyOn(diiaIdServiceMock, 'getIdentifierAvailability').mockResolvedValueOnce(identifiers)

            expect(await checkDiiaIdIdentifierAvailabilityAction.handler(args)).toMatchObject({ identifier: identifiers[0].identifier })

            expect(diiaIdServiceMock.getIdentifierAvailability).toHaveBeenCalledWith(args.session.user.identifier, args.headers.mobileUid)
        })
    })
})
