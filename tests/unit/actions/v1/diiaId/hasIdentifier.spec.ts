import TestKit, { mockInstance } from '@diia-inhouse/test'

import HasDiiaIdIdentifierAction from '@actions/v1/diiaId/hasIdentifier'

import DiiaIdService from '@services/diiaId'

describe(`Action ${HasDiiaIdIdentifierAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const hasDiiaIdIdentifierAction = new HasDiiaIdIdentifierAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return true if has identifier', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    mobileUidToFilter: 'mobileUidToFilter',
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            jest.spyOn(diiaIdServiceMock, 'hasIdentifier').mockResolvedValueOnce(true)

            expect(await hasDiiaIdIdentifierAction.handler(args)).toBeTruthy()

            expect(diiaIdServiceMock.hasIdentifier).toHaveBeenCalledWith(args.params.userIdentifier, args.params.mobileUidToFilter)
        })
    })
})
