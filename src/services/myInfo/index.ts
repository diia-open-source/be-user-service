import { StoreService } from '@diia-inhouse/redis'
import { DocumentType, DurationMs, UserTokenData } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import {
    ActRecordRequestType,
    GetActRecordsRes,
    GetFamilyRes,
    GetMyInfoRes,
    GetUserBirthRecordRes,
    HideActRecordReq,
    HideActRecordRes,
    UnhideActRecordsReq,
    UnhideActRecordsRes,
} from '@src/generated'

import ActRecordStrategyService from '@services/myInfo/actRecordStrategy'
import UserDocumentService from '@services/userDocument'
import UserDocumentSettingsService from '@services/userDocumentSettings'
import UserProfileService from '@services/userProfile'

import MyInfoDataMapper from '@dataMappers/myInfoDataMapper'

import { ProcessCode } from '@interfaces/services'
import { DedicatedActRecord } from '@interfaces/services/myInfo'

export default class MyInfoService {
    private readonly actRecordTypeToDocumentType: Record<ActRecordRequestType, DocumentType> = {
        [ActRecordRequestType.marriage_record]: DocumentType.MarriageActRecord,
        [ActRecordRequestType.divorce_record]: DocumentType.DivorceActRecord,
        [ActRecordRequestType.change_name_record]: DocumentType.NameChangeActRecord,
        [ActRecordRequestType.birth_certificate]: DocumentType.BirthCertificate,
    }

    constructor(
        private readonly store: StoreService,

        private readonly myInfoDataMapper: MyInfoDataMapper,

        private readonly myInfoActRecordStrategyService: ActRecordStrategyService,
        private readonly userDocumentService: UserDocumentService,
        private readonly userDocumentSettingsService: UserDocumentSettingsService,
        private readonly userProfileService: UserProfileService,
    ) {}

    async getMyInfo(user: UserTokenData): Promise<GetMyInfoRes> {
        const { identifier: userIdentifier } = user

        const userSettings = await this.userProfileService.getUserSettings(userIdentifier)
        if (!userSettings || userSettings.myInfoUsePassportPhoto === undefined) {
            return {
                ...this.myInfoDataMapper.toMyInfoScreen(user, false),
                processCode: ProcessCode.PermissionToUseDocPhotoRequired,
            }
        }

        return this.myInfoDataMapper.toMyInfoScreen(user, userSettings.myInfoUsePassportPhoto)
    }

    async getFamily(): Promise<GetFamilyRes> {
        return this.myInfoDataMapper.toFamilyScreen()
    }

    async getActRecords(
        user: UserTokenData,
        actRecordRequestType: ActRecordRequestType,
        eTag?: string,
        forceUpdate?: boolean,
    ): Promise<GetActRecordsRes> {
        const { identifier: userIdentifier, birthDay } = user

        const topGroup = this.myInfoDataMapper.toActRecordsTopGroup(actRecordRequestType)
        const bottomGroup = this.myInfoDataMapper.toActRecordsBottomGroup(actRecordRequestType)

        if (!this.verifyUserAge(birthDay)) {
            return this.myInfoDataMapper.toActRecordsInvalidAgeRes(topGroup)
        }

        const isItnValid = await this.verifyItn(userIdentifier)
        if (!isItnValid) {
            return this.myInfoDataMapper.toActRecordsInvalidItnRes(topGroup)
        }

        const strategy = this.myInfoActRecordStrategyService.getStrategy(actRecordRequestType)

        if (forceUpdate) {
            const isForceUpdateAvailable = await this.isForceUpdateAvailable(userIdentifier, actRecordRequestType)

            if (!isForceUpdateAvailable) {
                return { topGroup, bottomGroup, body: [], processCode: ProcessCode.ManualUpdateUnavailable }
            }
        }

        const clientETag = forceUpdate ? undefined : eTag

        const documentResponse = await strategy.getActRecords(user, clientETag)
        if (!documentResponse) {
            return {
                topGroup,
                body: [],
                bottomGroup,
            }
        }

        if (documentResponse.status >= 500) {
            return this.myInfoDataMapper.toActRecordsRegistryErrorRes(topGroup, bottomGroup)
        }

        const hiddenDocuments = await this.userDocumentSettingsService.getHiddenDocuments(
            userIdentifier,
            this.actRecordTypeToDocumentType[actRecordRequestType],
        )

        documentResponse.data = documentResponse.data.filter((doc) => !hiddenDocuments.includes(doc.id))

        if (!documentResponse.data.length) {
            return this.myInfoDataMapper.toActRecordsEmptyRes(topGroup, bottomGroup, actRecordRequestType, !!hiddenDocuments.length)
        }

        return {
            topGroup,
            body: [
                {
                    listItemGroupOrg: {
                        items: strategy.toActRecordsPreviewItem(documentResponse),
                    },
                },
            ],
            bottomGroup,
            data: strategy.toActRecordsData(documentResponse),
        }
    }

