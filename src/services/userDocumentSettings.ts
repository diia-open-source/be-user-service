import { UpdateQuery } from 'mongoose'

import { IdentifierService } from '@diia-inhouse/crypto'
import { BadRequestError } from '@diia-inhouse/errors'
import { DocumentType, DocumentTypeCamelCase, ProfileFeature, SessionType } from '@diia-inhouse/types'

import userDocumentSettingsModel from '@models/userDocumentSettings'

import { UserDocumentSettingsModel } from '@interfaces/models/userDocumentSettings'
import {
    DocumentTypeWithOrder,
    SaveDocumentsOrderByDocumentTypeRequest,
    UserDocumentsOrderParams,
    UserDocumentsOrderResponse,
} from '@interfaces/services/userDocumentSettings'

export default class UserDocumentSettingsService {
    private readonly defaultNotDefinedOrder: number = -1

    private readonly sortedDocumentTypes: DocumentType[] = [
        DocumentType.MilitaryBond,
        DocumentType.HousingCertificate,
        DocumentType.UId,
        DocumentType.TaxpayerCard,
        DocumentType.LocalVaccinationCertificate,
        DocumentType.InternationalVaccinationCertificate,
        DocumentType.ChildLocalVaccinationCertificate,
        DocumentType.InternalPassport,
        DocumentType.ForeignPassport,
        DocumentType.ResidencePermitPermanent,
        DocumentType.ResidencePermitTemporary,
        DocumentType.PensionCard,
        DocumentType.DriverLicense,
        DocumentType.VehicleLicense,
        DocumentType.StudentIdCard,
        DocumentType.RefInternallyDisplacedPerson,
        DocumentType.BirthCertificate,
        DocumentType.EResidency,
        DocumentType.EResidentPassport,
        DocumentType.EducationDocument,
        DocumentType.VehicleInsurance,
        DocumentType.OfficialCertificate,
    ]

    private readonly eResidentDocumentFilter: DocumentType[] = [DocumentType.EResidency, DocumentType.EResidentPassport]

    private readonly officeOnlyDocumentTypes = [DocumentType.OfficialCertificate]

    private readonly defaultSortedEResidentDocumentTypes: DocumentType[] = this.sortedDocumentTypes.filter((docType) =>
        this.eResidentDocumentFilter.includes(docType),
    )

    private readonly defaultSortedDocumentTypesBySessionType: Partial<Record<SessionType, DocumentType[]>> = {
        [SessionType.User]: this.sortedDocumentTypes,
        [SessionType.EResident]: this.defaultSortedEResidentDocumentTypes,
    }

    private readonly documentTypeToCamelCase: Record<DocumentType, DocumentTypeCamelCase> = {
        [DocumentType.InternalPassport]: DocumentTypeCamelCase.idCard,
        [DocumentType.ForeignPassport]: DocumentTypeCamelCase.foreignPassport,
        [DocumentType.TaxpayerCard]: DocumentTypeCamelCase.taxpayerCard,
        [DocumentType.DriverLicense]: DocumentTypeCamelCase.driverLicense,
        [DocumentType.VehicleLicense]: DocumentTypeCamelCase.vehicleLicense,
        [DocumentType.VehicleInsurance]: DocumentTypeCamelCase.vehicleLicense,
        [DocumentType.StudentIdCard]: DocumentTypeCamelCase.studentCard,
        [DocumentType.RefInternallyDisplacedPerson]: DocumentTypeCamelCase.referenceInternallyDisplacedPerson,
        [DocumentType.BirthCertificate]: DocumentTypeCamelCase.birthCertificate,
        [DocumentType.LocalVaccinationCertificate]: DocumentTypeCamelCase.localVaccinationCertificate,
        [DocumentType.ChildLocalVaccinationCertificate]: DocumentTypeCamelCase.childLocalVaccinationCertificate,
        [DocumentType.InternationalVaccinationCertificate]: DocumentTypeCamelCase.internationalVaccinationCertificate,
        [DocumentType.PensionCard]: DocumentTypeCamelCase.pensionCard,
        [DocumentType.ResidencePermitPermanent]: DocumentTypeCamelCase.residencePermitPermanent,
        [DocumentType.ResidencePermitTemporary]: DocumentTypeCamelCase.residencePermitTemporary,
        [DocumentType.UId]: DocumentTypeCamelCase.uId,
        [DocumentType.EResidency]: DocumentTypeCamelCase.eResidency,
        [DocumentType.EResidentPassport]: DocumentTypeCamelCase.eResidentPassport,
        [DocumentType.MilitaryBond]: DocumentTypeCamelCase.militaryBond,
        [DocumentType.OfficialCertificate]: DocumentTypeCamelCase.officialCertificate,
        [DocumentType.HousingCertificate]: DocumentTypeCamelCase.housingCertificate,
        [DocumentType.EducationDocument]: DocumentTypeCamelCase.educationDocument,
        [DocumentType.MarriageActRecord]: DocumentTypeCamelCase.marriageActRecord,
        [DocumentType.DivorceActRecord]: DocumentTypeCamelCase.divorceActRecord,
        [DocumentType.NameChangeActRecord]: DocumentTypeCamelCase.nameChangeActRecord,
        [DocumentType.UserBirthCertificate]: DocumentTypeCamelCase.userBirthCertificate,
    }

