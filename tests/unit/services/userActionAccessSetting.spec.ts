import { InternalServerError } from '@diia-inhouse/errors'

import UserActionAccessSettingService from '@services/userActionAccessSetting'

import userUserActionAccessSettingModel from '@models/userActionAccessSetting'

import { ActionAccessType } from '@interfaces/services/userActionAccess'

describe(`Service ${UserActionAccessSettingService.name}`, () => {
    describe('method: `getSetting`', () => {
        const actionAccessType = ActionAccessType.AddBirthCertificate
        const userActionAccessSettings = {
            maxValue: 5,
            expirationTime: 60,
        }

        it('should fetch from db and save to internal cache', async () => {
            const userActionAccessSettingService = new UserActionAccessSettingService()

            jest.spyOn(userUserActionAccessSettingModel, 'findOne').mockResolvedValueOnce(userActionAccessSettings)

            expect(await userActionAccessSettingService.getSetting(actionAccessType)).toEqual(userActionAccessSettings)
            expect(await userActionAccessSettingService.getSetting(actionAccessType)).toEqual(userActionAccessSettings)

            expect(userUserActionAccessSettingModel.findOne).toHaveBeenCalledWith({ actionAccessType })
            expect(userUserActionAccessSettingModel.findOne).toHaveBeenCalledTimes(1)
        })

        it('should fail with error in case setting not found in db', async () => {
            const userActionAccessSettingService = new UserActionAccessSettingService()

            jest.spyOn(userUserActionAccessSettingModel, 'findOne').mockResolvedValueOnce(null)

            await expect(async () => {
                await userActionAccessSettingService.getSetting(actionAccessType)
            }).rejects.toEqual(new InternalServerError(`There is no user action access setting for the ${actionAccessType}`))

            expect(userUserActionAccessSettingModel.findOne).toHaveBeenCalledWith({ actionAccessType })
        })
    })
})
