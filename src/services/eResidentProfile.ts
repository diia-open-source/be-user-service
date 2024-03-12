import { AnalyticsActionResult } from '@diia-inhouse/analytics'
import { ActHeaders, Logger } from '@diia-inhouse/types'

import EResidentDeviceService from '@services/eResidentDevice'

import eresidentProfileModel from '@models/eResidentProfile'

import { EResidentProfile } from '@interfaces/models/eResidentProfile'

export default class EResidentProfileService {
    private timezoneOffset: number

    private hourInMs = 60000

    constructor(
        private readonly eResidentDeviceService: EResidentDeviceService,

        private readonly logger: Logger,
    ) {
        this.timezoneOffset = new Date().getTimezoneOffset() * this.hourInMs
    }

    async createOrUpdateProfile(newUserProfile: EResidentProfile, headers: ActHeaders): Promise<void> {
        const { identifier, gender, birthDay } = newUserProfile
        const { mobileUid, platformType, platformVersion, appVersion } = headers

        const userProfile = await eresidentProfileModel.findOne({ identifier })
        if (userProfile) {
            await this.eResidentDeviceService.updateDevice(identifier, headers)

            return
        }

        const dateOfBirth: Date = new Date(birthDay.getTime() - this.timezoneOffset)

        await Promise.all([eresidentProfileModel.create(newUserProfile), this.eResidentDeviceService.updateDevice(identifier, headers)])

        this.logger.info('Analytics', {
            analytics: {
                date: new Date().toISOString(),
                category: 'eresidents',
                action: {
                    type: 'addUser',
                    result: AnalyticsActionResult.Success,
                },
                identifier,
                appVersion,
                device: {
                    identifier: mobileUid,
                    platform: {
                        type: platformType,
                        version: platformVersion,
                    },
                },
                data: {
                    gender,
                    dayOfBirth: dateOfBirth.getDate(),
                    monthOfBirth: dateOfBirth.getMonth() + 1,
                    yearOfBirth: dateOfBirth.getFullYear(),
                },
            },
        })
    }
}
