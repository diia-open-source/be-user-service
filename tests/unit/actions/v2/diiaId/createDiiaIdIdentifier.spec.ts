import { randomUUID } from 'node:crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'

import CreateDiiaIdIdentifierAction from '@actions/v2/diiaId/createDiiaIdIdentifier'

import AuthService from '@services/auth'
import DiiaIdService from '@services/diiaId'

import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { AuthSchemaCode } from '@interfaces/services/auth'

describe(`Action ${CreateDiiaIdIdentifierAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdService = mockInstance(DiiaIdService)
    const authService = mockInstance(AuthService)

    const action = new CreateDiiaIdIdentifierAction(authService, diiaIdService)

    describe('Method `handler`', () => {
        it('should return identifier and process code using e-resident session type', async () => {
            const args = {
                params: { processId: randomUUID(), signAlgo: SignAlgo.DSTU },
                session: testKit.session.getEResidentSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifier = 'identifier'

            jest.spyOn(authService, 'completeUserAuthSteps').mockResolvedValueOnce()
            jest.spyOn(diiaIdService, 'createDiiaId').mockResolvedValueOnce(identifier)

            expect(await action.handler(args)).toMatchObject({ identifier, processCode: ProcessCode.DiiaIdCreated })

            expect(authService.completeUserAuthSteps).toHaveBeenCalledWith(
                args.session.user,
                AuthSchemaCode.EResidentDiiaIdCreation,
                args.params.processId,
            )
            expect(diiaIdService.createDiiaId).toHaveBeenCalledWith(args.session.user, args.headers.mobileUid, args.params.signAlgo)
        })

        it('should return identifier and process code using user session type', async () => {
            const args = {
                params: { processId: randomUUID(), signAlgo: SignAlgo.DSTU },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifier = 'identifier'

            jest.spyOn(authService, 'completeUserAuthSteps').mockResolvedValueOnce()
            jest.spyOn(diiaIdService, 'createDiiaId').mockResolvedValueOnce(identifier)

            expect(await action.handler(args)).toMatchObject({ identifier, processCode: ProcessCode.DiiaIdCreated })

            expect(authService.completeUserAuthSteps).toHaveBeenCalledWith(
                args.session.user,
                AuthSchemaCode.DiiaIdCreation,
                args.params.processId,
            )
            expect(diiaIdService.createDiiaId).toHaveBeenCalledWith(args.session.user, args.headers.mobileUid, args.params.signAlgo)
        })
    })
})
