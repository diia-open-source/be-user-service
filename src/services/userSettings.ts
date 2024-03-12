import DiiaLogger from '@diia-inhouse/diia-logger'

import { UpdateUserSettingsReq } from '@src/generated'

import userProfileModel from '@models/userProfile'

export default class UserSettingsService {
    constructor(private readonly logger: DiiaLogger) {}

    async updateUserSettings(userIdentifier: string, params: UpdateUserSettingsReq): Promise<void> {
        this.logger.info('Setting user settings', { params })

        await userProfileModel.updateOne({ identifier: userIdentifier }, { $set: { settings: params } }, { upsert: true })
    }
}
