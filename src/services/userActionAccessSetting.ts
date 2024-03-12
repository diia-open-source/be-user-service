import { InternalServerError } from '@diia-inhouse/errors'

import userUserActionAccessSettingModel from '@models/userActionAccessSetting'

import { UserActionAccessSettingModel } from '@interfaces/models/userActionAccessSetting'
import { ActionAccessType } from '@interfaces/services/userActionAccess'

export default class UserActionAccessSettingService {
    private userActionAccessSettingSettings: Map<ActionAccessType, UserActionAccessSettingModel> = new Map()

    async getSetting(actionAccessType: ActionAccessType): Promise<UserActionAccessSettingModel> {
        const cachedMaxValue = this.userActionAccessSettingSettings.get(actionAccessType)
        if (cachedMaxValue !== undefined) {
            return cachedMaxValue
        }

        const userActionAccessSetting = await userUserActionAccessSettingModel.findOne({ actionAccessType })
        if (!userActionAccessSetting) {
            throw new InternalServerError(`There is no user action access setting for the ${actionAccessType}`)
        }

        this.userActionAccessSettingSettings.set(actionAccessType, userActionAccessSetting)

        return userActionAccessSetting
    }
}
