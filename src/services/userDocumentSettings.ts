import { isEmpty } from 'lodash'

import { IdentifierService } from '@diia-inhouse/crypto'
import { UpdateQuery } from '@diia-inhouse/db'
import { BadRequestError } from '@diia-inhouse/errors'
import { ProfileFeature, SessionType } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import {
    DocumentOrderSettingsItem,
    DocumentVisibilitySettingsItem,
    GetUserDocumentSettingsReq,
    GetUserDocumentSettingsRes,
    UpdateDocumentVisibilityReq,
} from '@src/generated'

import DocumentsService from '@services/documents'

import userDocumentSettingsModel from '@models/userDocumentSettings'

import { DocumentTypeSetting, UserDocumentSettingsModel } from '@interfaces/models/userDocumentSettings'
import {
    DocumentTypeWithOrder,
    DocumentVisibilitySettings,
    DocumentsDefaultOrder,
    SaveDocumentsOrderByDocumentTypeRequest,
    UserDocumentsOrderParams,
    UserDocumentsOrderResponse,
} from '@interfaces/services/userDocumentSettings'

export default class UserDocumentSettingsService {
    private readonly defaultNotDefinedOrder: number = -1

    private readonly officeOnlyDocumentTypes = ['official-certificate']

    private readonly unorderedDocumentsStartOrder = 1000

    constructor(
        private readonly identifier: IdentifierService,
        private readonly documentsService: DocumentsService,
    ) {}

    async saveDocumentsOrder(params: UserDocumentsOrderParams, documentsOrder: DocumentTypeWithOrder[]): Promise<void> {
        const { userIdentifier } = params

        await this.validateDocumentTypeOrders(params, documentsOrder)
        const documentTypeOrders = await this.generateDocumentTypeOrders(documentsOrder)
        const documentSettings = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        if (documentSettings) {
            await userDocumentSettingsModel.updateOne({ userIdentifier }, documentTypeOrders)

            return
        }

        await userDocumentSettingsModel.create({ userIdentifier, ...documentTypeOrders })
    }

    async saveDocumentsOrderByDocumentType(
        params: UserDocumentsOrderParams,
        documentType: string,
        documentsOrder: SaveDocumentsOrderByDocumentTypeRequest[],
    ): Promise<void> {
        const { userIdentifier } = params
        if (documentsOrder.length === 0) {
            throw new BadRequestError('Please, define at least one document number')
        }

        const documentSettings = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        if (!documentSettings) {
            const documentTypeOrders = await this.generateDocumentTypeOrders()

            await userDocumentSettingsModel.create({ userIdentifier, ...documentTypeOrders })
        }

        this.validateDocumentsOrderByDocumentType(documentsOrder)
        const documentIdentifiersForUpdate: { [key: string]: number } = {}

        for (const { docNumber, order } of documentsOrder) {
            const identifier: string = this.identifier.createIdentifier(docNumber)

            documentIdentifiersForUpdate[identifier] = order
        }

        await userDocumentSettingsModel.updateOne(
            { userIdentifier },
            {
                $set: {
                    [`${documentType}.documentIdentifiers`]: documentIdentifiersForUpdate,
                },
            },
        )
    }

    /** @deprecated use getDocumentSettings instead */
    async getDocumentsOrder(params: UserDocumentsOrderParams): Promise<UserDocumentsOrderResponse[]> {
        const { userIdentifier, features = {} } = params

        const settingsModel = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        const defaultSortedDocumentTypes = await this.getDefaultSortedDocumentTypes(userIdentifier, Object.keys(features))

        return this.getDocumentOrderSettings(defaultSortedDocumentTypes, settingsModel)
    }

    async getDocumentsTypeOrder(params: UserDocumentsOrderParams): Promise<string[]> {
        const { userIdentifier, features = {} } = params

        const defaultSortedDocumentTypes = await this.getDefaultSortedDocumentTypes(userIdentifier, Object.keys(features))

        const documentSettings = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        if (!documentSettings) {
            return defaultSortedDocumentTypes.map((docType: string) => utils.documentTypeToCamelCase(docType))
        }

        const ordered: DocumentTypeWithOrder[] = []
        const unordered: Set<string> = new Set()
        const sortedDocumentTypes = await this.getSortedByDefaultDocumentTypesBySession(SessionType.User)

        for (const documentType of sortedDocumentTypes) {
            const { documentTypeOrder = this.defaultNotDefinedOrder } = <DocumentTypeSetting>(documentSettings[documentType] || {})
            if (documentTypeOrder === this.defaultNotDefinedOrder) {
                unordered.add(documentType)
            } else {
                ordered.push({ order: documentTypeOrder, documentType })
            }
        }

        for (const [indx, documentType] of defaultSortedDocumentTypes.entries()) {
            if (unordered.has(documentType)) {
                ordered.push({ order: this.unorderedDocumentsStartOrder + indx, documentType })
            }
        }

        return ordered
            .sort((a: DocumentTypeWithOrder, b: DocumentTypeWithOrder) => a.order - b.order)
            .map(({ documentType }: DocumentTypeWithOrder) => utils.documentTypeToCamelCase(documentType))
    }

