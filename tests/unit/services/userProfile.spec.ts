import { randomUUID } from 'node:crypto'
import Stream from 'node:stream'

const userProfileModelMock = {
    aggregate: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    cursor: jest.fn(),
    eachAsync: jest.fn(),
    estimatedDocumentCount: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    modelName: 'UserProfile',
}

jest.mock('@models/userProfile', () => ({
    ...jest.requireActual('@models/userProfile'),
    default: userProfileModelMock,
    __esModule: true,
}))

import moment from 'moment'
import nock from 'nock'

import { IdentifierService } from '@diia-inhouse/crypto'
import { mongo } from '@diia-inhouse/db'
import Logger from '@diia-inhouse/diia-logger'
import { EventBus, ExternalEventBus } from '@diia-inhouse/diia-queue'
import { InternalServerError, ModelNotFoundError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import {
    DiiaOfficeStatus,
    DocStatus,
    DurationMs,
    Gender,
    HttpStatusCode,
    PlatformType,
    ProfileFeature,
    UserTokenData,
} from '@diia-inhouse/types'

import NotificationService from '@services/notification'
import UnregisteredOfficeProfileService from '@services/unregisteredOfficeProfile'
import UserDeviceService from '@services/userDevice'
import UserDocumentService from '@services/userDocument'
import UserProfileService from '@services/userProfile'

import userDocumentModel from '@models/userDocument'

import UserProfileDataMapper from '@dataMappers/userProfileDataMapper'

import { AppConfig } from '@interfaces/config'
import { CitizenshipSource, DiiaOfficeProfile, UserProfile, UserProfileCitizenship } from '@interfaces/models/userProfile'
import { ExternalEvent, InternalEvent } from '@interfaces/queue'
import { MessageTemplateCode, NotificationAppVersionsByPlatformType } from '@interfaces/services/notification'
import { UserFilter } from '@interfaces/services/userProfile'

const externalEventBusMock = {
    publish: jest.fn(),
}

const undefinedValue = undefined

describe(`Service ${UserProfileService.name}`, () => {
    const testKit = new TestKit()
    const appConfig = <AppConfig>{
        notifications: { targetBatchSize: 10, isEnabled: true },
        profileFeatures: { isEnabled: true },
        identifier: { salt: randomUUID() },
    }

    const eventBus = <EventBus>(<unknown>{ publish: jest.fn() })
    const identifierService = new IdentifierService(appConfig.identifier)
    const logger = mockInstance(Logger)
    const notificationService = mockInstance(NotificationService)
    const unregisteredOfficeProfileService = mockInstance(UnregisteredOfficeProfileService)
    const userDeviceService = mockInstance(UserDeviceService)
    const userDocumentService = mockInstance(UserDocumentService)

    const userProfileService = new UserProfileService(
        userDeviceService,
        () => userDocumentService,
        notificationService,
        unregisteredOfficeProfileService,
        new UserProfileDataMapper(),
        appConfig,
        eventBus,
        <ExternalEventBus>(<unknown>externalEventBusMock),
        logger,
        identifierService,
    )

    describe(`method ${userProfileService.createOrUpdateProfile.name}`, () => {
        it('should create userProfile', async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { user } = session
            const { identifier: userIdentifier, itn } = user
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender: Gender.male,
                birthDay: new Date(Date.now() - DurationMs.Month * 12 * 18),
            }

            userProfileModelMock.findOne.mockResolvedValueOnce(undefinedValue)
            jest.spyOn(unregisteredOfficeProfileService, 'getUnregisteredProfile').mockResolvedValueOnce(undefinedValue)

            await userProfileService.createOrUpdateProfile(userProfile, headers, itn)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier })
            expect(userProfileModelMock.create).toHaveBeenCalledWith(userProfile)
            expect(userDeviceService.updateDevice).toHaveBeenCalledWith(userIdentifier, headers)
            expect(eventBus.publish).toHaveBeenCalledWith(InternalEvent.UserProfileCreated, { userIdentifier, itn })
        })

        it('should crate office profile and set profile office feature if unregistered office profile has feature data for given user', async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { user } = session
            const { identifier: userIdentifier, itn } = user
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender: Gender.male,
                birthDay: new Date(Date.now() - DurationMs.Month * 12 * 18),
            }
            const unregisteredOfficeProfile: DiiaOfficeProfile = {
                profileId: randomUUID(),
                organizationId: randomUUID(),
                unitId: randomUUID(),
                scopes: [],
                isOrganizationAdmin: false,
                status: DiiaOfficeStatus.ACTIVE,
            }

            userProfileModelMock.findOne.mockResolvedValueOnce(undefinedValue)
            jest.spyOn(unregisteredOfficeProfileService, 'getUnregisteredProfile').mockResolvedValueOnce(unregisteredOfficeProfile)
            userProfileModelMock.updateOne.mockResolvedValue({ matchedCount: 0 })

            await userProfileService.createOrUpdateProfile(userProfile, headers, itn)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier })
            expect(userProfileModelMock.create).toHaveBeenCalledWith(userProfile)
            expect(userDeviceService.updateDevice).toHaveBeenCalledWith(userIdentifier, headers)
            expect(eventBus.publish).toHaveBeenCalledWith(InternalEvent.UserProfileCreated, { userIdentifier, itn })
            expect(userProfileModelMock.updateOne).toHaveBeenNthCalledWith(
                1,
                {
                    [`features.${ProfileFeature.office}.profileId`]: unregisteredOfficeProfile.profileId,
                    identifier: { $ne: userIdentifier },
                },
                { $unset: { [`features.${ProfileFeature.office}`]: 1 } },
            )
            expect(userProfileModelMock.updateOne).toHaveBeenNthCalledWith(
                2,
                { identifier: userIdentifier },
                { $set: { [`features.${ProfileFeature.office}`]: unregisteredOfficeProfile } },
            )
            expect(unregisteredOfficeProfileService.addUnregisteredProfile).toHaveBeenCalledWith(userIdentifier, unregisteredOfficeProfile)
            expect(unregisteredOfficeProfileService.removeUnregisteredProfile).toHaveBeenCalledWith(userIdentifier)
        })

        it('should update user profile with new device info if it already exists', async () => {
            const { session, headers } = testKit.session.getUserActionArguments()
            const { user } = session
            const { identifier: userIdentifier, itn } = user
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender: Gender.male,
                birthDay: new Date(Date.now() - DurationMs.Month * 12 * 18),
            }

            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)

            await userProfileService.createOrUpdateProfile(userProfile, headers, itn)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier })
            expect(userDeviceService.updateDevice).toHaveBeenCalledWith(userIdentifier, headers)
        })
    })

    describe(`method ${userProfileService.checkForUserProfileFeatures.name}`, () => {
        it('should set profile feature and remove unregistered profile if office profile exists for user', async () => {
            const userIdentifier = randomUUID()
            const unregisteredOfficeProfile: DiiaOfficeProfile = {
                profileId: randomUUID(),
                organizationId: randomUUID(),
                unitId: randomUUID(),
                scopes: [],
                isOrganizationAdmin: false,
                status: DiiaOfficeStatus.ACTIVE,
            }

            jest.spyOn(unregisteredOfficeProfileService, 'getUnregisteredProfile').mockResolvedValueOnce(unregisteredOfficeProfile)
            userProfileModelMock.updateOne.mockResolvedValue({ matchedCount: 0 })

            await userProfileService.checkForUserProfileFeatures(userIdentifier)

            expect(unregisteredOfficeProfileService.getUnregisteredProfile).toHaveBeenCalledWith(userIdentifier)
            expect(userProfileModelMock.updateOne).toHaveBeenNthCalledWith(
                1,
                {
                    [`features.${ProfileFeature.office}.profileId`]: unregisteredOfficeProfile.profileId,
                    identifier: { $ne: userIdentifier },
                },
                { $unset: { [`features.${ProfileFeature.office}`]: 1 } },
            )
            expect(userProfileModelMock.updateOne).toHaveBeenNthCalledWith(
                2,
                { identifier: userIdentifier },
                { $set: { [`features.${ProfileFeature.office}`]: unregisteredOfficeProfile } },
            )
            expect(unregisteredOfficeProfileService.addUnregisteredProfile).toHaveBeenCalledWith(userIdentifier, unregisteredOfficeProfile)
            expect(unregisteredOfficeProfileService.removeUnregisteredProfile).toHaveBeenCalledWith(userIdentifier)
        })

        it('should not set profile if it does not exists for user', async () => {
            const userIdentifier = randomUUID()

            jest.spyOn(unregisteredOfficeProfileService, 'getUnregisteredProfile').mockResolvedValue(undefinedValue)
            jest.spyOn(unregisteredOfficeProfileService, 'addUnregisteredProfile').mockClear()
            jest.spyOn(unregisteredOfficeProfileService, 'removeUnregisteredProfile').mockClear()

            await userProfileService.checkForUserProfileFeatures(userIdentifier)

            expect(unregisteredOfficeProfileService.getUnregisteredProfile).toHaveBeenCalledWith(userIdentifier)
            expect(userProfileModelMock.updateOne).not.toHaveBeenCalled()
            expect(unregisteredOfficeProfileService.addUnregisteredProfile).not.toHaveBeenCalled()
            expect(unregisteredOfficeProfileService.removeUnregisteredProfile).not.toHaveBeenCalled()
        })
    })

    describe(`method ${userProfileService.getUserProfileFeatures.name}`, () => {
        it('should return empty object if profile features are not enabled in config', async () => {
            const userIdentifier = randomUUID()

            appConfig.profileFeatures.isEnabled = false

            const result = await userProfileService.getUserProfileFeatures(userIdentifier, [])

            expect(result).toEqual({})
        })

        it('should return empty object if userProfile has no features', async () => {
            const userIdentifier = randomUUID()
            const requestedFeatures = [ProfileFeature.office, ProfileFeature.student]
            const userProfile = {
                identifier: userIdentifier,
                gender: Gender.male,
                birthDate: new Date(),
            }

            appConfig.profileFeatures.isEnabled = true
            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)

            const result = await userProfileService.getUserProfileFeatures(userIdentifier, requestedFeatures)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith(
                { identifier: userIdentifier },
                {
                    [`features.${ProfileFeature.office}`]: 1,
                    [`features.${ProfileFeature.student}`]: 1,
                },
            )
            expect(result).toEqual({})
        })

        it('should throw error if user profile was not found', async () => {
            const userIdentifier = randomUUID()

            appConfig.profileFeatures.isEnabled = true
            userProfileModelMock.findOne.mockResolvedValueOnce(undefinedValue)

            await expect(userProfileService.getUserProfileFeatures(userIdentifier, [])).rejects.toThrow(
                new ModelNotFoundError(userProfileModelMock.modelName, ''),
            )
        })

        it('should return requested features if user profile has those features', async () => {
            const userIdentifier = randomUUID()
            const requestedFeatures = [ProfileFeature.office]
            const features = {
                [ProfileFeature.office]: {
                    profileId: randomUUID(),
                    organizationId: randomUUID(),
                    unitId: randomUUID(),
                    scopes: [randomUUID()],
                    isOrganizationAdmin: false,
                    status: DiiaOfficeStatus.ACTIVE,
                },
            }
            const userProfile = {
                identifier: userIdentifier,
                gender: Gender.male,
                birthDate: new Date(),
                features,
            }

            appConfig.profileFeatures.isEnabled = true
            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)

            const result = await userProfileService.getUserProfileFeatures(userIdentifier, requestedFeatures)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith(
                { identifier: userIdentifier },
                { [`features.${ProfileFeature.office}`]: 1 },
            )
            expect(result).toEqual(features)
        })
    })

    describe(`method ${userProfileService.setProfileFeature.name}`, () => {
        it('should update profile with passed feature data', async () => {
            const userIdentifier = randomUUID()
            const feature = ProfileFeature.office
            const featureData = {
                profileId: randomUUID(),
                organizationId: randomUUID(),
                unitId: randomUUID(),
            }

            userProfileModelMock.updateOne.mockResolvedValue({ matchedCount: 1 })

            await userProfileService.setProfileFeature(userIdentifier, feature, featureData)

            expect(userProfileModelMock.updateOne).toHaveBeenCalledWith(
                { identifier: userIdentifier },
                { $set: { [`features.${ProfileFeature.office}`]: featureData } },
            )
            expect(userProfileModelMock.updateOne).toHaveBeenCalledTimes(2)
            expect(unregisteredOfficeProfileService.addUnregisteredProfile).not.toHaveBeenCalled()
        })

        it('should unset profile feature for other users and update profile with passed feature data', async () => {
            const userIdentifier = randomUUID()
            const feature = ProfileFeature.office
            const featureData: DiiaOfficeProfile = {
                profileId: randomUUID(),
                organizationId: randomUUID(),
                unitId: randomUUID(),
                scopes: [],
                isOrganizationAdmin: false,
                status: DiiaOfficeStatus.ACTIVE,
            }

            userProfileModelMock.updateOne.mockResolvedValue({ matchedCount: 1 })

            await userProfileService.setProfileFeature(userIdentifier, feature, featureData)

            expect(userProfileModelMock.updateOne).toHaveBeenNthCalledWith(
                1,
                {
                    [`features.${ProfileFeature.office}.profileId`]: featureData.profileId,
                    identifier: { $ne: userIdentifier },
                },
                { $unset: { [`features.${ProfileFeature.office}`]: 1 } },
            )
            expect(userProfileModelMock.updateOne).toHaveBeenNthCalledWith(
                2,
                { identifier: userIdentifier },
                { $set: { [`features.${ProfileFeature.office}`]: featureData } },
            )
            expect(userProfileModelMock.updateOne).toHaveBeenCalledTimes(2)
            expect(unregisteredOfficeProfileService.addUnregisteredProfile).not.toHaveBeenCalled()
        })

        it('should unset profile feature for other users and add unregistered office profile if no profile was updated', async () => {
            const userIdentifier = randomUUID()
            const feature = ProfileFeature.office
            const featureData: DiiaOfficeProfile = {
                profileId: randomUUID(),
                organizationId: randomUUID(),
                unitId: randomUUID(),
                scopes: [],
                isOrganizationAdmin: false,
                status: DiiaOfficeStatus.ACTIVE,
            }

            userProfileModelMock.updateOne.mockResolvedValue({ matchedCount: 0 })

            await userProfileService.setProfileFeature(userIdentifier, feature, featureData)

            expect(userProfileModelMock.updateOne).toHaveBeenNthCalledWith(
                1,
                {
                    [`features.${ProfileFeature.office}.profileId`]: featureData.profileId,
                    identifier: { $ne: userIdentifier },
                },
                { $unset: { [`features.${ProfileFeature.office}`]: 1 } },
            )
            expect(userProfileModelMock.updateOne).toHaveBeenNthCalledWith(
                2,
                { identifier: userIdentifier },
                { $set: { [`features.${ProfileFeature.office}`]: featureData } },
            )
            expect(unregisteredOfficeProfileService.addUnregisteredProfile).toHaveBeenCalledWith(userIdentifier, featureData)
        })
    })

    describe(`method ${userProfileService.removeProfileFeature.name}`, () => {
        it(`should remove ${ProfileFeature.student} profile feature`, async () => {
            const userIdentifier = randomUUID()
            const profileFeature = ProfileFeature.student

            await userProfileService.removeProfileFeature(userIdentifier, profileFeature)

            expect(userProfileModelMock.updateOne).toHaveBeenCalledWith(
                { identifier: userIdentifier },
                { $unset: { [`features.${profileFeature}`]: 1 } },
            )
            expect(unregisteredOfficeProfileService.removeUnregisteredProfile).not.toHaveBeenCalled()
        })

        it(`should remove ${ProfileFeature.office} profile feature`, async () => {
            const userIdentifier = randomUUID()
            const profileFeature = ProfileFeature.office

            await userProfileService.removeProfileFeature(userIdentifier, profileFeature)

            expect(userProfileModelMock.updateOne).toHaveBeenCalledWith(
                { identifier: userIdentifier },
                { $unset: { [`features.${profileFeature}`]: 1 } },
            )
            expect(unregisteredOfficeProfileService.removeUnregisteredProfile).toHaveBeenCalledWith(userIdentifier)
        })
    })

    describe(`method ${userProfileService.officeTokenFailed.name}`, () => {
        it('should set token fail data in user profile', async () => {
            const profileId = randomUUID()
            const reason = randomUUID()

            await userProfileService.officeTokenFailed(profileId, reason)

            expect(userProfileModelMock.updateOne).toHaveBeenCalledWith(
                { [`features.${ProfileFeature.office}.profileId`]: profileId },
                {
                    $set: {
                        [`features.${ProfileFeature.office}.tokenError`]: reason,
                        [`features.${ProfileFeature.office}.tokenFailedAt`]: expect.any(Date),
                    },
                },
            )
        })
    })

    describe(`method ${userProfileService.getUserIdentifiersByPlatformTypes.name}`, () => {
        it('should not return nextLastId if no profiles was found', async () => {
            const platformTypes = [PlatformType.Android, PlatformType.Browser]
            const limit = testKit.random.getRandomInt(1, 100)

            userProfileModelMock.aggregate.mockResolvedValueOnce([])

            const result = await userProfileService.getUserIdentifiersByPlatformTypes(platformTypes, limit)

            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([
                { $match: { 'devices.platform.type': { $in: platformTypes } } },
                { $limit: limit },
                { $project: { identifier: 1, _id: 1 } },
            ])
            expect(result).toEqual({ userIdentifiers: [] })
        })

        it('should return userIdentifiers and nextLastId when profiles were found', async () => {
            const platformTypes = [PlatformType.Android, PlatformType.Browser]
            const limit = testKit.random.getRandomInt(1, 100)
            const userProfiles = [
                {
                    _id: new mongo.ObjectId(),
                    identifier: randomUUID(),
                },
                {
                    _id: new mongo.ObjectId(),
                    identifier: randomUUID(),
                },
            ]
            const expectedIdentifiers = userProfiles.map(({ identifier }) => identifier)
            const expectedNextLastId = userProfiles[1]._id

            userProfileModelMock.aggregate.mockResolvedValueOnce(userProfiles)

            const result = await userProfileService.getUserIdentifiersByPlatformTypes(platformTypes, limit)

            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([
                { $match: { 'devices.platform.type': { $in: platformTypes } } },
                { $limit: limit },
                { $project: { identifier: 1, _id: 1 } },
            ])
            expect(result).toEqual({ userIdentifiers: expectedIdentifiers, nextLastId: expectedNextLastId })
        })

        it('should return userIdentifiers and nextLastId when profiles were found and lastId passed', async () => {
            const platformTypes = [PlatformType.Android, PlatformType.Browser]
            const limit = testKit.random.getRandomInt(1, 100)
            const userProfiles = [
                {
                    _id: new mongo.ObjectId(),
                    identifier: randomUUID(),
                },
                {
                    _id: new mongo.ObjectId(),
                    identifier: randomUUID(),
                },
            ]
            const expectedIdentifiers = userProfiles.map(({ identifier }) => identifier)
            const expectedNextLastId = userProfiles[1]._id
            const lastId = new mongo.ObjectId()

            userProfileModelMock.aggregate.mockResolvedValueOnce(userProfiles)

            const result = await userProfileService.getUserIdentifiersByPlatformTypes(platformTypes, limit, lastId)

            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([
                { $match: { 'devices.platform.type': { $in: platformTypes }, _id: { $gt: lastId } } },
                { $limit: limit },
                { $project: { identifier: 1, _id: 1 } },
            ])
            expect(result).toEqual({ userIdentifiers: expectedIdentifiers, nextLastId: expectedNextLastId })
        })
    })

    describe(`method ${userProfileService.hasUserProfile.name}`, () => {
        it('should return true if profile exists', async () => {
            const userIdentifier = randomUUID()
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender: Gender.male,
                birthDay: new Date(Date.now() - DurationMs.Month * 12 * 18),
            }

            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)

            const result = await userProfileService.hasUserProfile(userIdentifier)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier })
            expect(result).toBe(true)
        })

        it('should return false if profile does not exists', async () => {
            const userIdentifier = randomUUID()

            userProfileModelMock.findOne.mockResolvedValueOnce(undefinedValue)

            const result = await userProfileService.hasUserProfile(userIdentifier)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier })
            expect(result).toBe(false)
        })
    })

    describe(`method ${userProfileService.getUserFilterInfo.name}`, () => {
        it(`should return user filter info without organizationId if profile has no ${ProfileFeature.office} feature`, async () => {
            const userIdentifier = randomUUID()
            const gender = testKit.session.getGender()
            const birthDay = new Date(Date.now() - DurationMs.Month * 12 * testKit.random.getRandomInt(18, 99) - DurationMs.Hour * 10)
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender,
                birthDay,
            }
            const expectedAge = moment().diff(birthDay, 'years')
            const documents = {
                'driver-license': 1,
                'vehicle-license': 3,
                'u-id': 1,
            }

            appConfig.profileFeatures.isEnabled = true
            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)
            jest.spyOn(userDocumentService, 'getUserDocumentTypesCounts').mockResolvedValueOnce(documents)

            const result = await userProfileService.getUserFilterInfo(userIdentifier)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier }, undefined)
            expect(userDocumentService.getUserDocumentTypesCounts).toHaveBeenCalledWith(userIdentifier)
            expect(result).toEqual({ age: expectedAge, gender, documents })
        })

        it(`should return user filter info without organizationId if profileFeatures config is not enabled`, async () => {
            const userIdentifier = randomUUID()
            const gender = testKit.session.getGender()
            const birthDay = new Date(Date.now() - DurationMs.Month * 12 * testKit.random.getRandomInt(18, 99) - DurationMs.Hour * 10)
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender,
                birthDay,
                features: {
                    [ProfileFeature.office]: {
                        profileId: randomUUID(),
                        organizationId: randomUUID(),
                        unitId: randomUUID(),
                        scopes: [randomUUID()],
                        isOrganizationAdmin: false,
                        status: DiiaOfficeStatus.ACTIVE,
                    },
                },
            }
            const expectedAge = moment().diff(birthDay, 'years')
            const documents = {
                'driver-license': 1,
                'vehicle-license': 3,
                'u-id': 1,
            }

            appConfig.profileFeatures.isEnabled = false
            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)
            jest.spyOn(userDocumentService, 'getUserDocumentTypesCounts').mockResolvedValueOnce(documents)

            const result = await userProfileService.getUserFilterInfo(userIdentifier)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier }, undefined)
            expect(userDocumentService.getUserDocumentTypesCounts).toHaveBeenCalledWith(userIdentifier)
            expect(result).toEqual({ age: expectedAge, gender, documents })

            appConfig.profileFeatures.isEnabled = true
        })

        it(`should return user filter info without organizationId if profile has not active ${ProfileFeature.office} feature`, async () => {
            const userIdentifier = randomUUID()
            const gender = testKit.session.getGender()
            const birthDay = new Date(Date.now() - DurationMs.Month * 12 * testKit.random.getRandomInt(18, 99) - DurationMs.Hour * 10)
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender,
                birthDay,
                features: {
                    [ProfileFeature.office]: {
                        profileId: randomUUID(),
                        organizationId: randomUUID(),
                        unitId: randomUUID(),
                        scopes: [randomUUID()],
                        isOrganizationAdmin: false,
                        status: DiiaOfficeStatus.SUSPENDED,
                    },
                },
            }
            const expectedAge = moment().diff(birthDay, 'years')
            const documents = {
                'driver-license': 1,
                'vehicle-license': 3,
                'u-id': 1,
            }

            appConfig.profileFeatures.isEnabled = true
            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)
            jest.spyOn(userDocumentService, 'getUserDocumentTypesCounts').mockResolvedValueOnce(documents)

            const result = await userProfileService.getUserFilterInfo(userIdentifier)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier }, undefined)
            expect(userDocumentService.getUserDocumentTypesCounts).toHaveBeenCalledWith(userIdentifier)
            expect(result).toEqual({ age: expectedAge, gender, documents })
        })

        it(`should return user filter info with organizationId if profile has active ${ProfileFeature.office} feature`, async () => {
            const userIdentifier = randomUUID()
            const gender = testKit.session.getGender()
            const organizationId = randomUUID()
            const birthDay = new Date(Date.now() - DurationMs.Month * 12 * testKit.random.getRandomInt(18, 99) - DurationMs.Hour * 10)
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender,
                birthDay,
                features: {
                    [ProfileFeature.office]: {
                        profileId: randomUUID(),
                        organizationId,
                        unitId: randomUUID(),
                        scopes: [randomUUID()],
                        isOrganizationAdmin: false,
                        status: DiiaOfficeStatus.ACTIVE,
                    },
                },
            }
            const expectedAge = moment().diff(birthDay, 'years')
            const documents = {
                'driver-license': 1,
                'vehicle-license': 3,
                'u-id': 1,
            }

            appConfig.profileFeatures.isEnabled = true
            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)
            jest.spyOn(userDocumentService, 'getUserDocumentTypesCounts').mockResolvedValueOnce(documents)

            const result = await userProfileService.getUserFilterInfo(userIdentifier)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier }, undefined)
            expect(userDocumentService.getUserDocumentTypesCounts).toHaveBeenCalledWith(userIdentifier)
            expect(result).toEqual({ age: expectedAge, gender, documents, organizationId })
        })

        it(`should throw error if profile cannot be found`, async () => {
            const userIdentifier = randomUUID()

            jest.spyOn(userDocumentService, 'getUserDocumentTypesCounts').mockResolvedValueOnce({})

            await expect(userProfileService.getUserFilterInfo(userIdentifier)).rejects.toThrow(
                new ModelNotFoundError(userProfileModelMock.modelName, ''),
            )
        })
    })

    describe(`method ${userProfileService.getUserCitizenship.name}`, () => {
        it('should return undefined if profile has no citizenship', async () => {
            const userIdentifier = randomUUID()
            const source = CitizenshipSource.BankAccount
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender: testKit.session.getGender(),
                birthDay: new Date(Date.now() - DurationMs.Month * 12 * testKit.random.getRandomInt(18, 99)),
            }

            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)

            const result = await userProfileService.getUserCitizenship(userIdentifier, source)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier }, { citizenship: 1 })
            expect(result).toBeUndefined()
        })

        it('should return user profile citizenship if profile has citizenship for passed source', async () => {
            const userIdentifier = randomUUID()
            const source = CitizenshipSource.BankAccount
            const citizenship: UserProfileCitizenship = {
                country: 'Ukraine',
                date: new Date(),
                sourceId: randomUUID(),
            }
            const userProfile: UserProfile = {
                identifier: userIdentifier,
                gender: testKit.session.getGender(),
                birthDay: new Date(Date.now() - DurationMs.Month * 12 * testKit.random.getRandomInt(18, 99)),
                citizenship: {
                    [CitizenshipSource.BankAccount]: citizenship,
                },
            }

            userProfileModelMock.findOne.mockResolvedValueOnce(userProfile)

            const result = await userProfileService.getUserCitizenship(userIdentifier, source)

            expect(userProfileModelMock.findOne).toHaveBeenCalledWith({ identifier: userIdentifier }, { citizenship: 1 })
            expect(result).toEqual(citizenship)
        })

        it('should throw error if profile cannot be found', async () => {
            const userIdentifier = randomUUID()
            const source = CitizenshipSource.BankAccount

            userProfileModelMock.findOne.mockResolvedValueOnce(undefinedValue)

            await expect(userProfileService.getUserCitizenship(userIdentifier, source)).rejects.toThrow(
                new ModelNotFoundError(userProfileModelMock.modelName, ''),
            )
        })
    })

    describe(`method ${userProfileService.updateUserCitizenship.name}`, () => {
        it('should update user profile if it exists', async () => {
            const userIdentifier = randomUUID()
            const source = CitizenshipSource.BankAccount
            const sourceId = randomUUID()

            userProfileModelMock.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })

            await userProfileService.updateUserCitizenship(userIdentifier, source, sourceId)

            expect(userProfileModelMock.updateOne).toHaveBeenCalledWith(
                { identifier: userIdentifier },
                {
                    $set: {
                        [`citizenship.${source}`]: {
                            country: 'Ukraine',
                            date: expect.any(Date),
                            sourceId,
                        },
                    },
                },
            )
        })

        it('should throw error if no profile was found to modify', async () => {
            const userIdentifier = randomUUID()
            const source = CitizenshipSource.BankAccount
            const sourceId = randomUUID()

            userProfileModelMock.updateOne.mockResolvedValueOnce({ modifiedCount: 0 })

            await expect(userProfileService.updateUserCitizenship(userIdentifier, source, sourceId)).rejects.toThrow(
                new ModelNotFoundError(userProfileModelMock.modelName, ''),
            )
        })
    })

    describe(`method ${userProfileService.updateUserCommunity.name}`, () => {
        it('should update user profile if it exists', async () => {
            const userIdentifier = randomUUID()
            const communityCode = randomUUID()

            userProfileModelMock.updateOne.mockResolvedValue({ modifiedCount: 1 })

            await userProfileService.updateUserCommunity(userIdentifier, communityCode)

            expect(userProfileModelMock.updateOne).toHaveBeenCalledWith({ identifier: userIdentifier }, { $set: { communityCode } })
        })

        it('should throw error if user profile does not exists', async () => {
            const userIdentifier = randomUUID()
            const communityCode = randomUUID()

            userProfileModelMock.updateOne.mockResolvedValue({ modifiedCount: 0 })

            await expect(userProfileService.updateUserCommunity(userIdentifier, communityCode)).rejects.toThrow(
                new ModelNotFoundError(userProfileModelMock.modelName, ''),
            )
        })
    })

    describe(`method ${userProfileService.getUserInfo.name}`, () => {
        it('should return user info with attention message', () => {
            const { user } = testKit.session.getUserSession()

            const result = userProfileService.getUserInfo(user)

            expect(result).toEqual({
                attentionMessage: {
                    text: 'Дія не зберігає ваші дані.',
                    icon: '☝️',
                },
                text: 'Ми заповнили дані з вашого BankID. Будь ласка, перевірте їх та змініть за потреби.',
                phoneNumber: user.phoneNumber,
                email: user.email,
            })
        })
    })

    describe(`method ${userProfileService.getCabinetUserInfo.name}`, () => {
        it('should return cabinet user info', () => {
            const { user } = testKit.session.getCabinetUserSession({ edrpou: randomUUID() })

            const result = userProfileService.getCabinetUserInfo(<UserTokenData>(<unknown>user))

            expect(result).toEqual({
                itn: user.itn,
                edrpou: user.edrpou,
                fName: user.fName,
                lName: user.lName,
                mName: user.mName,
                gender: user.gender,
                birthDay: user.birthDay,
                phoneNumber: user.phoneNumber,
                email: user.email,
            })
        })
    })

    describe(`method ${userProfileService.getFilterCoverage.name}`, () => {
        it('should return percent', async () => {
            const gender = testKit.session.getGender()
            const userFilter: UserFilter = { gender }
            const estimatedDocumentCount = testKit.random.getRandomInt(20, 1000)
            const usersCount = testKit.random.getRandomInt(1, 100)
            const percent = Number.parseFloat(((usersCount / estimatedDocumentCount) * 100).toFixed(2))
            const size = Math.floor(estimatedDocumentCount * 0.05)

            userProfileModelMock.estimatedDocumentCount.mockResolvedValueOnce(estimatedDocumentCount)
            userProfileModelMock.aggregate.mockReturnValue(userProfileModelMock)
            userProfileModelMock.count.mockResolvedValueOnce([{ usersCount }])

            const result = await userProfileService.getFilterCoverage(userFilter)

            expect(userProfileModelMock.estimatedDocumentCount).toHaveBeenCalled()
            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([{ $sample: { size } }, { $match: { gender } }])
            expect(userProfileModelMock.count).toHaveBeenCalledWith('usersCount')
            expect(result).toEqual({ percent })
        })

        it('should return NaN', async () => {
            const gender = testKit.session.getGender()
            const userFilter: UserFilter = { gender }
            const estimatedDocumentCount = 0
            const usersCount = 0

            userProfileModelMock.estimatedDocumentCount.mockResolvedValueOnce(estimatedDocumentCount)
            userProfileModelMock.aggregate.mockReturnValue(userProfileModelMock)
            userProfileModelMock.count.mockResolvedValueOnce([{ usersCount }])

            const result = await userProfileService.getFilterCoverage(userFilter)

            expect(userProfileModelMock.estimatedDocumentCount).toHaveBeenCalled()
            expect(userProfileModelMock.count).toHaveBeenCalledWith('usersCount')
            expect(result).toEqual({ percent: Number.NaN })
        })
    })

    describe(`method ${userProfileService.notifyUsers.name}`, () => {
        it(`should publish ${InternalEvent.UserSendMassNotifications} event with found user identifiers`, async () => {
            const gender = testKit.session.getGender()
            const userFilter: UserFilter = { gender }
            const templateCode = MessageTemplateCode.DriverLicenseDataChanged
            const userIdentifiers = Array.from({ length: appConfig.notifications.targetBatchSize }).map(() => randomUUID())

            appConfig.notifications.isEnabled = true
            userProfileModelMock.aggregate.mockReturnValueOnce(userProfileModelMock)
            userProfileModelMock.cursor.mockReturnValueOnce(userProfileModelMock)
            userProfileModelMock.eachAsync.mockImplementation((cb) => cb(userIdentifiers.map((identifier) => ({ identifier }))))

            await userProfileService.notifyUsers(userFilter, templateCode)

            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([{ $match: { gender } }, { $project: { identifier: 1, _id: 0 } }])
            expect(userProfileModelMock.cursor).toHaveBeenCalled()
            expect(userProfileModelMock.eachAsync).toHaveBeenCalledWith(expect.any(Function), {
                batchSize: appConfig.notifications.targetBatchSize,
            })
            expect(eventBus.publish).toHaveBeenCalledWith(InternalEvent.UserSendMassNotifications, { userIdentifiers, templateCode })
        })

        it(`should not publish ${InternalEvent.UserSendMassNotifications} event if notifications by target filter are disabled`, async () => {
            const gender = testKit.session.getGender()
            const userFilter: UserFilter = { gender }
            const templateCode = MessageTemplateCode.DriverLicenseDataChanged

            appConfig.notifications.isEnabled = false

            await userProfileService.notifyUsers(userFilter, templateCode)

            expect(logger.info).toHaveBeenCalledWith('Notifications by target filter are disabled')
            expect(eventBus.publish).not.toHaveBeenCalled()

            appConfig.notifications.isEnabled = true
        })
    })

    describe(`method ${userProfileService.subscribeUsersToTopic.name}`, () => {
        beforeAll(() => {
            jest.spyOn(notificationService, 'topicIdentifierByTotal').mockImplementation(
                (total, topicsBatch) => `${Math.floor(total / topicsBatch)}`,
            )
        })

        type TestParams = [
            string,
            number,
            (
                appVersions: NotificationAppVersionsByPlatformType,
                campaignId: string,
                channel: string,
                topicsBatch: number,
                userIdentifiers: string[],
                targetUsersCount: number,
                targetBatchSize: number,
            ) => unknown,
        ]

        it.each(<TestParams[]>[
            [
                'target users count is a multiple to target batch size',
                appConfig.notifications.targetBatchSize * testKit.random.getRandomInt(1, 100) * 2,
                (appVersions, campaignId, channel, topicsBatch, userIdentifiers, targetUsersCount, targetBatchSize): unknown => ({
                    uuid: expect.any(String),
                    request: {
                        appVersions,
                        campaignId,
                        userIdentifiers: [...userIdentifiers].splice(
                            (Math.floor(targetUsersCount / targetBatchSize) - 1) * targetBatchSize,
                            targetBatchSize,
                        ),
                        topic: {
                            channel,
                            identifier: `${Math.floor((targetUsersCount - targetBatchSize) / topicsBatch)}`,
                        },
                    },
                }),
            ],
            [
                'target users count is not a multiple to target batch size',
                appConfig.notifications.targetBatchSize * testKit.random.getRandomInt(1, 100) * 2 + 1,
                (appVersions, campaignId, channel, topicsBatch, userIdentifiers, targetUsersCount, targetBatchSize): unknown => ({
                    uuid: expect.any(String),
                    request: {
                        appVersions,
                        campaignId,
                        userIdentifiers: [...userIdentifiers].splice(
                            Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize,
                            targetBatchSize,
                        ),
                        topic: {
                            channel,
                            identifier: `${Math.floor((Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize) / topicsBatch)}`,
                        },
                    },
                }),
            ],
        ])('should subscribe users to topics by user identifiers link when %s', async (_msg, targetUsersCount, getExpectedLastPublish) => {
            const { targetBatchSize } = appConfig.notifications
            const userIdentifiersLink = 'https://user-identifiers.link'
            const userIdentifiers: string[] = Array.from({ length: targetUsersCount }).map(() => randomUUID())
            const filter = { gender: Gender.female, childrenAmount: 5, userIdentifiersLink }
            const channel: string = randomUUID()
            const topicsBatch = testKit.random.getRandomInt(1, targetUsersCount)
            const campaignId: string = randomUUID()
            const appVersions: NotificationAppVersionsByPlatformType = {
                [PlatformType.Android]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.Huawei]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.iOS]: { minVersion: '3', maxVersion: '11' },
            }
            const expectedLastPublish = getExpectedLastPublish(
                appVersions,
                campaignId,
                channel,
                topicsBatch,
                userIdentifiers,
                targetUsersCount,
                targetBatchSize,
            )

            nock(userIdentifiersLink)
                .get('/')
                .reply(HttpStatusCode.OK, () => Stream.Readable.from(JSON.stringify(userIdentifiers)))
            jest.spyOn(notificationService, 'setSubscriptionBatches').mockResolvedValueOnce()

            await userProfileService.subscribeUsersToTopic(filter, channel, topicsBatch, appVersions, campaignId)

            for (let i = 0; i < Math.ceil(targetUsersCount / targetBatchSize); i++) {
                expect(externalEventBusMock.publish).toHaveBeenNthCalledWith(i + 1, ExternalEvent.NotificationTopicSubscribe, {
                    uuid: expect.any(String),
                    request: {
                        appVersions,
                        campaignId,
                        userIdentifiers: [...userIdentifiers].splice(i * targetBatchSize, targetBatchSize),
                        topic: { channel, identifier: `${Math.floor((i * targetBatchSize) / topicsBatch)}` },
                    },
                })
            }

            expect(externalEventBusMock.publish).toHaveBeenLastCalledWith(ExternalEvent.NotificationTopicSubscribe, expectedLastPublish)
            expect(notificationService.setSubscriptionBatches).toHaveBeenCalledWith({
                campaignId,
                subscriptionBatches: Math.ceil(targetUsersCount / targetBatchSize),
                targetUsersCount,
            })
        })

        it('should subscribe users to topics by user itns link', async () => {
            const { targetBatchSize } = appConfig.notifications
            const itnsLink = 'https://user-identifiers.link'
            const targetUsersCount = targetBatchSize * testKit.random.getRandomInt(1, 100) * 2 + 1
            const userItns = Array.from({ length: targetUsersCount }).map(() =>
                testKit.session.generateItn(testKit.session.getBirthDate(), testKit.session.getGender(), false),
            )
            const filter = { gender: Gender.female, childrenAmount: 5, itnsLink }
            const channel = randomUUID()
            const topicsBatch = testKit.random.getRandomInt(1, targetUsersCount)
            const campaignId = randomUUID()
            const appVersions = {
                [PlatformType.Android]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.Huawei]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.iOS]: { minVersion: '3', maxVersion: '11' },
            }

            nock(itnsLink)
                .get('/')
                .reply(HttpStatusCode.OK, () => Stream.Readable.from(JSON.stringify(userItns)))
            jest.spyOn(notificationService, 'setSubscriptionBatches').mockResolvedValueOnce()

            await userProfileService.subscribeUsersToTopic(filter, channel, topicsBatch, appVersions, campaignId)

            for (let i = 0; i < Math.ceil(targetUsersCount / targetBatchSize); i++) {
                expect(externalEventBusMock.publish).toHaveBeenNthCalledWith(i + 1, ExternalEvent.NotificationTopicSubscribe, {
                    uuid: expect.any(String),
                    request: {
                        appVersions,
                        campaignId,
                        userIdentifiers: [...userItns]
                            .splice(i * targetBatchSize, targetBatchSize)
                            .map((itn) => identifierService.createIdentifier(itn)),
                        topic: { channel, identifier: `${Math.floor((i * targetBatchSize) / topicsBatch)}` },
                    },
                })
            }

            expect(externalEventBusMock.publish).toHaveBeenLastCalledWith(ExternalEvent.NotificationTopicSubscribe, {
                uuid: expect.any(String),
                request: {
                    appVersions,
                    campaignId,
                    userIdentifiers: [...userItns]
                        .splice(Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize, targetBatchSize)
                        .map((itn) => identifierService.createIdentifier(itn)),
                    topic: {
                        channel,
                        identifier: `${Math.floor((Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize) / topicsBatch)}`,
                    },
                },
            })
            expect(notificationService.setSubscriptionBatches).toHaveBeenCalledWith({
                campaignId,
                subscriptionBatches: Math.ceil(targetUsersCount / targetBatchSize),
                targetUsersCount,
            })
        })

        it.each([
            ['filter is empty', {}, []],
            [
                'filter has organizationId',
                { organizationId: 'organization-id' },
                [{ $match: { 'features.office.organizationId': 'organization-id' } }],
            ],
            [
                'filter has age.from and age.to',
                { age: { from: 13, to: 7 } },
                [{ $match: { birthDay: { $lte: expect.any(Date), $gte: expect.any(Date) } } }],
            ],
            ['filter has gender', { gender: Gender.male }, [{ $match: { gender: Gender.male } }]],
            [
                'filter has childrenAmount',
                { childrenAmount: 7 },
                [
                    {
                        $lookup: {
                            from: userDocumentModel.collection.name,
                            localField: 'identifier',
                            foreignField: 'userIdentifier',
                            as: 'documents',
                        },
                    },
                    {
                        $set: {
                            children: {
                                $size: {
                                    $filter: {
                                        input: '$documents',
                                        as: 'document',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$document.documentType', 'birth-certificate'] },
                                                { $ne: ['$$document.docStatus', DocStatus.NotFound] },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    { $match: { children: 7 } },
                ],
            ],
            [
                'filter has documents',
                { documents: [{ type: 'internal-passport' }, { type: 'residence-permit-temporary' }] },
                [
                    {
                        $lookup: {
                            from: userDocumentModel.collection.name,
                            localField: 'identifier',
                            foreignField: 'userIdentifier',
                            as: 'documents',
                        },
                    },
                    {
                        $match: {
                            'documents.documentType': { $in: ['internal-passport', 'residence-permit-temporary'] },
                            'documents.docStatus': { $ne: DocStatus.NotFound },
                        },
                    },
                ],
            ],
            [
                'filter has gender, childrenAmount, age.to and documents',
                {
                    gender: Gender.female,
                    childrenAmount: 5,
                    age: { to: 60 },
                    documents: [{ type: 'foreign-passport' }, { type: 'pension-card' }],
                },
                [
                    { $match: { gender: Gender.female, birthDay: { $gte: expect.any(Date) } } },
                    {
                        $lookup: {
                            from: userDocumentModel.collection.name,
                            localField: 'identifier',
                            foreignField: 'userIdentifier',
                            as: 'documents',
                        },
                    },
                    {
                        $match: {
                            'documents.documentType': { $in: ['foreign-passport', 'pension-card'] },
                            'documents.docStatus': { $ne: DocStatus.NotFound },
                        },
                    },
                    {
                        $set: {
                            children: {
                                $size: {
                                    $filter: {
                                        input: '$documents',
                                        as: 'document',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$document.documentType', 'birth-certificate'] },
                                                { $ne: ['$$document.docStatus', DocStatus.NotFound] },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    { $match: { children: 5 } },
                ],
            ],
        ])('should subscribe users to topics by identifiers from user profile when %s', async (_msg, filter, expectedQuery) => {
            const { targetBatchSize } = appConfig.notifications
            const targetUsersCount = targetBatchSize * testKit.random.getRandomInt(1, 100) * 2 + 1
            const userIdentifiers = Array.from({ length: targetUsersCount }).map(() => randomUUID())
            const channel = randomUUID()
            const topicsBatch = testKit.random.getRandomInt(1, targetUsersCount)
            const campaignId = randomUUID()
            const appVersions = {
                [PlatformType.Android]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.Huawei]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.iOS]: { minVersion: '3', maxVersion: '11' },
            }

            jest.spyOn(notificationService, 'setSubscriptionBatches').mockResolvedValueOnce()
            userProfileModelMock.aggregate.mockReturnValue(userProfileModelMock)
            userProfileModelMock.cursor.mockReturnValueOnce(Stream.Readable.from(userIdentifiers.map((identifier) => ({ identifier }))))

            await userProfileService.subscribeUsersToTopic(filter, channel, topicsBatch, appVersions, campaignId)

            for (let i = 0; i < Math.ceil(targetUsersCount / targetBatchSize); i++) {
                expect(externalEventBusMock.publish).toHaveBeenNthCalledWith(i + 1, ExternalEvent.NotificationTopicSubscribe, {
                    uuid: expect.any(String),
                    request: {
                        appVersions,
                        campaignId,
                        userIdentifiers: [...userIdentifiers].splice(i * targetBatchSize, targetBatchSize),
                        topic: { channel, identifier: `${Math.floor((i * targetBatchSize) / topicsBatch)}` },
                    },
                })
            }

            expect(externalEventBusMock.publish).toHaveBeenLastCalledWith(ExternalEvent.NotificationTopicSubscribe, {
                uuid: expect.any(String),
                request: {
                    appVersions,
                    campaignId,
                    userIdentifiers: [...userIdentifiers].splice(
                        Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize,
                        targetBatchSize,
                    ),
                    topic: {
                        channel,
                        identifier: `${Math.floor((Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize) / topicsBatch)}`,
                    },
                },
            })
            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([...expectedQuery, { $project: { identifier: 1, _id: 0 } }])
            expect(notificationService.setSubscriptionBatches).toHaveBeenCalledWith({
                campaignId,
                subscriptionBatches: Math.ceil(targetUsersCount / targetBatchSize),
                targetUsersCount,
            })
        })

        it('should subscribe users to topics by identifiers from user profile when topicsBatch was not passed', async () => {
            const { targetBatchSize } = appConfig.notifications
            const targetUsersCount = targetBatchSize * testKit.random.getRandomInt(1, 100) * 2 + 1
            const userIdentifiers = Array.from({ length: targetUsersCount }).map(() => randomUUID())
            const channel = randomUUID()
            const campaignId = randomUUID()
            const filter = { gender: Gender.male }
            const appVersions = {
                [PlatformType.Android]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.Huawei]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.iOS]: { minVersion: '3', maxVersion: '11' },
            }

            jest.spyOn(notificationService, 'setSubscriptionBatches').mockResolvedValueOnce()
            userProfileModelMock.aggregate.mockReturnValue(userProfileModelMock)
            userProfileModelMock.cursor.mockReturnValueOnce(Stream.Readable.from(userIdentifiers.map((identifier) => ({ identifier }))))

            await userProfileService.subscribeUsersToTopic(filter, channel, undefined, appVersions, campaignId)

            for (let i = 0; i < Math.ceil(targetUsersCount / targetBatchSize); i++) {
                expect(externalEventBusMock.publish).toHaveBeenNthCalledWith(i + 1, ExternalEvent.NotificationTopicSubscribe, {
                    uuid: expect.any(String),
                    request: {
                        appVersions,
                        campaignId,
                        userIdentifiers: [...userIdentifiers].splice(i * targetBatchSize, targetBatchSize),
                        topic: { channel },
                    },
                })
            }

            expect(externalEventBusMock.publish).toHaveBeenLastCalledWith(ExternalEvent.NotificationTopicSubscribe, {
                uuid: expect.any(String),
                request: {
                    appVersions,
                    campaignId,
                    userIdentifiers: [...userIdentifiers].splice(
                        Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize,
                        targetBatchSize,
                    ),
                    topic: { channel },
                },
            })
            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([
                { $match: { gender: Gender.male } },
                { $project: { identifier: 1, _id: 0 } },
            ])
            expect(notificationService.setSubscriptionBatches).toHaveBeenCalledWith({
                campaignId,
                subscriptionBatches: Math.ceil(targetUsersCount / targetBatchSize),
                targetUsersCount,
            })
        })

        it('should subscribe users to topics by identifiers from user profile when appVersions was not passed', async () => {
            const { targetBatchSize } = appConfig.notifications
            const targetUsersCount = targetBatchSize * testKit.random.getRandomInt(1, 100) * 2 + 1
            const userIdentifiers = Array.from({ length: targetUsersCount }).map(() => randomUUID())
            const channel = randomUUID()
            const topicsBatch = testKit.random.getRandomInt(1, targetUsersCount)
            const campaignId = randomUUID()
            const filter = { gender: Gender.male }

            jest.spyOn(notificationService, 'setSubscriptionBatches').mockResolvedValueOnce()
            userProfileModelMock.aggregate.mockReturnValue(userProfileModelMock)
            userProfileModelMock.cursor.mockReturnValueOnce(Stream.Readable.from(userIdentifiers.map((identifier) => ({ identifier }))))

            await userProfileService.subscribeUsersToTopic(filter, channel, topicsBatch, undefined, campaignId)

            for (let i = 0; i < Math.ceil(targetUsersCount / targetBatchSize); i++) {
                expect(externalEventBusMock.publish).toHaveBeenNthCalledWith(i + 1, ExternalEvent.NotificationTopicSubscribe, {
                    uuid: expect.any(String),
                    request: {
                        campaignId,
                        userIdentifiers: [...userIdentifiers].splice(i * targetBatchSize, targetBatchSize),
                        topic: { channel, identifier: `${Math.floor((i * targetBatchSize) / topicsBatch)}` },
                    },
                })
            }

            expect(externalEventBusMock.publish).toHaveBeenLastCalledWith(ExternalEvent.NotificationTopicSubscribe, {
                uuid: expect.any(String),
                request: {
                    campaignId,
                    userIdentifiers: [...userIdentifiers].splice(
                        Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize,
                        targetBatchSize,
                    ),
                    topic: {
                        channel,
                        identifier: `${Math.floor((Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize) / topicsBatch)}`,
                    },
                },
            })
            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([
                { $match: { gender: Gender.male } },
                { $project: { identifier: 1, _id: 0 } },
            ])
            expect(notificationService.setSubscriptionBatches).toHaveBeenCalledWith({
                campaignId,
                subscriptionBatches: Math.ceil(targetUsersCount / targetBatchSize),
                targetUsersCount,
            })
        })

        it('should subscribe users to topics by identifiers from user profile when appVersions and campaignId was not passed', async () => {
            const { targetBatchSize } = appConfig.notifications
            const targetUsersCount = targetBatchSize * testKit.random.getRandomInt(1, 100) * 2 + 1
            const userIdentifiers = Array.from({ length: targetUsersCount }).map(() => randomUUID())
            const channel = randomUUID()
            const topicsBatch = testKit.random.getRandomInt(1, targetUsersCount)
            const filter = { gender: Gender.female }

            userProfileModelMock.aggregate.mockReturnValue(userProfileModelMock)
            userProfileModelMock.cursor.mockReturnValueOnce(Stream.Readable.from(userIdentifiers.map((identifier) => ({ identifier }))))

            await userProfileService.subscribeUsersToTopic(filter, channel, topicsBatch)

            for (let i = 0; i < Math.ceil(targetUsersCount / targetBatchSize); i++) {
                expect(externalEventBusMock.publish).toHaveBeenNthCalledWith(i + 1, ExternalEvent.NotificationTopicSubscribe, {
                    uuid: expect.any(String),
                    request: {
                        userIdentifiers: [...userIdentifiers].splice(i * targetBatchSize, targetBatchSize),
                        topic: { channel, identifier: `${Math.floor((i * targetBatchSize) / topicsBatch)}` },
                    },
                })
            }

            expect(externalEventBusMock.publish).toHaveBeenLastCalledWith(ExternalEvent.NotificationTopicSubscribe, {
                uuid: expect.any(String),
                request: {
                    userIdentifiers: [...userIdentifiers].splice(
                        Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize,
                        targetBatchSize,
                    ),
                    topic: {
                        channel,
                        identifier: `${Math.floor((Math.floor(targetUsersCount / targetBatchSize) * targetBatchSize) / topicsBatch)}`,
                    },
                },
            })
            expect(userProfileModelMock.aggregate).toHaveBeenCalledWith([
                { $match: { gender: Gender.female } },
                { $project: { identifier: 1, _id: 0 } },
            ])
        })

        it('should throw InternalServerError if failed to stream user identifiers', async () => {
            const userIdentifiersLink = 'https://user-identifiers.link'
            const targetUsersCount = 1
            const filter = { gender: Gender.female, childrenAmount: 5, userIdentifiersLink }
            const channel = randomUUID()
            const topicsBatch = testKit.random.getRandomInt(1, targetUsersCount)
            const campaignId = randomUUID()
            const appVersions = {
                [PlatformType.Android]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.Huawei]: { minVersion: '7', maxVersion: '15' },
                [PlatformType.iOS]: { minVersion: '3', maxVersion: '11' },
            }

            await expect(userProfileService.subscribeUsersToTopic(filter, channel, topicsBatch, appVersions, campaignId)).rejects.toThrow(
                new InternalServerError('Failed to subscribe users to topic'),
            )
        })
    })
})
