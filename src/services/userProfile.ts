import { Readable, Transform, Writable, pipeline as streamsPipeline } from 'node:stream'
import { pipeline as streamsPipelineAsync } from 'node:stream/promises'

import got from 'got'
import moment from 'moment'
import { parser } from 'stream-json'
import { streamArray } from 'stream-json/streamers/StreamArray'
import Batch from 'stream-json/utils/Batch'
import { v4 as uuidv4 } from 'uuid'

import { AnalyticsActionResult } from '@diia-inhouse/analytics'
import { IdentifierService } from '@diia-inhouse/crypto'
import { FilterQuery, PipelineStage, ProjectionType, UpdateQuery, mongo } from '@diia-inhouse/db'
import { EventBus, ExternalEventBus } from '@diia-inhouse/diia-queue'
import { BadRequestError, InternalServerError, ModelNotFoundError } from '@diia-inhouse/errors'
import {
    ActHeaders,
    DiiaOfficeStatus,
    DocStatus,
    DurationMs,
    Logger,
    PlatformType,
    ProfileFeature,
    UserTokenData,
} from '@diia-inhouse/types'

import NotificationService from '@services/notification'
import UnregisteredOfficeProfile from '@services/unregisteredOfficeProfile'
import UserDeviceService from '@services/userDevice'
import UserDocumentService from '@services/userDocument'

import userDocumentModel from '@models/userDocument'
import userProfileModel from '@models/userProfile'

import UserProfileDataMapper from '@dataMappers/userProfileDataMapper'

import { AppConfig } from '@interfaces/config'
import { UserDocument } from '@interfaces/models/userDocument'
import {
    CitizenshipSource,
    DiiaOfficeProfile,
    UserProfile,
    UserProfileCitizenship,
    UserProfileFeatures,
    UserProfileModel,
} from '@interfaces/models/userProfile'
import { ExternalEvent, InternalEvent } from '@interfaces/queue'
import { MessageTemplateCode, NotificationAppVersionsByPlatformType, PushTopic, TemplateParams } from '@interfaces/services/notification'
import { UserDocumentTypesCounts } from '@interfaces/services/userDocument'
import {
    CabinetUserInfo,
    UserFilter,
    UserFilterCount,
    UserFilterCoverage,
    UserFilterDocument,
    UserIdentifier,
    UserIdentifiersWithLastId,
    UserInfoForFilters,
    UserInfoWithAttentionMessage,
} from '@interfaces/services/userProfile'

export default class UserProfileService {
    private readonly timezoneOffset: number

    constructor(
        private readonly userDeviceService: UserDeviceService,
        private readonly lazyUserDocumentService: () => UserDocumentService,
        private readonly notificationService: NotificationService,
        private readonly unregisteredOfficeProfileService: UnregisteredOfficeProfile,
        private readonly userProfileDataMapper: UserProfileDataMapper,

        private readonly config: AppConfig,
        private readonly eventBus: EventBus,
        private readonly externalEventBus: ExternalEventBus,
        private readonly logger: Logger,
        private readonly identifier: IdentifierService,
    ) {
        this.timezoneOffset = new Date().getTimezoneOffset() * DurationMs.Hour
    }

