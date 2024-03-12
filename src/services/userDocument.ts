import { chunk, flatten, keyBy } from 'lodash'
import moment from 'moment'
import { AnyBulkWriteOperation, MatchKeysAndValues, UpdateManyModel, WithId } from 'mongodb'
import { FilterQuery, PipelineStage, UpdateQuery } from 'mongoose'

import { InternalServerError } from '@diia-inhouse/errors'
import { DocStatus, DocumentType, Logger, OwnerType, UserDocumentSubtype } from '@diia-inhouse/types'

import AnalyticsService from '@services/analytics'
import DiiaIdService from '@services/diiaId'
import NotificationService from '@services/notification'

import userDocumentModel from '@models/userDocument'

import { UserDocument } from '@interfaces/models/userDocument'
import { AnalyticsActionType, AnalyticsCategory, AnalyticsData, AnalyticsHeaders } from '@interfaces/services/analytics'
import { UserProfileDocument, VehicleLicenseUserDocumentData } from '@interfaces/services/documents'
import { MessageTemplateCode, TemplateStub } from '@interfaces/services/notification'
import {
    AvailableDocumentsMap,
    DocumentFilter,
    DocumentToVerify,
    GetUserDocumentsParams,
    HasDocumentsResult,
    ProcessingStrategy,
    UserDocumentTypesCounts,
    UserDocumentsDistinctItem,
    VerifiedDocument,
} from '@interfaces/services/userDocument'

export default class UserDocumentService {
    private readonly inactiveDocStatuses: Partial<Record<DocumentType, DocStatus[]>> = {}

    private readonly defaultInactiveDocStatuses = [DocStatus.Confirming, DocStatus.NotConfirmed, DocStatus.NotFound]

    private readonly deviceRelatedDocuments: DocumentType[] = [
        DocumentType.LocalVaccinationCertificate,
        DocumentType.ChildLocalVaccinationCertificate,
        DocumentType.InternationalVaccinationCertificate,
        DocumentType.MilitaryBond,
    ]

    private comparingMapEntries: [DocumentType, DocumentType[]][] = []

    readonly processingStrategies: Partial<Record<DocumentType, ProcessingStrategy>> = {
        [DocumentType.DriverLicense]: this.processDriverLicense.bind(this),
    }

    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly diiaIdService: DiiaIdService,
        private readonly notificationService: NotificationService,

        private readonly logger: Logger,

