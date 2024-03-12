import { I18nService } from '@diia-inhouse/i18n'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDiiaIdSigningHistoryAction from '@actions/v2/diiaId/getSigningHistory'

import DiiaIdService from '@services/diiaId'

import { Locales } from '@interfaces/locales'
import { SignAlgo } from '@interfaces/models/diiaId'
import { AttentionMessageParameterType } from '@interfaces/services'
import { DiiaIdIdentifier } from '@interfaces/services/diiaId'

describe(`Action ${GetDiiaIdSigningHistoryAction.name}`, () => {
    const testKit = new TestKit()
    const diiaIdService = mockInstance(DiiaIdService)
    const i18nService = mockInstance(I18nService<Locales>)

    const action = new GetDiiaIdSigningHistoryAction(diiaIdService, i18nService)

    describe('Method `handler`', () => {
        it('should return signing history if identifiers available', async () => {
            const args = {
                params: { skip: 1, limit: 10 },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifiers = [{ identifier: 'identifier', signAlgo: SignAlgo.DSTU }]

            jest.spyOn(diiaIdService, 'getIdentifierAvailability').mockResolvedValueOnce(identifiers)

            expect(await action.handler(args)).toMatchObject({ isAvailable: true, signingRequests: [], total: 0 })

            expect(diiaIdService.getIdentifierAvailability).toHaveBeenCalledWith(args.session.user.identifier, args.headers.mobileUid)
        })

        it('should return signing history if identifiers not available', async () => {
            const args = {
                params: { skip: 1, limit: 10 },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const identifiers: DiiaIdIdentifier[] = []

            jest.spyOn(diiaIdService, 'getIdentifierAvailability').mockResolvedValueOnce(identifiers)
            jest.spyOn(i18nService, 'get').mockReturnValue('test')

            const result = {
                isAvailable: false,
                text: 'test',
                attentionMessage: {
                    text: 'test',
                    icon: '☝️',
                    parameters: [
                        {
                            type: AttentionMessageParameterType.Link,
                            data: {
                                name: 'link1',
                                alt: 'test',
                                resource: 'https://ca.diia.gov.ua/diia_signature_application',
                            },
                        },
                    ],
                },
            }

            expect(await action.handler(args)).toMatchObject(result)

            expect(diiaIdService.getIdentifierAvailability).toHaveBeenCalledWith(args.session.user.identifier, args.headers.mobileUid)
        })
    })
})
