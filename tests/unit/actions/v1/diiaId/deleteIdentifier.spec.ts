import TestKit, { mockInstance } from '@diia-inhouse/test'

import DeleteDiiaIdIdentifierAction from '@actions/v1/diiaId/deleteIdentifier'

import DiiaIdService from '@services/diiaId'

import { ProcessCode } from '@interfaces/services'

describe(`Action ${DeleteDiiaIdIdentifierAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const deleteDiiaIdIdentifierAction = new DeleteDiiaIdIdentifierAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return true and DiiaIdSuccessfullyDeleted process code', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            jest.spyOn(diiaIdServiceMock, 'softDeleteIdentifiers').mockResolvedValueOnce(true)

            expect(await deleteDiiaIdIdentifierAction.handler(args)).toMatchObject({
                success: true,
                processCode: ProcessCode.DiiaIdSuccessfullyDeleted,
            })

            expect(diiaIdServiceMock.softDeleteIdentifiers).toHaveBeenCalledWith(args.session.user.identifier, {
                mobileUid: args.headers.mobileUid,
            })
        })

        it('should return true and DiiaIdNotFound process code', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            jest.spyOn(diiaIdServiceMock, 'softDeleteIdentifiers').mockResolvedValueOnce(false)

            expect(await deleteDiiaIdIdentifierAction.handler(args)).toMatchObject({
                success: true,
                processCode: ProcessCode.DiiaIdNotFound,
            })

            expect(diiaIdServiceMock.softDeleteIdentifiers).toHaveBeenCalledWith(args.session.user.identifier, {
                mobileUid: args.headers.mobileUid,
            })
        })
    })
})
