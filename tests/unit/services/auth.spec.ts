import { randomUUID } from 'node:crypto'

import { MoleculerService } from '@diia-inhouse/diia-app'

import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ActionVersion, AppUser, PlatformType, SessionType } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import AuthService from '@services/auth'

import { AuthSchemaCode } from '@interfaces/services/auth'

describe(`Service ${AuthService.name}`, () => {
    const testKit = new TestKit()

    const authServiceClient = {
        getSessionById: jest.fn(),
        completeUserAuthSteps: jest.fn(),
        getUserOpenIdData: jest.fn(),
        removeTokensByUserIdentifier: jest.fn(),
    }
    const moleculerServiceMock = mockInstance(MoleculerService)

    const authService = new AuthService(moleculerServiceMock, authServiceClient)

    describe('method: `completeUserAuthSteps`', () => {
        it('should successfully execute method', async () => {
            const user = <AppUser>{ sessionType: SessionType.User }
            const schemaCode = AuthSchemaCode.DiiaIdCreation
            const processId = 'processId'

            jest.spyOn(moleculerServiceMock, 'act').mockResolvedValueOnce(true)

            await authService.completeUserAuthSteps(user, schemaCode, processId)

            expect(moleculerServiceMock.act).toHaveBeenCalledWith(
                'Auth',
                {
                    name: 'completeUserAuthSteps',
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: { schemaCode, processId },
                    session: utils.makeSession(user),
                },
            )
        })
    })

    describe('method: `revokeSubmitAfterUserAuthSteps`', () => {
        it('should return revoke submit result', async () => {
            const mobileUid = 'mobileUid'
            const userIdentifier = 'userIdentifier'
            const schemaCode = AuthSchemaCode.DiiaIdCreation

            const result = {
                success: true,
                revokedActions: 1,
            }

            jest.spyOn(moleculerServiceMock, 'act').mockResolvedValueOnce(result)

            expect(await authService.revokeSubmitAfterUserAuthSteps(mobileUid, userIdentifier, schemaCode)).toMatchObject(result)

            expect(moleculerServiceMock.act).toHaveBeenCalledWith(
                'Auth',
                {
                    name: 'revokeSubmitAfterUserAuthSteps',
                    actionVersion: ActionVersion.V1,
                },
                {
                    params: { mobileUid, userIdentifier, code: schemaCode },
                },
            )
        })
    })

    describe('method: `getSessionById`', () => {
        it('should successfully return session by id', async () => {
            const sessionId = randomUUID()
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const sessionByIdResponse = {
                status: true,
                platformType: PlatformType.Android,
                platformVersion: '13',
                appVersion: '1.0.0',
            }

            authServiceClient.getSessionById.mockResolvedValueOnce(sessionByIdResponse)

            expect(await authService.getSessionById(sessionId, userIdentifier)).toEqual(sessionByIdResponse)

            expect(authServiceClient.getSessionById).toHaveBeenCalledWith({ id: sessionId, userIdentifier })
        })
    })
})
