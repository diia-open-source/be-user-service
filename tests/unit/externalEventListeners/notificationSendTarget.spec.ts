import { randomUUID } from 'crypto'

import { mockInstance } from '@diia-inhouse/test'

import NotificationSendTargetEventListener from '@src/externalEventListeners/notificationSendTarget'

import UserProfileService from '@services/userProfile'

import { MessageTemplateCode } from '@interfaces/services/notification'

describe('NotificationSendTargetEventListener', () => {
    const userProfileServiceMock = mockInstance(UserProfileService)
    const notificationSendTargetEventListener = new NotificationSendTargetEventListener(userProfileServiceMock)

    describe('method: `handler`', () => {
        it('should successfully invoke notify users process', async () => {
            const message = {
                uuid: randomUUID(),
                request: {
                    filter: {},
                    templateCode: MessageTemplateCode.DriverLicenseDataChanged,
                    appVersions: {},
                    resourceId: randomUUID(),
                    templateParams: {},
                },
            }
            const {
                request: { appVersions, filter, resourceId, templateCode, templateParams },
            } = message

            jest.spyOn(userProfileServiceMock, 'notifyUsers').mockResolvedValueOnce()

            expect(await notificationSendTargetEventListener.handler(message)).toBeUndefined()

            expect(userProfileServiceMock.notifyUsers).toHaveBeenCalledWith(filter, templateCode, resourceId, templateParams, appVersions)
        })
    })
})
