import TestKit, { mockInstance } from '@diia-inhouse/test'

import CreateDiiaIdIdentifiersAction from '@actions/v1/diiaId/createIdentifiers'

import AuthService from '@services/auth'
import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { AuthSchemaCode } from '@interfaces/services/auth'

describe(`Action ${CreateDiiaIdIdentifiersAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)
    const authServiceMock = mockInstance(AuthService)

    const createDiiaIdIdentifiersAction = new CreateDiiaIdIdentifiersAction(authServiceMock, diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return identifiers and process code using e-resident session type', async () => {
            const args = {
                params: { processId: 'processId', signAlgo: [SignAlgo.DSTU] },
                session: testKit.session.getEResidentSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifiers = [{ identifier: args.session.user.identifier, signAlgo: args.params.signAlgo[0] }]

            jest.spyOn(authServiceMock, 'completeUserAuthSteps').mockResolvedValueOnce()
            jest.spyOn(diiaIdServiceMock, 'createDiiaIds').mockResolvedValueOnce(identifiers)

            expect(await createDiiaIdIdentifiersAction.handler(args)).toMatchObject({ identifiers, processCode: ProcessCode.DiiaIdCreated })

            expect(authServiceMock.completeUserAuthSteps).toHaveBeenCalledWith(
                args.session.user,
                AuthSchemaCode.EResidentDiiaIdCreation,
                args.params.processId,
            )
            expect(diiaIdServiceMock.createDiiaIds).toHaveBeenCalledWith(args.session.user, args.headers.mobileUid, args.params.signAlgo)
        })

        it('should return identifiers and process code using user session type', async () => {
            const args = {
                params: { processId: 'processId', signAlgo: [SignAlgo.DSTU] },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifiers = [{ identifier: args.session.user.identifier, signAlgo: args.params.signAlgo[0] }]

            jest.spyOn(authServiceMock, 'completeUserAuthSteps').mockResolvedValueOnce()
            jest.spyOn(diiaIdServiceMock, 'createDiiaIds').mockResolvedValueOnce(identifiers)

            expect(await createDiiaIdIdentifiersAction.handler(args)).toMatchObject({ identifiers, processCode: ProcessCode.DiiaIdCreated })

            expect(authServiceMock.completeUserAuthSteps).toHaveBeenCalledWith(
                args.session.user,
                AuthSchemaCode.DiiaIdCreation,
                args.params.processId,
            )
            expect(diiaIdServiceMock.createDiiaIds).toHaveBeenCalledWith(args.session.user, args.headers.mobileUid, args.params.signAlgo)
        })
    })
})
