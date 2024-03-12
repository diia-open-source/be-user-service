import TestKit, { mockInstance } from '@diia-inhouse/test'

import CheckDiiaIdIdentifierAvailabilityAction from '@actions/v2/diiaId/checkIdentifierAvailability'

import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${CheckDiiaIdIdentifierAvailabilityAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdService = mockInstance(DiiaIdService)
    const action = new CheckDiiaIdIdentifierAvailabilityAction(diiaIdService)

    it('should return identifiers', async () => {
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const identifiers = [{ identifier: 'identifier', signAlgo: SignAlgo.DSTU }]

        jest.spyOn(diiaIdService, 'getIdentifierAvailability').mockResolvedValueOnce(identifiers)

        const result = await action.handler({ session, headers })

        expect(diiaIdService.getIdentifierAvailability).toHaveBeenCalledWith(session.user.identifier, headers.mobileUid)
        expect(result).toEqual({ identifiers })
    })
})
