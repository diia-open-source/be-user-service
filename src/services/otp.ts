import { randomInt } from 'crypto'
import { ObjectId } from 'bson'
import moment from 'moment'
import { FilterQuery, UpdateQuery } from 'mongoose'

import { AccessDeniedError } from '@diia-inhouse/errors'
import { AppUserActionHeaders, Logger, UserTokenData } from '@diia-inhouse/types'

import NotificationService from '@services/notification'

import otpModel from '@models/otp'

import { AppConfig } from '@interfaces/config'
import { Otp, OtpModel } from '@interfaces/models/otp'
import { ProcessCode } from '@interfaces/services'
import { SmsTemplateCode } from '@interfaces/services/notification'

export default class OtpService {
    constructor(
        private readonly notificationService: NotificationService,

        private readonly config: AppConfig,
        private readonly logger: Logger,
    ) {}

    async createOtp(phoneNumber: string, user: UserTokenData, headers: AppUserActionHeaders): Promise<OtpModel> {
        const totalTodayOtps: number = await this.countTodayOtps(user.identifier)
        if (totalTodayOtps >= this.config.otp.perDay) {
            throw new AccessDeniedError('Exceeded otps limits per day', undefined, ProcessCode.OtpSendAttemptsExceeded)
        }

        const value: string = this.generateOtp(4)

        await this.notificationService.sendSms(phoneNumber, SmsTemplateCode.Otp, user, headers, value.toString())

        const expirationDate: Date = new Date(Date.now() + this.config.otp.expiration)
        const { mobileUid } = headers
        const otpData: Otp = {
            value,
            expirationDate,
            userIdentifier: user.identifier,
            mobileUid,
            verifyAttempt: 0,
            isDeleted: false,
        }

        const otp: OtpModel = await otpModel.create(otpData)

        await this.removeOtherOtps(mobileUid, otp._id)

        return otp
    }

    async verifyOtp(value: number, userIdentifier: string, mobileUid: string): Promise<boolean> {
        const query: FilterQuery<OtpModel> = { userIdentifier, mobileUid, isDeleted: false }
        const record = await otpModel.findOne(query)
        if (!record) {
            this.logger.error('Otp not found', { value })

            return false
        }

        let verifyResult = false

        if (record.verifyAttempt >= this.config.otp.verifyAttempts) {
            throw new AccessDeniedError('Exceeded verify limits per otp', undefined, ProcessCode.OtpVerifyAttemptsExceeded)
        } else if (record.value !== value) {
            this.logger.error('Otp value is not matched', { userValue: value, recordValue: record.value })
        } else if (record.usedDate) {
            this.logger.error('Otp is already used')
        } else if (Date.now() >= record.expirationDate.getTime()) {
            this.logger.error('Otp has expired')
        } else {
            record.usedDate = new Date()
            verifyResult = true
        }

        record.verifyAttempt += 1
        await record.save()

        return verifyResult
    }

    async isOtpWasUsed(userIdentifier: string, mobileUid: string): Promise<boolean> {
        const query: FilterQuery<OtpModel> = { userIdentifier, mobileUid, usedDate: { $exists: true }, isDeleted: false }
        const amount: number = await otpModel.countDocuments(query)

        return amount > 0
    }

    private async removeOtherOtps(mobileUid: string, idToKeep: ObjectId): Promise<void> {
        const query: FilterQuery<OtpModel> = { mobileUid, _id: { $ne: idToKeep } }
        const modifier: UpdateQuery<OtpModel> = { isDeleted: true }

        const { modifiedCount } = await otpModel.updateMany(query, modifier)
        if (modifiedCount) {
            this.logger.info('Remove other otps', { mobileUid, modifiedCount })
        }
    }

    private async countTodayOtps(userIdentifier: string): Promise<number> {
        return await otpModel.countDocuments({
            userIdentifier,
            createdAt: {
                $gte: new Date(moment.utc().startOf('day').valueOf()),
                $lt: new Date(moment.utc().endOf('day').valueOf()),
            },
        })
    }

    private generateOtp(length: number): string {
        return Array.from({ length }, () => randomInt(0, 10)).join('')
    }
}
