import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetUserSharingStatusAction from '@actions/v1/userHistory/getUserSharingStatuses'

import UserSharingHistoryService from '@services/userSharingHistory'

import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetUserSharingStatusAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userSharingHistoryServiceMock = mockInstance(UserSharingHistoryService)

    const getUserSharingStatusAction = new GetUserSharingStatusAction(userSharingHistoryServiceMock)

    describe('method `handler`', () => {
        it('should return user sharing statuses', async () => {
            const args = {
                params: { sharingIds: ['id1', 'id2'] },
                session: testKit.session.getUserSession(),
                headers,
            }

            const userHistoryItemStatus = [
                {
                    sharingId: 'id1',
                    status: UserHistoryItemStatus.Processing,
                    date: new Date(),
                },
            ]

            jest.spyOn(userSharingHistoryServiceMock, 'getItemStatuses').mockResolvedValueOnce(userHistoryItemStatus)

            expect(await getUserSharingStatusAction.handler(args)).toMatchObject(userHistoryItemStatus)

            expect(userSharingHistoryServiceMock.getItemStatuses).toHaveBeenCalledWith(args.params.sharingIds)
        })
    })
})