    private readonly unorderedDocumentsStartOrder = 1000

    constructor(private readonly identifier: IdentifierService) {}

    async saveDocumentsOrder(params: UserDocumentsOrderParams, documentsOrder: DocumentTypeWithOrder[]): Promise<void> {
        const { userIdentifier } = params

        await this.validateDocumentTypeOrders(params, documentsOrder)
        const documentTypeOrders = this.generateDocumentTypeOrders(documentsOrder)
        const documentSettings = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        if (documentSettings) {
            await userDocumentSettingsModel.updateOne({ userIdentifier }, documentTypeOrders)

            return
        }

        await userDocumentSettingsModel.create({ userIdentifier, ...documentTypeOrders })
    }

    async saveDocumentsOrderByDocumentType(
        params: UserDocumentsOrderParams,
        documentType: DocumentType,
        documentsOrder: SaveDocumentsOrderByDocumentTypeRequest[],
    ): Promise<void> {
        const { userIdentifier } = params
        if (!documentsOrder.length) {
            throw new BadRequestError('Please, define at least one document number')
        }

        const documentSettings = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        if (!documentSettings) {
            const documentTypeOrders = this.generateDocumentTypeOrders()

            await userDocumentSettingsModel.create({ userIdentifier, ...documentTypeOrders })
        }

        this.validateDocumentsOrderByDocumentType(documentsOrder)
        const documentIdentifiersForUpdate: { [key: string]: number } = {}

        documentsOrder.forEach(({ docNumber, order }: SaveDocumentsOrderByDocumentTypeRequest) => {
            const identifier: string = this.identifier.createIdentifier(docNumber)

            documentIdentifiersForUpdate[identifier] = order
        })

        await userDocumentSettingsModel.updateOne(
            { userIdentifier },
            {
                $set: {
                    [`${documentType}.documentIdentifiers`]: documentIdentifiersForUpdate,
                },
            },
        )
    }

    async getDocumentsOrder(params: UserDocumentsOrderParams): Promise<UserDocumentsOrderResponse[]> {
        const { userIdentifier } = params
        const defaultSortedDocumentTypes = this.getDefaultSortedDocumentTypes(params)
        const documentSettings = await this.getDocumentSettingsByUserIdentifier(userIdentifier)

        return defaultSortedDocumentTypes
            .map((documentType, defaultSortedOrder): [UserDocumentsOrderResponse, number] => {
                const documentSetting = documentSettings?.[documentType]

                if (documentSetting && documentSetting?.documentTypeOrder !== this.defaultNotDefinedOrder) {
                    const { documentTypeOrder, documentIdentifiers = {} } = documentSetting

                    return [
                        {
                            documentType,
                            documentIdentifiers: Object.entries(documentIdentifiers)
                                .sort(([, orderA], [, orderB]) => orderA - orderB)
                                .map(([documentIdentifier]) => documentIdentifier),
                        },
                        documentTypeOrder,
                    ]
                }

                return [{ documentType }, defaultSortedOrder]
            })
            .sort(([, a], [, b]) => a - b)
            .map(([userDocumentOrder]) => userDocumentOrder)
    }

