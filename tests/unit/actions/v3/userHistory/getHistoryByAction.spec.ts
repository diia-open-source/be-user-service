import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ContentType } from '@diia-inhouse/types'

import GetHistoryByActionAction from '@actions/v3/userHistory/getHistoryByAction'

import UserHistoryService from '@services/userHistory'

import { UserHistoryCode } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryByActionAction.name}`, () => {
    const testKit = new TestKit()
    const userHistoryService = mockInstance(UserHistoryService)

    const action = new GetHistoryByActionAction(userHistoryService)

    describe('Method `handler`', () => {
        it('should return signing history by code', async () => {
            const args = {
                params: {
                    action: UserHistoryCode.Authorization,
                    session: 'session',
                    skip: 10,
                    limit: 10,
                },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const result = {
                body: [
                    {
                        stubMessageMlc: {
                            icon: 'icon',
                            title: 'title',
                            parameters: [
                                {
                                    type: ContentType.email,
                                    data: {
                                        name: 'name',
                                        alt: 'alt',
                                        resource: 'resource',
                                    },
                                },
                            ],
                        },
                    },
                ],
                total: 1,
            }

            jest.spyOn(userHistoryService, 'getSigningHistoryByCode').mockResolvedValueOnce(result)

            expect(await action.handler(args)).toMatchObject(result)

            expect(userHistoryService.getSigningHistoryByCode).toHaveBeenCalledWith(
                args.params.action,
                args.session.user.identifier,
                args.params.skip,
                args.params.limit,
                args.params.session,
            )
        })
    })
})
