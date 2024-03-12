import { ObjectId } from 'bson'
import * as moment from 'moment'
import { FilterQuery, UpdateQuery } from 'mongoose'

import Logger from '@diia-inhouse/diia-logger'
import { AccessDeniedError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

const otpModelMock = {
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    modelName: 'Otp',
}

jest.mock('@models/otp', () => otpModelMock)

import NotificationService from '@services/notification'
import OtpService from '@services/otp'

import { AppConfig } from '@interfaces/config'
import { OtpModel } from '@interfaces/models/otp'
import { ProcessCode } from '@interfaces/services'
import { SmsTemplateCode } from '@interfaces/services/notification'

describe(`Service ${OtpService.name}`, () => {
    const now = new Date()
    const testKit = new TestKit()
    const appConfig = <AppConfig>(<unknown>{
        otp: {
            perDay: 3,
            expiration: 86400000,
            verifyAttempts: 3,
        },
    })
    const logger = mockInstance(Logger)

    const notificationService = mockInstance(NotificationService)

    const otpService = new OtpService(notificationService, appConfig, logger)

    const user = testKit.session.getUserSession().user
    const headers = testKit.session.getHeaders()

    beforeEach(() => {
        jest.useFakeTimers({ now })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('method: `createOtp`', () => {
        const phoneNumber = 'phoneNumber'

        it('should throw AccessDeniedError if exceeded otps limits per day', async () => {
            jest.spyOn(otpModelMock, 'countDocuments').mockResolvedValueOnce(3)

            await expect(otpService.createOtp(phoneNumber, user, headers)).rejects.toEqual(
                new AccessDeniedError('Exceeded otps limits per day', undefined, ProcessCode.OtpSendAttemptsExceeded),
            )

            expect(otpModelMock.countDocuments).toHaveBeenCalledWith({
                userIdentifier: user.identifier,
                createdAt: {
                    $gte: new Date(moment.utc().startOf('day').valueOf()),
                    $lt: new Date(moment.utc().endOf('day').valueOf()),
                },
            })
        })

        it('should return created otp', async () => {
            const mockOtpDate = {
                value: 1,
                expirationDate: new Date(Date.now() + appConfig.otp.expiration),
                userIdentifier: user.identifier,
                mobileUid: headers.mobileUid,
                verifyAttempt: 0,
                isDeleted: false,
            }

            const idToKeep = new ObjectId()
            const query: FilterQuery<OtpModel> = { mobileUid: headers.mobileUid, _id: { $ne: idToKeep } }
            const modifier: UpdateQuery<OtpModel> = { isDeleted: true }

            jest.spyOn(otpModelMock, 'countDocuments').mockResolvedValueOnce(2)

            jest.spyOn(notificationService, 'sendSms').mockResolvedValueOnce(true)

            jest.spyOn(Math, 'floor').mockReturnValue(1)

            jest.spyOn(otpModelMock, 'create').mockResolvedValueOnce({ ...mockOtpDate, _id: idToKeep })

            jest.spyOn(otpModelMock, 'updateMany').mockResolvedValueOnce({ modifiedCount: 1 })

            expect(await otpService.createOtp(phoneNumber, user, headers)).toMatchObject(mockOtpDate)

            expect(otpModelMock.countDocuments).toHaveBeenCalledWith({
                userIdentifier: user.identifier,
                createdAt: {
                    $gte: new Date(moment.utc().startOf('day').valueOf()),
                    $lt: new Date(moment.utc().endOf('day').valueOf()),
                },
            })
            expect(notificationService.sendSms).toHaveBeenCalledWith(
                phoneNumber,
                SmsTemplateCode.Otp,
                user,
                headers,
                mockOtpDate.value.toString(),
            )
            expect(otpModelMock.create).toHaveBeenCalledWith(mockOtpDate)
            expect(otpModelMock.updateMany).toHaveBeenCalledWith(query, modifier)
            expect(logger.info).toHaveBeenCalledWith('Remove other otps', { mobileUid: headers.mobileUid, modifiedCount: 1 })
        })
    })

    describe('method: `verifyOtp`', () => {
        const userIdentifier = user.identifier
        const mobileUid = headers.mobileUid

        it('should return false if otp not found', async () => {
            const query: FilterQuery<OtpModel> = { userIdentifier, mobileUid, isDeleted: false }

            jest.spyOn(otpModelMock, 'findOne').mockResolvedValueOnce(undefined)

            expect(await otpService.verifyOtp(1, userIdentifier, mobileUid)).toBeFalsy()
            expect(otpModelMock.findOne).toHaveBeenCalledWith(query)
            expect(logger.error).toHaveBeenCalledWith('Otp not found', { value: 1 })
        })

        it('should throw AccessDeniedError if exceeded verify limits per otp', async () => {
            const localMockOtpDate = { verifyAttempt: 4 }

            jest.spyOn(otpModelMock, 'findOne').mockResolvedValueOnce(localMockOtpDate)

            await expect(otpService.verifyOtp(1, userIdentifier, mobileUid)).rejects.toEqual(
                new AccessDeniedError('Exceeded verify limits per otp', undefined, ProcessCode.OtpVerifyAttemptsExceeded),
            )
        })

        it('should return false if otp value is not matched', async () => {
            const localMockOtpDate = { verifyAttempt: 2, value: 'value', save: jest.fn() }

            jest.spyOn(otpModelMock, 'findOne').mockResolvedValueOnce(localMockOtpDate)

            expect(await otpService.verifyOtp(1, userIdentifier, mobileUid)).toBeFalsy()
            expect(logger.error).toHaveBeenCalledWith('Otp value is not matched', { userValue: 1, recordValue: localMockOtpDate.value })
        })

        it('should return false if otp is already used', async () => {
            const localMockOtpDate = { verifyAttempt: 2, value: 1, usedDate: true, save: jest.fn() }

            jest.spyOn(otpModelMock, 'findOne').mockResolvedValueOnce(localMockOtpDate)

            expect(await otpService.verifyOtp(1, userIdentifier, mobileUid)).toBeFalsy()
            expect(logger.error).toHaveBeenCalledWith('Otp is already used')
        })

        it('should return false if otp has expired', async () => {
            const expirationDate = new Date(Date.now() - 1000)

            const localMockOtpDate = { verifyAttempt: 2, value: 1, usedDate: false, expirationDate, save: jest.fn() }

            jest.spyOn(otpModelMock, 'findOne').mockResolvedValueOnce(localMockOtpDate)

            expect(await otpService.verifyOtp(1, userIdentifier, mobileUid)).toBeFalsy()
            expect(logger.error).toHaveBeenCalledWith('Otp has expired')
        })

        it('should return true', async () => {
            const expirationDate = new Date(Date.now() + 100000)

            const localMockOtpDate = { verifyAttempt: 2, value: 1, usedDate: false, expirationDate, save: jest.fn() }

            jest.spyOn(otpModelMock, 'findOne').mockResolvedValueOnce(localMockOtpDate)

            expect(await otpService.verifyOtp(1, userIdentifier, mobileUid)).toBeTruthy()
        })
    })

    describe('method: `isOtpWasUsed`', () => {
        it('should return true if otp was used', async () => {
            const query: FilterQuery<OtpModel> = {
                userIdentifier: user.identifier,
                mobileUid: headers.mobileUid,
                usedDate: { $exists: true },
                isDeleted: false,
            }

            jest.spyOn(otpModelMock, 'countDocuments').mockResolvedValueOnce(1)

            expect(await otpService.isOtpWasUsed(user.identifier, headers.mobileUid)).toBeTruthy()
            expect(otpModelMock.countDocuments).toHaveBeenCalledWith(query)
        })
    })
})
