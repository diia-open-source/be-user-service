import TestKit, { mockInstance } from '@diia-inhouse/test'

import InitHashesSigningAction from '@actions/v1/diiaId/initHashesSigning'

import DiiaIdService from '@services/diiaId'

import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'

describe(`Action ${InitHashesSigningAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdServiceMock = mockInstance(DiiaIdService)

    const initHashesSigningAction = new InitHashesSigningAction(diiaIdServiceMock)

    describe('Method `handler`', () => {
        it('should return true if successfully initialized hashes signing', async () => {
            const args = {
                params: {
                    signAlgo: SignAlgo.DSTU,
                    signType: DiiaIdSignType.EU_SIGN_TYPE_CADES_BES,
                    noSigningTime: true,
                    noContentTimestamp: true,
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            jest.spyOn(diiaIdServiceMock, 'initHashesSigning').mockResolvedValueOnce(true)

            expect(await initHashesSigningAction.handler(args)).toMatchObject({ success: true })

            expect(diiaIdServiceMock.initHashesSigning).toHaveBeenCalledWith(
                args.session.user.identifier,
                args.headers.mobileUid,
                args.params.signAlgo,
                args.params.signType,
                args.params.noSigningTime,
                args.params.noContentTimestamp,
            )
        })
    })
})
