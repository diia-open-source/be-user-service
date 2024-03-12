import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetUserSigningStatusesAction from '@actions/v1/userHistory/getUserSigningStatuses'

import UserSigningHistoryService from '@services/userSigningHistory'

import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetUserSigningStatusesAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userSigningHistoryServiceMock = mockInstance(UserSigningHistoryService)

    const getUserSigningStatusesAction = new GetUserSigningStatusesAction(userSigningHistoryServiceMock)

    describe('method `handler`', () => {
        it('should return user sharing statuses', async () => {
            const args = {
                params: { resourceIds: ['id1', 'id2'] },
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

            jest.spyOn(userSigningHistoryServiceMock, 'getItemStatuses').mockResolvedValueOnce(userHistoryItemStatus)

            expect(await getUserSigningStatusesAction.handler(args)).toMatchObject(userHistoryItemStatus)

            expect(userSigningHistoryServiceMock.getItemStatuses).toHaveBeenCalledWith(args.params.resourceIds)
        })
    })
})