    async hideActRecord(user: UserTokenData, params: HideActRecordReq): Promise<HideActRecordRes> {
        const { identifier: userIdentifier } = user
        const { id, recordType, force } = params

        if (force) {
            await this.userDocumentSettingsService.setDocumentAsHidden(userIdentifier, this.actRecordTypeToDocumentType[recordType], id)

            return { processCode: this.myInfoDataMapper.recordTypeToHiddenDocumentProcessCode[recordType] }
        }

        return { processCode: this.myInfoDataMapper.recordTypeToHideDocumentProcessCode[recordType] }
    }

    async unhideActRecord(user: UserTokenData, params: UnhideActRecordsReq): Promise<UnhideActRecordsRes> {
        const { identifier: userIdentifier } = user
        const { recordType } = params

        await this.userDocumentSettingsService.unhideDocumentByType(userIdentifier, this.actRecordTypeToDocumentType[recordType])

        return {}
    }

    async getUserBirthRecord(user: UserTokenData, eTag?: string): Promise<GetUserBirthRecordRes> {
        const { identifier: userIdentifier, birthDay } = user

        if (!this.verifyUserAge(birthDay)) {
            return { processCode: ProcessCode.ActRecordInvalidAge }
        }

        const isItnValid = await this.verifyItn(userIdentifier)
        if (!isItnValid) {
            return { processCode: ProcessCode.InvalidItn }
        }

        const strategy = this.myInfoActRecordStrategyService.getStrategy(DedicatedActRecord.UserBirthRecord)

        const actRecordsResponse = await strategy.getActRecords(user, eTag)
        if (!actRecordsResponse) {
            return {}
        }

        if (actRecordsResponse.status >= 500) {
            return { processCode: ProcessCode.DracsRegistryError }
        }

        if (!actRecordsResponse.data.length) {
            return { processCode: ProcessCode.UserBirthRecordNotFound }
        }

        return { userBirthRecord: actRecordsResponse }
    }

    private verifyUserAge(birthDay: string): boolean {
        const age = utils.getAge(birthDay)

        return age >= 14
    }

    private async verifyItn(userIdentifier: string): Promise<boolean> {
        const { hasDocuments } = await this.userDocumentService.hasDocumentsByFilters(userIdentifier, [
            [{ documentType: DocumentType.TaxpayerCard }],
        ])

        return hasDocuments
    }

    private async isForceUpdateAvailable(userIdentifier: string, actRecordRequestType: ActRecordRequestType): Promise<boolean> {
        const forceUpdateCacheKey = `my-info-force-update-${userIdentifier}-${actRecordRequestType}`
        const forceUpdateKey = await this.store.get(forceUpdateCacheKey)

        if (forceUpdateKey) {
            return false
        }

        await this.store.set(forceUpdateCacheKey, '1', { ttl: DurationMs.Day })

        return true
    }
}
