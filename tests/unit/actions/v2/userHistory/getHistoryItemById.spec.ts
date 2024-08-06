import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ContentType } from '@diia-inhouse/types'

import GetHistoryItemByIdAction from '@actions/v2/userHistory/getHistoryItemById'

import UserHistoryService from '@services/userHistory'

import { UserHistoryCode } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryItemByIdAction.name}`, () => {
    const testKit = new TestKit()
    const userHistoryService = mockInstance(UserHistoryService)

    const action = new GetHistoryItemByIdAction(userHistoryService)

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

            jest.spyOn(userHistoryService, 'getHistoryItemById').mockResolvedValueOnce(response)

            expect(await action.handler(args)).toMatchObject(response)

            expect(userHistoryService.getHistoryItemById).toHaveBeenCalledWith(
                args.session.user.identifier,
                args.params.itemId,
                args.params.actionCode,
            )
        })
    })
})