    async getDocumentsTypeOrder(params: UserDocumentsOrderParams): Promise<DocumentTypeCamelCase[]> {
        const { userIdentifier } = params
        const defaultSortedDocumentTypes = this.getDefaultSortedDocumentTypes(params)
        const documentSettings = await this.getDocumentSettingsByUserIdentifier(userIdentifier)
        if (!documentSettings) {
            return defaultSortedDocumentTypes.map((docType: DocumentType) => this.documentTypeToCamelCase[docType])
        }

        const ordered: DocumentTypeWithOrder[] = []
        const unordered: Set<DocumentType> = new Set()

        Object.values(DocumentType).forEach((documentType: DocumentType) => {
            const { documentTypeOrder = this.defaultNotDefinedOrder } = documentSettings[documentType] || {}
            if (documentTypeOrder === this.defaultNotDefinedOrder) {
                unordered.add(documentType)
            } else {
                ordered.push({ order: documentTypeOrder, documentType })
            }
        })
        defaultSortedDocumentTypes.forEach((documentType: DocumentType, indx: number) => {
            if (unordered.has(documentType)) {
                ordered.push({ order: this.unorderedDocumentsStartOrder + indx, documentType })
            }
        })

        return ordered
            .sort((a: DocumentTypeWithOrder, b: DocumentTypeWithOrder) => a.order - b.order)
            .map(({ documentType }: DocumentTypeWithOrder) => this.documentTypeToCamelCase[documentType])
    }

    async setDocumentAsHidden(userIdentifier: string, documentType: DocumentType, documentId: string): Promise<void> {
        const modifier: UpdateQuery<UserDocumentSettingsModel> = {
            $push: { [`${documentType}.hiddenDocuments`]: documentId },
        }

        await userDocumentSettingsModel.updateOne({ userIdentifier }, modifier, { upsert: true })
    }

    async unhideDocumentByType(userIdentifier: string, documentType: DocumentType): Promise<void> {
        const modifier: UpdateQuery<UserDocumentSettingsModel> = {
            $set: { [`${documentType}.hiddenDocuments`]: [] },
        }

        await userDocumentSettingsModel.updateOne({ userIdentifier }, modifier)
    }

    async getHiddenDocuments(userIdentifier: string, documentType: DocumentType): Promise<string[]> {
        const settings = await userDocumentSettingsModel.findOne({ userIdentifier })

        if (!settings) {
            return []
        }

        return settings[documentType]?.hiddenDocuments || []
    }

    private async getDocumentSettingsByUserIdentifier(userIdentifier: string): Promise<UserDocumentSettingsModel | null> {
        return await userDocumentSettingsModel.findOne({ userIdentifier })
    }

    private async validateDocumentTypeOrders(
        params: UserDocumentsOrderParams,
        documentsOrder: DocumentTypeWithOrder[],
    ): Promise<void | never> {
        const documentTypeSet: Set<DocumentType> = new Set()
        const orderSet: Set<number> = new Set()
        const allowedDocumentTypes = this.getDefaultSortedDocumentTypes(params, false)

        documentsOrder.forEach(({ documentType, order }: DocumentTypeWithOrder) => {
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
        })
    }

    private validateDocumentsOrderByDocumentType(documentsOrder: SaveDocumentsOrderByDocumentTypeRequest[]): void | never {
        const docNumberSet: Set<string> = new Set()
        const orderSet: Set<number> = new Set()

        documentsOrder.forEach(({ docNumber, order }: SaveDocumentsOrderByDocumentTypeRequest) => {
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
        })
    }

    private generateDocumentTypeOrders(documentsOrder?: DocumentTypeWithOrder[]): Record<string, number> {
        const documentTypeOrders: Record<string, number> = {}
        const providedDocumentTypes: Set<DocumentType> = new Set()

        documentsOrder?.forEach(({ documentType, order }: DocumentTypeWithOrder) => {
            providedDocumentTypes.add(documentType)
            documentTypeOrders[`${documentType}.documentTypeOrder`] = order
        })

        this.sortedDocumentTypes.forEach((documentType: DocumentType) => {
            if (!providedDocumentTypes.has(documentType)) {
                documentTypeOrders[`${documentType}.documentTypeOrder`] = this.defaultNotDefinedOrder
            }
        })

        return documentTypeOrders
    }

    private getDefaultSortedDocumentTypes(params: UserDocumentsOrderParams, excludeFeatureSpecificDocs = true): DocumentType[] {
        const sessionType = this.identifier.getSessionTypeFromIdentifier(params.userIdentifier)

        let documentTypes = this.defaultSortedDocumentTypesBySessionType[sessionType] || []

        if (excludeFeatureSpecificDocs && !params.features?.[ProfileFeature.office]) {
            documentTypes = documentTypes.filter((item) => !this.officeOnlyDocumentTypes.includes(item))
        }

        return documentTypes
    }
}
