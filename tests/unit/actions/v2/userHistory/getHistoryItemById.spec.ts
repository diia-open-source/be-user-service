import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ContentType } from '@diia-inhouse/types'

import GetHistoryItemByIdAction from '@actions/v2/userHistory/getHistoryItemById'

import UserSigningHistoryService from '@services/userSigningHistory'

import { UserHistoryCode } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryItemByIdAction.name}`, () => {
    const testKit = new TestKit()
    const userSigningHistoryService = mockInstance(UserSigningHistoryService)

    const action = new GetHistoryItemByIdAction(userSigningHistoryService)

    describe('Method `handler`', () => {
        it('should return signing history item by id', async () => {
            const args = {
                params: { actionCode: UserHistoryCode.Signing, itemId: 'id' },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const response = {
                body: [
                    {
                        titleLabelMlc: { label: 'label' },
                        statusMessageMlc: {
                            icon: 'icon',
                            title: 'title',
                            text: 'text',
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
            }

            jest.spyOn(userSigningHistoryService, 'getSigningHistoryItemById').mockResolvedValueOnce(response)

            expect(await action.handler(args)).toMatchObject(response)

            expect(userSigningHistoryService.getSigningHistoryItemById).toHaveBeenCalledWith(
                args.params.itemId,
                args.session.user.identifier,
                args.params.actionCode,
            )
        })
    })
})