    async getDocumentSettings(params: GetUserDocumentSettingsReq): Promise<GetUserDocumentSettingsRes> {
        const { userIdentifier, features, documentsDefaultOrder } = params

        const settingsModel = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        const defaultSortedDocumentTypes = await this.getDefaultSortedDocumentTypes(userIdentifier, features, true, documentsDefaultOrder)

        const documentOrderSettings = this.getDocumentOrderSettings(defaultSortedDocumentTypes, settingsModel)

        if (!settingsModel) {
            return {
                documentOrderSettings,
                documentVisibilitySettings: [],
            }
        }

        const sortedDocumentTypes = await this.getSortedByDefaultDocumentTypesBySession(SessionType.User, documentsDefaultOrder)

        return {
            documentOrderSettings,
            documentVisibilitySettings: sortedDocumentTypes.map((documentType): DocumentVisibilitySettingsItem => {
                const documentSetting = <DocumentTypeSetting>(settingsModel[documentType] || {})
                const { hiddenDocuments = [], hiddenDocumentType } = documentSetting

                return { documentType, hiddenDocuments, hiddenDocumentType }
            }),
        }
    }

    async updateDocumentVisibility(params: UpdateDocumentVisibilityReq): Promise<void> {
        const { userIdentifier, documentType, hideDocuments, unhideDocuments, hideDocumentType } = params

        const hiddenDocumentsField = [documentType, <keyof DocumentTypeSetting>'hiddenDocuments'].join('.')
        const hiddenDocumentTypeField = [documentType, <keyof DocumentTypeSetting>'hiddenDocumentType'].join('.')

        const hideModifier: UpdateQuery<UserDocumentSettingsModel> = {
            $addToSet: { [hiddenDocumentsField]: { $each: hideDocuments } },
            $set: { [hiddenDocumentTypeField]: hideDocumentType },
        }

        await userDocumentSettingsModel.updateOne({ userIdentifier }, hideModifier, { upsert: true })

        if (unhideDocuments.length > 0) {
            const unhideModifier: UpdateQuery<UserDocumentSettingsModel> = {
                $pull: { [hiddenDocumentsField]: { $in: unhideDocuments } },
            }

            await userDocumentSettingsModel.updateOne({ userIdentifier }, unhideModifier)
        }
    }

    async setDocumentAsHidden(userIdentifier: string, documentType: string, documentId: string): Promise<void> {
        const modifier: UpdateQuery<UserDocumentSettingsModel> = {
            $push: { [`${documentType}.hiddenDocuments`]: documentId },
        }

        await userDocumentSettingsModel.updateOne({ userIdentifier }, modifier, { upsert: true })
    }

    async unhideDocumentByType(userIdentifier: string, documentType: string): Promise<void> {
        const modifier: UpdateQuery<UserDocumentSettingsModel> = {
            $set: { [`${documentType}.hiddenDocuments`]: [] },
        }

        await userDocumentSettingsModel.updateOne({ userIdentifier }, modifier)
    }

    async getDocumentVisibilitySettings(userIdentifier: string, documentType: string): Promise<DocumentVisibilitySettings> {
        const settingsModel = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        if (!settingsModel) {
            return { hiddenDocuments: [], hiddenDocumentType: false }
        }

        const { hiddenDocuments = [], hiddenDocumentType = false } = <DocumentTypeSetting>(settingsModel[documentType] || {})

        return { hiddenDocuments, hiddenDocumentType }
    }

    isDocumentHidden(visibilitySettings: DocumentVisibilitySettings, docId: string): boolean {
        return visibilitySettings.hiddenDocumentType || visibilitySettings.hiddenDocuments.includes(docId)
    }