        private readonly comparingMap: Partial<Record<DocumentType, DocumentType[]>> = {},
    ) {
        this.comparingMap[DocumentType.DriverLicense] = [DocumentType.InternalPassport, DocumentType.ForeignPassport]
        this.comparingMapEntries = <[DocumentType, DocumentType[]][]>Object.entries(this.comparingMap)
    }

    async getUserDocuments({
        userIdentifier,
        documentType,
        mobileUid,
        activeOnly = true,
    }: GetUserDocumentsParams): Promise<UserDocument[]> {
        const query: FilterQuery<UserDocument> = activeOnly ? { userIdentifier, ...this.getActiveQuery(documentType) } : { userIdentifier }

        if (documentType) {
            query.documentType = documentType
        }

        if (mobileUid) {
            query.$or = [{ mobileUid: { $exists: false } }, { mobileUid }]
        }

        return await userDocumentModel.find(query)
    }

    async getDocumentsByFilters(filters: DocumentFilter[]): Promise<UserDocument[]> {
        const documentQueries = this.getDocumentQueries(filters)

        const query: FilterQuery<UserDocument> = {
            $or: documentQueries,
        }

        return await userDocumentModel.find(query)
    }

    async getUserDocumentsByFilters(userIdentifier: string, filters: DocumentFilter[]): Promise<UserDocument[]> {
        const documentQueries = this.getDocumentQueries(filters)

        const query: FilterQuery<UserDocument> = {
            userIdentifier,
            $or: documentQueries,
        }

        return await userDocumentModel.find(query).lean()
    }

    async updateDocuments(
        userIdentifier: string,
        documentType: DocumentType,
        documents: UserProfileDocument[],
        mobileUid?: string,
        headers?: AnalyticsHeaders,
        removeMissingDocuments = true,
    ): Promise<void> {
        const isDeviceRelatedDocument = this.deviceRelatedDocuments.includes(documentType)
        const storedDocuments = await this.getStoredDocuments(userIdentifier, documentType, documents, isDeviceRelatedDocument, mobileUid)
        const storedDocumentsByIdentifier = keyBy(storedDocuments, 'documentIdentifier')
        const documentsByIdentifier = keyBy(documents, 'documentIdentifier')
        const documentsToStore = documents.filter(({ documentIdentifier }) => !storedDocumentsByIdentifier[documentIdentifier])
        const documentsToUpdate = documents.filter(({ documentIdentifier }) => !!storedDocumentsByIdentifier[documentIdentifier])
        const missingDocuments = storedDocuments.filter(({ documentIdentifier }) => !documentsByIdentifier[documentIdentifier])
        const operations: AnyBulkWriteOperation<UserDocument>[] = [
            ...this.getCreateStoredDocumentsOperations(
                documentsToStore,
                documentType,
                userIdentifier,
                isDeviceRelatedDocument,
                mobileUid,
                headers,
            ),
            ...this.getUpdateStoredDocumentsOperations(documentsToUpdate, documentType),
            ...(removeMissingDocuments
                ? this.getDeleteStoredDocumentsOperations(missingDocuments, documentType, userIdentifier, headers)
                : this.getUpdateStoredDocumentsDocStatusOperations(missingDocuments)),
        ]

        if (!operations.length) {
            this.logger.debug('There are no any user documents updates')

            return
        }

        const { insertedCount, deletedCount, modifiedCount } = await userDocumentModel.bulkWrite(operations)

        if (operations.some((op) => 'deleteOne' in op) && mobileUid) {
            await this.diiaIdService.softDeleteDiiaIdByIdentityDocument(userIdentifier, mobileUid, documentType)
        }

        this.logger.debug('Add/remove user document result:', { insertedCount, deletedCount, modifiedCount })
    }

    async addDocument(
        userIdentifier: string,
        documentType: DocumentType,
        document: UserProfileDocument,
        mobileUid: string,
        headers?: AnalyticsHeaders,
    ): Promise<void> {
        const {
            documentIdentifier,
            documentSubType,
            normalizedDocumentIdentifier,
            ownerType,
            docId,
            docStatus,
            documentData,
            compoundDocument,
            registrationDate,
            expirationDate,
            issueDate,
            fullNameHash,
        } = document

        const isDeviceRelatedDocument = this.deviceRelatedDocuments.includes(documentType)
        const query: FilterQuery<UserDocument> = { userIdentifier, documentType, documentIdentifier }

        if (isDeviceRelatedDocument) {
            query.mobileUid = mobileUid
        }

        const modifier: UpdateQuery<UserDocument> = {
            docId,
            docStatus,
            documentSubType,
            documentData,
            expirationDate,
            registrationDate,
            issueDate,
            fullNameHash,
            normalizedDocumentIdentifier,
            ownerType,
            compoundDocument,
        }

        await userDocumentModel.updateOne(query, modifier, { upsert: true })

        const analyticsData: AnalyticsData = { documentType, documentId: documentIdentifier, ownerType }

        this.analyticsService.log(AnalyticsCategory.Users, userIdentifier, analyticsData, AnalyticsActionType.AddDocument, headers)
    }

    async verifyUserDocuments(userIdentifier: string, documentsToVerify: DocumentToVerify[]): Promise<VerifiedDocument[]> {
        const documentTypes: Set<DocumentType> = new Set()

        documentsToVerify.forEach((documentToVerify: DocumentToVerify) => {
            documentTypes.add(documentToVerify.documentType)
        })

        const userDocuments: UserDocument[] = await userDocumentModel.find({
            userIdentifier,
            ...this.getActiveQuery(Array.from(documentTypes)),
        })
        const userDocumentsByDocumentIdentifier: Map<string, UserDocument> = new Map()

        userDocuments.forEach((userDocument: UserDocument) => {
            userDocumentsByDocumentIdentifier.set(userDocument.documentIdentifier, userDocument)
        })

        return documentsToVerify.map((documentToVerify: DocumentToVerify) => {
            const { documentType, documentIdentifer } = documentToVerify
            let isOwner: boolean

            const userDocument = userDocumentsByDocumentIdentifier.get(documentIdentifer)
            if (userDocument) {
                isOwner = userDocument.ownerType === OwnerType.owner
            } else {
                isOwner = false
            }

            return {
                documentType,
                documentIdentifer,
                isOwner,
            }
        })
    }

    async getDocumentIdentifiers(userIdentifier: string, documentType: DocumentType): Promise<string[]> {
        const userDocuments: UserDocument[] = await userDocumentModel.find({
            userIdentifier,
            ...this.getActiveQuery(documentType),
        })
        if (!userDocuments.length) {
            return []
        }

        return userDocuments.map((userDocument: UserDocument) => userDocument.documentIdentifier)
    }

    async validateUserDocument(userIdentifier: string, documentType: DocumentType, documentIdentifier: string): Promise<boolean> {
        const userDocument = await userDocumentModel.findOne({
            userIdentifier,
            documentIdentifier,
            ...this.getActiveQuery(documentType),
        })

        return !!userDocument
    }

    async identifyPenaltyOwner(vehicleLicenseIdentifier: string | undefined, penaltyFixingDate: Date): Promise<string | undefined> {
        const query: FilterQuery<UserDocument> = {
            ...this.getActiveQuery(DocumentType.VehicleLicense),
            $and: [
                {
                    $or: [
                        {
                            registrationDate: { $exists: false },
                        },
                        {
                            registrationDate: {
                                $exists: true,
                                $lt: penaltyFixingDate,
                            },
                        },
                    ],
                },
                {
                    $or: [
                        {
                            ownerType: { $ne: OwnerType.properUser },
                        },
                        {
                            expirationDate: { $exists: false },
                        },
                        {
                            ownerType: OwnerType.properUser,
                            expirationDate: {
                                $exists: true,
                                $gt: penaltyFixingDate,
                            },
                        },
                    ],
                },
                {
                    $or: [{ documentIdentifier: vehicleLicenseIdentifier }, { normalizedDocumentIdentifier: vehicleLicenseIdentifier }],
                },
            ],
        }

        let ownerUser: string | undefined
        let properUser: string | undefined
        const userDocuments: UserDocument[] = await userDocumentModel.find(query)

        userDocuments.forEach(({ ownerType, userIdentifier }: UserDocument) => {
            switch (ownerType) {
                case OwnerType.owner: {
                    ownerUser = userIdentifier
                    break
                }
                case OwnerType.properUser: {
                    properUser = userIdentifier
                    break
                }
                default: {
                    const unknownOwnerType: never = ownerType

                    throw new TypeError(`Unkown owner type: ${unknownOwnerType}`)
                }
            }
        })

        return properUser || ownerUser
    }

    async getUserDocumentTypes(userIdentifier: string): Promise<DocumentType[]> {
        const documentTypeField: keyof UserDocument = 'documentType'
        const userDocuments: { documentTypes: DocumentType[] }[] = await userDocumentModel.aggregate<{ documentTypes: DocumentType[] }>([
            {
                $match: { userIdentifier, ...this.getActiveQuery() },
            },
            {
                $group: {
                    _id: null,
                    documentTypes: {
                        $addToSet: `$${documentTypeField}`,
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    documentTypes: 1,
                },
            },
        ])

        return userDocuments[0]?.documentTypes || []
    }

    async getUserDocumentTypesCounts(userIdentifier: string): Promise<UserDocumentTypesCounts> {
        const userDocuments: { _id: DocumentType; count: number }[] = await userDocumentModel.aggregate([
            {
                $match: { userIdentifier, ...this.getActiveQuery() },
            },
            {
                $group: {
                    _id: '$documentType',
                    count: { $sum: 1 },
                },
            },
        ])

        const documents: UserDocumentTypesCounts = {}

        userDocuments.forEach(({ _id: documentType, count }: { _id: DocumentType; count: number }) => {
            documents[documentType] = count
        })

        return documents
    }

    /** @deprecated replaced with hasDocumentsByFilters */
    async hasDocuments(userIdentifier: string, documentTypes: DocumentType[][]): Promise<boolean> {
        const documentTypeField: keyof UserDocument = 'documentType'
        const availableDocuments: DocumentType[] = await userDocumentModel.distinct(documentTypeField, {
            userIdentifier,
            ...this.getActiveQuery(flatten(documentTypes)),
        })
        const availableDocumentsSet = new Set(availableDocuments)
        let result = true

        documentTypes.forEach((oneOfDocuments) => {
            const isOneOfDocumentsPresent = oneOfDocuments.some((docType) => availableDocumentsSet.has(docType))
            if (!isOneOfDocumentsPresent) {
                result = false
            }
        })

        return result
    }

    async hasDocumentsByFilters(userIdentifier: string, filters: DocumentFilter[][]): Promise<HasDocumentsResult> {
        const documentTypesSet: Set<DocumentType> = new Set()

        filters.forEach((oneOfFilters) => oneOfFilters.forEach((filter) => documentTypesSet.add(filter.documentType)))
        const documentTypes = [...documentTypesSet]
        const pipeline: PipelineStage[] = [
            { $match: { userIdentifier, ...this.getActiveQuery(documentTypes) } },
            { $group: { _id: { documentType: '$documentType', ownerType: '$ownerType', docStatus: '$docStatus' } } },
            { $project: { documentType: '$_id.documentType', ownerType: '$_id.ownerType', docStatus: '$_id.docStatus', _id: 0 } },
        ]
        const userDocuments: UserDocumentsDistinctItem[] = await userDocumentModel.aggregate(pipeline)
        const docsMetadata: AvailableDocumentsMap = new Map()

        userDocuments.forEach(({ documentType, ownerType, docStatus }) => {
            const [ownerTypes, docStatuses] = docsMetadata.get(documentType) || [new Set(), new Set()]

            ownerTypes.add(ownerType)
            if (docStatus) {
                docStatuses.add(docStatus)
            }

            docsMetadata.set(documentType, [ownerTypes, docStatuses])
        })
        let hasDocuments = true
        const missingDocuments: DocumentType[] = []

        filters.forEach((oneOfFilter) => {
            const isOneOfDocumentsPresent = oneOfFilter.some(({ documentType, ownerType, docStatus }) => {
                const metadata = docsMetadata.get(documentType)
                if (metadata) {
                    const [ownerTypes, docStatuses] = metadata
                    const isOwnerTypeCorrect = !ownerType || ownerTypes.has(ownerType)
                    const isDocStatusCorrect = !docStatus?.length || docStatus.some((item) => docStatuses.has(item))
                    if (isOwnerTypeCorrect && isDocStatusCorrect) {
                        return true
                    }
                }

                missingDocuments.push(documentType)

                return false
            })

            if (!isOneOfDocumentsPresent) {
                hasDocuments = false
            }
        })

        return { hasDocuments, missingDocuments }
    }

    async hasOneOfDocuments(userIdentifier: string, documentTypes: DocumentType[]): Promise<boolean> {
        const availableDocumentsAmount: number = await userDocumentModel.countDocuments({
            userIdentifier,
            ...this.getActiveQuery(documentTypes),
        })

        return !!availableDocumentsAmount
    }

    async removeDeviceDocuments(userIdentifier: string, mobileUid: string): Promise<void> {
        const query: FilterQuery<UserDocument> = { userIdentifier, mobileUid }
        const { deletedCount } = await userDocumentModel.deleteMany(query)

        this.logger.debug('Removed device documents result:', { deletedCount })
    }

    async removeUserDocuments(userIdentifier: string): Promise<void> {
        const query: FilterQuery<UserDocument> = { userIdentifier }
        const { deletedCount } = await userDocumentModel.deleteMany(query)

        this.logger.debug('Removed user documents result:', { deletedCount })
    }

    async removeUserDocumentById(
        userIdentifier: string,
        documentType: DocumentType,
        documentId: string,
        mobileUid?: string,
        headers?: AnalyticsHeaders,
    ): Promise<void> {
        const isDeviceRelatedDocument = this.deviceRelatedDocuments.includes(documentType)
        const query: FilterQuery<UserDocument> = { userIdentifier, documentType, docId: documentId }

        if (isDeviceRelatedDocument) {
            query.mobileUid = mobileUid
        }

        const storedDocument = await userDocumentModel.findOneAndDelete(query).lean()
        if (!storedDocument) {
            this.logger.info('No user document to remove', { documentType, docId: documentId })

            return
        }

        const { documentIdentifier, ownerType } = storedDocument
        const analyticsData: AnalyticsData = { documentType, documentId: documentIdentifier, ownerType }

        this.analyticsService.log(AnalyticsCategory.Users, userIdentifier, analyticsData, AnalyticsActionType.RemoveDocument, headers)

        if (mobileUid) {
            await this.diiaIdService.softDeleteDiiaIdByIdentityDocument(userIdentifier, mobileUid, documentType)
        }
    }

    async checkInternationalVaccinationCertificatesExpirations(): Promise<void> {
        const query: FilterQuery<UserDocument> = {
            ...this.getActiveQuery(DocumentType.InternationalVaccinationCertificate),
            expirationDate: {
                $gt: moment().add(23, 'hours').toDate(),
                $lte: moment().add(24, 'hours').toDate(),
            },
            [`notifications.${MessageTemplateCode.CovidCertificateWillExpire}`]: { $exists: false },
            [`notifications.${MessageTemplateCode.ChildCovidCertificateWillExpire}`]: { $exists: false },
        }

        const readyToExpireDocuments = await userDocumentModel.find(query)

        this.logger.debug(`Got [${readyToExpireDocuments.length}] certificates close to expiration date`)

        const chunks = chunk(readyToExpireDocuments, 1000)

        for (const documentsChunk of chunks) {
            const operations: AnyBulkWriteOperation<UserDocument>[] = []

            await Promise.all(
                documentsChunk.map(async ({ _id: id, userIdentifier, mobileUid, compoundDocument }) => {
                    const templateCode: MessageTemplateCode = compoundDocument
                        ? MessageTemplateCode.ChildCovidCertificateWillExpire
                        : MessageTemplateCode.CovidCertificateWillExpire

                    await this.notificationService.createNotificationWithPushesByMobileUidSafe({
                        templateCode,
                        userIdentifier,
                        mobileUid: mobileUid!,
                    })

                    operations.push({
                        updateOne: {
                            filter: { _id: id },
                            update: { $set: { [`notifications.${templateCode}`]: new Date() } },
                        },
                    })
                }),
            )

            await userDocumentModel.bulkWrite(operations)
        }
    }

    async checkDriverLicensesExpirations(): Promise<void> {
        const expirationLastDayQuery: FilterQuery<UserDocument> = {
            ...this.getActiveQuery(DocumentType.DriverLicense),
            documentSubType: UserDocumentSubtype.IssuedFirst,
            expirationDate: {
                $gte: moment().startOf('day').toDate(),
                $lte: moment().endOf('day').toDate(),
            },
            [`notifications.${MessageTemplateCode.DriverLicenseExpirationLastDay}`]: { $exists: false },
        }
        const expiresInFewDaysQuery: FilterQuery<UserDocument> = {
            ...this.getActiveQuery(DocumentType.DriverLicense),
            documentSubType: UserDocumentSubtype.IssuedFirst,
            expirationDate: {
                $gte: moment().add(10, 'days').startOf('day').toDate(),
                $lte: moment().add(10, 'days').endOf('day').toDate(),
            },
            [`notifications.${MessageTemplateCode.DriverLicenseExpiresInFewDays}`]: { $exists: false },
        }

        await Promise.all([
            this.checkDriverLicensesExpirationsByQuery(expirationLastDayQuery, MessageTemplateCode.DriverLicenseExpirationLastDay),
            this.checkDriverLicensesExpirationsByQuery(expiresInFewDaysQuery, MessageTemplateCode.DriverLicenseExpiresInFewDays),
        ])
    }

    async checkVehicleLicensesExpirations(): Promise<void> {
        const expirationLastDayQuery: FilterQuery<UserDocument> = {
            ...this.getActiveQuery(DocumentType.VehicleLicense),
            ownerType: OwnerType.properUser,
            expirationDate: {
                $gte: moment().startOf('day').toDate(),
                $lte: moment().endOf('day').toDate(),
            },
            [`notifications.${MessageTemplateCode.VehicleLicenseExpirationLastDayToProperUser}`]: { $exists: false },
        }
        const expiresInFewDaysQuery: FilterQuery<UserDocument> = {
            ...this.getActiveQuery(DocumentType.VehicleLicense),
            ownerType: OwnerType.properUser,
            expirationDate: {
                $gte: moment().add(10, 'days').startOf('day').toDate(),
                $lte: moment().add(10, 'days').endOf('day').toDate(),
            },
            [`notifications.${MessageTemplateCode.VehicleLicenseExpiresInFewDaysToProperUser}`]: { $exists: false },
        }

        await Promise.all([
            this.checkVehicleLicensesExpirationsByQuery(
                expirationLastDayQuery,
                MessageTemplateCode.VehicleLicenseExpirationLastDayToProperUser,
                MessageTemplateCode.VehicleLicenseExpirationLastDayToOwner,
            ),
            this.checkVehicleLicensesExpirationsByQuery(
                expiresInFewDaysQuery,
                MessageTemplateCode.VehicleLicenseExpiresInFewDaysToProperUser,
                MessageTemplateCode.VehicleLicenseExpiresInFewDaysToOwner,
            ),
        ])
    }

    async processUserDocuments(userIdentifier: string, documentTypes: DocumentType[]): Promise<[DocumentType, DocumentType][]> {
        const filteredComparingEntries = this.comparingMapEntries.filter(([sourceDocType, docTypesToCompare]) => {
            return documentTypes.includes(sourceDocType) || docTypesToCompare.some((docType) => documentTypes.includes(docType))
        })
        const processableDocTypes = <DocumentType[]>[...new Set(filteredComparingEntries.flat(2))]
        if (!processableDocTypes.length) {
            return []
        }

        const userDocuments = await userDocumentModel
            .find({ userIdentifier, ...this.getActiveQuery(processableDocTypes) })
            .sort({ _id: -1 })
        const documentsMap = new Map<DocumentType, UserDocument[]>()

        userDocuments.forEach((doc) => {
            const { documentType } = doc
            const items = (documentsMap.get(documentType) || []).concat(doc)

            documentsMap.set(documentType, items)
        })
        const dbOperations: AnyBulkWriteOperation<UserDocument>[] = []
        const processedDocumentTypes: [DocumentType, DocumentType][] = []
        const tasks = filteredComparingEntries.map(async ([docType]: [DocumentType, DocumentType[]]) => {
            const documents = documentsMap.get(docType)
            const docTypeToCompare = this.comparingMap[docType]?.find((type) => documentsMap.get(type))
            if (!documents?.length || !docTypeToCompare) {
                return
            }

            processedDocumentTypes.push([docType, docTypeToCompare])
            try {
                const processingStrategy = this.processingStrategies[docType]
                if (!processingStrategy) {
                    throw new InternalServerError('Missing processing strategy')
                }

                const docToCompare = documentsMap.get(docTypeToCompare)?.[0]
                if (!docToCompare) {
                    throw new InternalServerError('Missing docToCompare')
                }

                const operations = await processingStrategy(userIdentifier, documents, docToCompare)

                dbOperations.push(...operations)
            } catch (err) {
                this.logger.error('Failed to process documents', { docType, err })
            }
        })

        await Promise.all(tasks)
        if (dbOperations.length) {
            const result = await userDocumentModel.bulkWrite(dbOperations)

            this.logger.info('Process user documents bulk write result', result)
        }

        return processedDocumentTypes
    }

    private async checkDriverLicensesExpirationsByQuery(
        query: FilterQuery<UserDocument>,
        templateCode: MessageTemplateCode,
    ): Promise<void> {
        const userDocuments = await userDocumentModel.find(query)

        this.logger.info(`Got [${userDocuments.length}] driver licenses to send notification [${templateCode}]`)

        const chunks = chunk(userDocuments, 1000)

        for (const documentsChunk of chunks) {
            const operations: AnyBulkWriteOperation<UserDocument>[] = []

            // eslint-disable-next-line no-await-in-loop
            await Promise.all(
                documentsChunk.map(async ({ _id: id, userIdentifier }) => {
                    await this.notificationService.createNotificationWithPushesSafe({ templateCode, userIdentifier })

                    operations.push({
                        updateOne: {
                            filter: { _id: id },
                            update: { $set: { [`notifications.${templateCode}`]: new Date() } },
                        },
                    })
                }),
            )

            await userDocumentModel.bulkWrite(operations)
        }
    }

    private async checkVehicleLicensesExpirationsByQuery(
        query: FilterQuery<UserDocument>,
        properUserTemplateCode: MessageTemplateCode,
        ownerTemplateCode: MessageTemplateCode,
    ): Promise<void> {
        const userDocuments = await userDocumentModel.find(query)

        this.logger.info(
            `Got [${userDocuments.length}] vehicle licenses to send notification [${properUserTemplateCode}, ${ownerTemplateCode}]`,
        )

        const chunks = chunk(userDocuments, 100)

        for (const documentsChunk of chunks) {
            const operations: AnyBulkWriteOperation<UserDocument>[] = []

            await Promise.all(
                documentsChunk.map(async ({ _id: id, userIdentifier, documentIdentifier, documentData }) => {
                    const vehicleLicenseData = <VehicleLicenseUserDocumentData>documentData

                    const { brand, model, licensePlate } = vehicleLicenseData || {}
                    const brandModel = `${brand || ''} ${model || ''}`.trim()

                    await this.notificationService.createNotificationWithPushesSafe({
                        templateCode: properUserTemplateCode,
                        userIdentifier,
                        templateParams: {
                            [TemplateStub.BrandModel]: brandModel,
                            [TemplateStub.LicensePlate]: licensePlate,
                        },
                    })

                    operations.push({
                        updateOne: {
                            filter: { _id: id },
                            update: { $set: { [`notifications.${properUserTemplateCode}`]: new Date() } },
                        },
                    })

                    const ownerUserDocument = await userDocumentModel.findOne({ documentIdentifier })

                    if (ownerUserDocument) {
                        const { _id: oid, userIdentifier: ownerUserIdentifier } = ownerUserDocument

                        await this.notificationService.createNotificationWithPushesSafe({
                            templateCode: ownerTemplateCode,
                            userIdentifier: ownerUserIdentifier,
                            templateParams: {
                                [TemplateStub.BrandModel]: brandModel,
                                [TemplateStub.LicensePlate]: licensePlate,
                            },
                        })

                        operations.push({
                            updateOne: {
                                filter: { _id: oid },
                                update: { $set: { [`notifications.${ownerTemplateCode}`]: new Date() } },
                            },
                        })
                    }
                }),
            )

            if (operations.length) {
                await userDocumentModel.bulkWrite(operations)
            }
        }
    }

    private getDocumentQueries(filters: DocumentFilter[]): FilterQuery<UserDocument>[] {
        return filters.map(({ documentType, documentIdentifier, docStatus, ownerType, docId }) => {
            const query: FilterQuery<UserDocument> = docStatus?.length
                ? { documentType, $or: [{ docStatus: { $exists: false } }, { docStatus }] }
                : this.getActiveQuery(documentType)

            if (documentIdentifier) {
                query.documentIdentifier = documentIdentifier
            }

            if (ownerType) {
                query.ownerType = ownerType
            }

            if (docId) {
                query.docId = docId
            }

            return query
        })
    }

    private getInternationalVaccinationCertificateQuery(
        userIdentifier: string,
        documents: UserProfileDocument[],
    ): FilterQuery<UserDocument> {
        const query: FilterQuery<UserDocument> = {
            userIdentifier,
            documentType: DocumentType.InternationalVaccinationCertificate,
        }

        if (!documents.length) {
            return query
        }

        const documentSubTypes: Set<string> = new Set()
        const birthCertificateIds: Set<string> = new Set()

        documents.forEach(({ documentSubType, compoundDocument }) => {
            documentSubTypes.add(documentSubType!)

            if (compoundDocument) {
                birthCertificateIds.add(compoundDocument.documentIdentifier)
            }
        })

        query.documentSubType = { $in: Array.from(documentSubTypes) }

        if (birthCertificateIds.size) {
            query['compoundDocument.documentIdentifier'] = { $in: Array.from(birthCertificateIds) }
        } else {
            query.compoundDocument = { $exists: false }
        }

        return query
    }

    private getActiveQuery(documentType?: DocumentType | DocumentType[]): FilterQuery<UserDocument> {
        if (!documentType) {
            const documentTypesWithCustomInactiveDocStatuses = <DocumentType[]>Object.keys(this.inactiveDocStatuses)

            return {
                $or: [
                    {
                        documentType: { $nin: documentTypesWithCustomInactiveDocStatuses },
                        docStatus: { $nin: this.defaultInactiveDocStatuses },
                    },
                    ...Object.entries(this.inactiveDocStatuses).map(([type, docStatuses]) => ({
                        documentType: type,
                        docStatus: { $nin: docStatuses },
                    })),
                ],
            }
        }

        if (Array.isArray(documentType)) {
            return {
                $or: documentType.map((type) => ({
                    documentType: type,
                    docStatus: { $nin: this.getInactiveDocStatuses(type) },
                })),
            }
        }

        return { documentType, docStatus: { $nin: this.getInactiveDocStatuses(documentType) } }
    }

    private getInactiveDocStatuses(documentType: DocumentType): DocStatus[] {
        return this.inactiveDocStatuses[documentType] || this.defaultInactiveDocStatuses
    }

    private getCreateStoredDocumentsOperations(
        documents: UserProfileDocument[],
        documentType: DocumentType,
        userIdentifier: string,
        isDeviceRelatedDocument: boolean,
        mobileUid?: string,
        headers?: AnalyticsHeaders,
    ): AnyBulkWriteOperation<UserDocument>[] {
        return documents.map((document) => {
            const {
                documentIdentifier,
                documentSubType,
                normalizedDocumentIdentifier,
                ownerType,
                docId,
                docStatus,
                documentData,
                compoundDocument,
                registrationDate,
                expirationDate,
                issueDate,
                fullNameHash,
            } = document
            const analyticsData: AnalyticsData = { documentType, documentId: documentIdentifier, ownerType }

            this.analyticsService.log(AnalyticsCategory.Users, userIdentifier, analyticsData, AnalyticsActionType.AddDocument, headers)

            return {
                insertOne: {
                    document: {
                        compoundDocument,
                        docId,
                        docStatus,
                        documentIdentifier,
                        documentSubType,
                        documentType,
                        documentData,
                        expirationDate,
                        fullNameHash,
                        mobileUid: isDeviceRelatedDocument ? mobileUid : undefined,
                        normalizedDocumentIdentifier,
                        ownerType,
                        registrationDate,
                        issueDate,
                        userIdentifier,
                        notifications: {},
                    },
                },
            }
        })
    }

    private getDeleteStoredDocumentsOperations(
        documents: WithId<UserDocument>[],
        documentType: DocumentType,
        userIdentifier: string,
        headers?: AnalyticsHeaders,
    ): AnyBulkWriteOperation<UserDocument>[] {
        return documents.map(({ _id, documentIdentifier, ownerType }) => {
            const analyticsData: AnalyticsData = { documentType, documentId: documentIdentifier, ownerType }

            this.analyticsService.log(AnalyticsCategory.Users, userIdentifier, analyticsData, AnalyticsActionType.RemoveDocument, headers)

            return { deleteOne: { filter: { _id } } }
        })
    }

    private getUpdateStoredDocumentsDocStatusOperations(documents: WithId<UserDocument>[]): AnyBulkWriteOperation<UserDocument>[] {
        return documents.map(({ _id }) => ({
            updateOne: {
                filter: { _id },
                update: { $set: { docStatus: DocStatus.NotFound } },
            },
        }))
    }

    private getUpdateStoredDocumentsOperations(
        documents: UserProfileDocument[],
        documentType: DocumentType,
    ): AnyBulkWriteOperation<UserDocument>[] {
        return documents.map((document) => {
            const {
                documentData,
                documentIdentifier,
                documentSubType,
                normalizedDocumentIdentifier,
                docId,
                docStatus,
                registrationDate,
                expirationDate,
                fullNameHash,
                issueDate,
            } = document

            const $set: MatchKeysAndValues<UserDocument> = {
                docId,
                docStatus,
                fullNameHash,
                expirationDate,
                registrationDate,
                documentSubType,
                normalizedDocumentIdentifier,
                issueDate,
                documentData,
            }

            return {
                updateMany: <UpdateManyModel<UserDocument>>{
                    filter: { documentIdentifier, documentType },
                    update: { $set },
                },
            }
        })
    }

    private async getStoredDocuments(
        userIdentifier: string,
        documentType: DocumentType,
        documents: UserProfileDocument[],
        isDeviceRelatedDocument: boolean,
        mobileUid?: string,
    ): Promise<WithId<UserDocument>[]> {
        const isInternationalVaccinationCertificate = documentType === DocumentType.InternationalVaccinationCertificate
        const query: FilterQuery<UserDocument> = isInternationalVaccinationCertificate
            ? this.getInternationalVaccinationCertificateQuery(userIdentifier, documents)
            : { userIdentifier, documentType }

        if (isDeviceRelatedDocument) {
            query.mobileUid = mobileUid
        }

        const storedDocuments = await userDocumentModel.find(query)

        return storedDocuments
    }

    private async processDriverLicense(
        userIdentifier: string,
        sourceDocs: UserDocument[],
        docToCompare: UserDocument,
    ): Promise<AnyBulkWriteOperation<UserDocument>[]> {
        const docToCompareFullNameHash = docToCompare.fullNameHash
        if (!docToCompareFullNameHash) {
            return []
        }

        let sendNotification = false
        const operations: AnyBulkWriteOperation<UserDocument>[] = []

        sourceDocs.forEach(({ documentType, documentIdentifier, fullNameHash, comparedTo }) => {
            if (!fullNameHash) {
                return
            }

            const isHashMismatched = fullNameHash !== docToCompareFullNameHash
            const isComparedDataDifferent = !comparedTo || comparedTo.fullNameHash !== docToCompareFullNameHash
            if (isHashMismatched && isComparedDataDifferent) {
                sendNotification = true
            }

            if (isComparedDataDifferent || comparedTo.documentType !== docToCompare.documentType) {
                operations.push({
                    updateOne: {
                        filter: { userIdentifier, documentType, documentIdentifier },
                        update: {
                            $set: { comparedTo: { documentType: docToCompare.documentType, fullNameHash: docToCompareFullNameHash } },
                        },
                    },
                })
            }
        })
        if (sendNotification) {
            await this.notificationService.createNotificationWithPushesSafe({
                templateCode: MessageTemplateCode.DriverLicenseDataChanged,
                userIdentifier,
            })
        }

        return operations
    }
}