    async createOrUpdateProfile(newUserProfile: UserProfile, headers: ActHeaders, rnokpp: string): Promise<void> {
        const { identifier, gender, birthDay } = newUserProfile
        const { mobileUid, platformType, platformVersion, appVersion } = headers

        const userProfile = await userProfileModel.findOne({ identifier })
        if (userProfile) {
            await this.userDeviceService.updateDevice(identifier, headers)

            return
        }

        const dateOfBirth: Date = new Date(birthDay.getTime() - this.timezoneOffset)

        await Promise.all([userProfileModel.create(newUserProfile), this.userDeviceService.updateDevice(identifier, headers)])

        this.logger.info('Analytics', {
            analytics: {
                date: new Date().toISOString(),
                category: 'users',
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

        await this.checkForUserProfileFeatures(identifier)
        await this.eventBus.publish(InternalEvent.UserProfileCreated, { userIdentifier: identifier, itn: rnokpp })
    }

    async checkForUserProfileFeatures(identifier: string): Promise<void> {
        const diiaOfficeProfile = await this.unregisteredOfficeProfileService.getUnregisteredProfile(identifier)

        if (diiaOfficeProfile) {
            await this.setProfileFeature(identifier, ProfileFeature.office, diiaOfficeProfile)
            await this.unregisteredOfficeProfileService.removeUnregisteredProfile(identifier)
        }
    }

    async getUserProfileFeatures(userIdentifier: string, requestedFeatures: ProfileFeature[]): Promise<UserProfileFeatures> {
        if (!this.config.profileFeatures.isEnabled) {
            return {}
        }

        const projection: Record<string, number> = {}

        for (const feature of requestedFeatures) {
            projection[`features.${feature}`] = 1
        }

        const { features = {} } = await this.getUserProfile(userIdentifier, projection)

        return features
    }

    async getUserProfiles(userIdentifiers: string[]): Promise<UserProfile[]> {
        const query: FilterQuery<UserProfileModel> = { identifier: { $in: userIdentifiers } }
        const userProfiles = await userProfileModel.find(query).lean()

        return userProfiles
    }

    async setProfileFeature(identifier: string, feature: ProfileFeature, featureData: unknown): Promise<void> {
        if (this.isOfficeProfile(feature, featureData)) {
            await userProfileModel.updateOne(
                {
                    [`features.${ProfileFeature.office}.profileId`]: featureData.profileId,
                    identifier: { $ne: identifier },
                },
                { $unset: { [`features.${ProfileFeature.office}`]: 1 } },
            )
        }

        const updateResult = await userProfileModel.updateOne({ identifier }, { $set: { [`features.${feature}`]: featureData } })

        if (this.isOfficeProfile(feature, featureData) && updateResult.matchedCount === 0) {
            await this.unregisteredOfficeProfileService.addUnregisteredProfile(identifier, featureData)
        }
    }

    async removeProfileFeature(identifier: string, feature: ProfileFeature): Promise<void> {
        await userProfileModel.updateOne({ identifier }, { $unset: { [`features.${feature}`]: 1 } })
        if (feature === ProfileFeature.office) {
            await this.unregisteredOfficeProfileService.removeUnregisteredProfile(identifier)
        }
    }

    async officeTokenFailed(profileId: string, reason: string): Promise<void> {
        await userProfileModel.updateOne(
            {
                [`features.${ProfileFeature.office}.profileId`]: profileId,
            },
            {
                $set: {
                    [`features.${ProfileFeature.office}.tokenError`]: reason,
                    [`features.${ProfileFeature.office}.tokenFailedAt`]: new Date(),
                },
            },
        )
    }

    async getUserIdentifiersByPlatformTypes(
        platformTypes: PlatformType[],
        limit: number,
        lastId?: mongo.ObjectId,
    ): Promise<UserIdentifiersWithLastId> {
        const query: FilterQuery<UserProfileModel> = {}
        if (lastId) {
            query._id = { $gt: lastId }
        }

        if (platformTypes) {
            query['devices.platform.type'] = { $in: platformTypes }
        }

        const pipeline: PipelineStage[] = [{ $match: query }, { $limit: limit }, { $project: { identifier: 1, _id: 1 } }]

        const userIdentifiers: { identifier: string; _id: mongo.ObjectId }[] = await userProfileModel.aggregate(pipeline)
        const nextLast = userIdentifiers.length > 0 && userIdentifiers.at(-1)
        const nextLastId: mongo.ObjectId | undefined = nextLast ? nextLast._id : undefined

        return {
            userIdentifiers: userIdentifiers.map(({ identifier }: { identifier: string }) => identifier),
            nextLastId,
        }
    }

    async hasUserProfile(userIdentifier: string): Promise<boolean> {
        const query: FilterQuery<UserProfileModel> = { identifier: userIdentifier }
        const userProfile = await userProfileModel.findOne(query)

        return Boolean(userProfile)
    }

    async getUserFilterInfo(userIdentifier: string): Promise<UserInfoForFilters> {
        const [userProfile, documents]: [UserProfile, UserDocumentTypesCounts] = await Promise.all([
            this.getUserProfile(userIdentifier),
            this.lazyUserDocumentService().getUserDocumentTypesCounts(userIdentifier),
        ])

        const { gender, birthDay, features } = userProfile

        let organizationId: string | undefined
        if (features?.[ProfileFeature.office] && this.config.profileFeatures.isEnabled) {
            const { status, organizationId: userOrgId } = features[ProfileFeature.office]

            if (status === DiiaOfficeStatus.ACTIVE) {
                organizationId = userOrgId
            }
        }

        return {
            age: moment().diff(birthDay, 'years'),
            gender,
            documents,
            organizationId,
        }
    }

    async getUserProfile(userIdentifier: string, projection?: ProjectionType<UserProfile>): Promise<UserProfile> {
        const query: FilterQuery<UserProfileModel> = { identifier: userIdentifier }
        const userProfile = await userProfileModel.findOne(query, projection)
        if (!userProfile) {
            throw new ModelNotFoundError(userProfileModel.modelName, '')
        }

        return userProfile
    }

    async getUserCitizenship(userIdentifier: string, source: CitizenshipSource): Promise<UserProfileCitizenship | undefined> {
        const query: FilterQuery<UserProfileModel> = { identifier: userIdentifier }
        const userProfile = await userProfileModel.findOne(query, { citizenship: 1 })
        if (!userProfile) {
            throw new ModelNotFoundError(userProfileModel.modelName, '')
        }

        return userProfile.citizenship?.[source]
    }

    async updateUserCitizenship(userIdentifier: string, source: CitizenshipSource, sourceId: string): Promise<void> {
        const query: FilterQuery<UserProfileModel> = { identifier: userIdentifier }
        const modifier: UpdateQuery<UserProfileModel> = {
            $set: {
                [`citizenship.${source}`]: {
                    country: 'Ukraine',
                    date: new Date(),
                    sourceId,
                },
            },
        }

        const { modifiedCount } = await userProfileModel.updateOne(query, modifier)
        if (modifiedCount === 0) {
            throw new ModelNotFoundError(userProfileModel.modelName, '')
        }
    }

    async updateUserCommunity(userIdentifier: string, communityCode: string): Promise<void> {
        const query: FilterQuery<UserProfileModel> = { identifier: userIdentifier }
        const modifier: UpdateQuery<UserProfileModel> = { $set: { communityCode } }

        const { modifiedCount } = await userProfileModel.updateOne(query, modifier)
        if (modifiedCount === 0) {
            throw new ModelNotFoundError(userProfileModel.modelName, '')
        }
    }

    getUserInfo(user: UserTokenData): UserInfoWithAttentionMessage {
        const { phoneNumber, email } = user

        return {
            attentionMessage: {
                text: 'Дія не зберігає ваші дані.',
                icon: '☝️',
            },
            text: this.userProfileDataMapper.getUserInfoText(user),
            phoneNumber,
            email,
        }
    }

    getCabinetUserInfo(user: UserTokenData): CabinetUserInfo {
        const { itn, fName, lName, mName, gender, birthDay, phoneNumber, email, edrpou } = user

        return {
            itn,
            edrpou,
            fName,
            lName,
            mName,
            gender,
            birthDay,
            phoneNumber,
            email,
        }
    }

    async getFilterCoverage(filter: UserFilter): Promise<UserFilterCoverage> {
        const profilesCount: number = await userProfileModel.estimatedDocumentCount()
        const sampleSize: number = Math.floor(profilesCount * 0.05)

        const pipeline: PipelineStage[] = sampleSize ? [{ $sample: { size: sampleSize } }] : []
        const countName: keyof UserFilterCount = 'usersCount'
        const [userFilterCount]: UserFilterCount[] = await userProfileModel
            .aggregate(this.getFilterUsersPipeline(filter, pipeline))
            .count(countName)
        const usersCount: number = userFilterCount?.usersCount || 0

        const percent: number = Number.parseFloat(((usersCount / profilesCount) * 100).toFixed(2))

        return { percent }
    }

    async notifyUsers(
        filter: UserFilter,
        templateCode: MessageTemplateCode,
        resourceId?: string,
        templateParams?: TemplateParams,
        appVersions?: NotificationAppVersionsByPlatformType,
    ): Promise<void> {
        if (!this.config.notifications.isEnabled) {
            this.logger.info('Notifications by target filter are disabled')

            return
        }

        const pipeline: PipelineStage[] = this.getFilterUsersPipeline(filter)

        pipeline.push({ $project: { identifier: 1, _id: 0 } })
        await userProfileModel
            .aggregate(pipeline)
            .cursor()
            .eachAsync(
                async (identifiers: UserIdentifier[]) => {
                    await this.eventBus.publish(InternalEvent.UserSendMassNotifications, {
                        userIdentifiers: identifiers.map(({ identifier }: UserIdentifier) => identifier),
                        templateCode,
                        resourceId,
                        templateParams,
                        appVersions,
                    })
                },
                { batchSize: this.config.notifications.targetBatchSize },
            )
    }

    async subscribeUsersToTopic(
        filter: UserFilter,
        channel: string,
        topicsBatch?: number,
        appVersions?: NotificationAppVersionsByPlatformType,
        campaignId?: string,
    ): Promise<void> {
        const { userIdentifiersLink, itnsLink } = filter

        const stream = userIdentifiersLink || itnsLink ? this.getFileStream(filter) : this.getUserProfileStream(filter)

        this.logger.info('Start subscribing users to topic', { channel })

        let targetUsersCount = 0
        let subscriptionBatches = 0

        try {
            await streamsPipelineAsync(
                stream,
                new Batch({ batchSize: this.config.notifications.targetBatchSize }),
                new Writable({
                    objectMode: true,
                    write: async (data: string[], _encoding, done): Promise<void> => {
                        await this.subscribeToNotificationTopic(data, targetUsersCount, channel, topicsBatch, appVersions, campaignId)
                        targetUsersCount += data.length
                        subscriptionBatches++
                        done()
                    },
                }),
            )
        } catch (err) {
            this.logger.error('Failed to stream user identifiers', { err })

            throw new InternalServerError('Failed to subscribe users to topic')
        }

        if (campaignId) {
            await this.notificationService.setSubscriptionBatches({
                campaignId,
                subscriptionBatches,
                targetUsersCount,
            })
        }

        this.logger.info(`Subscribed users to topic by target filter: ${targetUsersCount}`)
    }

    private async subscribeToNotificationTopic(
        userIdentifiers: string[],
        targetUsersCount: number,
        channel: string,
        topicsBatch?: number,
        appVersions?: NotificationAppVersionsByPlatformType,
        campaignId?: string,
    ): Promise<void> {
        const topic: PushTopic = {
            channel,
            identifier: topicsBatch ? this.notificationService.topicIdentifierByTotal(targetUsersCount, topicsBatch) : undefined,
        }

        await this.externalEventBus.publish(ExternalEvent.NotificationTopicSubscribe, {
            uuid: uuidv4(),
            request: {
                topic,
                userIdentifiers,
                appVersions,
                campaignId,
            },
        })
    }

    private isOfficeProfile(feature: ProfileFeature, _data: unknown): _data is DiiaOfficeProfile {
        return feature === ProfileFeature.office
    }

    private getFileStream(filter: UserFilter): Readable {
        const { userIdentifiersLink, itnsLink } = filter

        const url = userIdentifiersLink || itnsLink
        if (!url) {
            throw new BadRequestError('Missing url', { userIdentifiersLink, itnsLink })
        }

        this.logger.info('Start reading users from remote file for topic subscription', { url })
        const stream = streamsPipeline(
            got.stream(url),
            parser(),
            streamArray(),
            new Transform({
                objectMode: true,
                transform: (data, _encoding, done): void => {
                    done(null, userIdentifiersLink ? data.value : this.identifier.createIdentifier(data.value))
                },
            }),
            () => {},
        )

        return stream
    }

    private getUserProfileStream(filter: UserFilter): Readable {
        const pipeline: PipelineStage[] = this.getFilterUsersPipeline(filter)

        pipeline.push({ $project: { identifier: 1, _id: 0 } })

        this.logger.info('Get cursor for users getting for topic subscription')
        const stream = streamsPipeline(
            userProfileModel.aggregate(pipeline).cursor<UserIdentifier>(),
            new Transform({
                objectMode: true,
                transform({ identifier }, _encoding, done): void {
                    done(null, identifier)
                },
            }),
            () => {},
        )

        return stream
    }

    private getFilterUsersPipeline(filter: UserFilter, pipeline: PipelineStage[] = []): PipelineStage[] {
        const { gender, age, organizationId, documents, childrenAmount } = filter

        if (gender || age || organizationId) {
            const query: FilterQuery<UserProfileModel> = {}

            if (gender) {
                query.gender = gender
            }

            if (age?.from || age?.to) {
                query.birthDay = {}

                if (age.from) {
                    query.birthDay.$lte = moment().subtract(age.from, 'years').toDate()
                }

                if (age.to) {
                    query.birthDay.$gte = moment().subtract(age.to, 'years').toDate()
                }
            }

            if (organizationId) {
                query['features.office.organizationId'] = organizationId
            }

            pipeline.push({ $match: query })
        }

        if (documents?.length || childrenAmount !== undefined) {
            const localField: keyof UserProfile = 'identifier'
            const foreignField: keyof UserDocument = 'userIdentifier'

            pipeline.push({
                $lookup: {
                    from: userDocumentModel.collection.name,
                    localField,
                    foreignField,
                    as: 'documents',
                },
            })
        }

        if (documents?.length) {
            const requiredDocuments: string[] = documents.map(({ type }: UserFilterDocument) => type)

            pipeline.push({
                $match: {
                    'documents.documentType': { $in: requiredDocuments },
                    'documents.docStatus': { $ne: DocStatus.NotFound },
                },
            })
        }

        if (childrenAmount !== undefined) {
            pipeline.push(
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
                {
                    $match: {
                        children: childrenAmount,
                    },
                },
            )
        }

        return pipeline
    }
}