    private getDocumentOrderSettings(
        defaultSortedDocumentTypes: string[],
        documentSettings: UserDocumentSettingsModel | null,
    ): DocumentOrderSettingsItem[] {
        return defaultSortedDocumentTypes
            .map((documentType, defaultSortedOrder): [DocumentOrderSettingsItem, number] => {
                const documentSetting = <DocumentTypeSetting | undefined>documentSettings?.[documentType]

                if (documentSetting) {
                    const { documentTypeOrder, documentIdentifiers = {} } = documentSetting

                    return [
                        {
                            documentType,
                            documentIdentifiers: Object.entries(documentIdentifiers)
                                .sort(([, orderA], [, orderB]) => orderA - orderB)
                                .map(([documentIdentifier]) => documentIdentifier),
                        },
                        documentTypeOrder === this.defaultNotDefinedOrder ? defaultSortedOrder : documentTypeOrder,
                    ]
                }

                return [{ documentType, documentIdentifiers: [] }, defaultSortedOrder]
            })
            .sort(([, a], [, b]) => a - b)
            .map(([userDocumentOrder]) => userDocumentOrder)
    }

    private async getDocumentSettingsByUserIdentifier(userIdentifier: string): Promise<UserDocumentSettingsModel | null> {
        return await userDocumentSettingsModel.findOne({ userIdentifier })
    }

    private async validateDocumentTypeOrders(
        params: UserDocumentsOrderParams,
        documentsOrder: DocumentTypeWithOrder[],
    ): Promise<void | never> {
        const documentTypeSet: Set<string> = new Set()
        const orderSet: Set<number> = new Set()
        const { userIdentifier, features = {} } = params

        const allowedDocumentTypes = await this.getDefaultSortedDocumentTypes(userIdentifier, Object.keys(features), false)

        for (const { documentType, order } of documentsOrder) {
            if (!allowedDocumentTypes.includes(documentType)) {
                throw new BadRequestError('Document type is not supported', { documentType })
            }

            if (!Number.isInteger(order)) {
                throw new BadRequestError('Invalid order number', { order, documentType })
            }

            if (orderSet.has(order)) {
                throw new BadRequestError('Duplicated order number', { order, documentType })
            }

            if (documentTypeSet.has(documentType)) {
                throw new BadRequestError('Duplicated document type', { order, documentType })
            }

            documentTypeSet.add(documentType)
            orderSet.add(order)
        }
    }

    private validateDocumentsOrderByDocumentType(documentsOrder: SaveDocumentsOrderByDocumentTypeRequest[]): void | never {
        const docNumberSet: Set<string> = new Set()
        const orderSet: Set<number> = new Set()

        for (const { docNumber, order } of documentsOrder) {
            if (order <= 0 || !Number.isInteger(order)) {
                throw new BadRequestError('Invalid order number', { order, docNumber })
            }

            if (orderSet.has(order)) {
                throw new BadRequestError('Duplicated order number', { order, docNumber })
            }

            if (docNumberSet.has(docNumber)) {
                throw new BadRequestError('Duplicated docNumber', { order, docNumber })
            }

            docNumberSet.add(docNumber)
            orderSet.add(order)
        }
    }

    private async generateDocumentTypeOrders(documentsOrder?: DocumentTypeWithOrder[]): Promise<Record<string, number>> {
        const documentTypeOrders: Record<string, number> = {}
        const providedDocumentTypes: Set<string> = new Set()

        for (const { documentType, order } of documentsOrder || []) {
            providedDocumentTypes.add(documentType)
            documentTypeOrders[`${documentType}.documentTypeOrder`] = order
        }

        const sortedDocumentTypes = await this.getSortedByDefaultDocumentTypesBySession(SessionType.User)

        for (const documentType of sortedDocumentTypes) {
            if (!providedDocumentTypes.has(documentType)) {
                documentTypeOrders[`${documentType}.documentTypeOrder`] = this.defaultNotDefinedOrder
            }
        }

        return documentTypeOrders
    }

    private async getDefaultSortedDocumentTypes(
        userIdentifier: string,
        features: string[],
        excludeFeatureSpecificDocs = true,
        documentsDefaultOrder?: DocumentsDefaultOrder,
    ): Promise<string[]> {
        const sessionType = this.identifier.getSessionTypeFromIdentifier(userIdentifier)
        const documentTypes = await this.getSortedByDefaultDocumentTypesBySession(sessionType, documentsDefaultOrder)
        const hasOfficeFeature = features.includes(ProfileFeature.office)

        if (excludeFeatureSpecificDocs && !hasOfficeFeature) {
            return documentTypes.filter((item) => !this.officeOnlyDocumentTypes.includes(item))
        }

        return documentTypes
    }

    private async getSortedByDefaultDocumentTypesBySession(
        sessionType: SessionType,
        documentsDefaultOrder?: DocumentsDefaultOrder,
    ): Promise<string[]> {
        if (documentsDefaultOrder && !isEmpty(documentsDefaultOrder)) {
            return documentsDefaultOrder[sessionType]?.items || []
        }

        const { sortedDocumentTypes } = await this.documentsService.getSortedByDefaultDocumentTypes()

        return sortedDocumentTypes[sessionType].items || []
    }
}
