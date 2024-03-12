import { FilterQuery, ObjectId } from 'mongoose'

import { CryptoService } from '@diia-inhouse/crypto'
import { BadRequestError } from '@diia-inhouse/errors'
import { DocumentType, Logger } from '@diia-inhouse/types'

import userDocumentStorageModel from '@models/userDocumentStorage'

import { UserDocumentStorage, UserDocumentStorageModel } from '@interfaces/models/userDocumentStorage'
import {
    AddDocumentOps,
    DecryptedDocument,
    DecryptedDocuments,
    EncryptedDataByDocumentType,
    GetDocumentsOps,
    StoredBirthCertificateData,
    StoredMedicalData,
    VaccinationCertificateType,
} from '@interfaces/services/userDocumentStorage'

export default class UserDocumentStorageService {
    readonly storageDocumentTypes: DocumentType[] = [
        DocumentType.BirthCertificate,
        DocumentType.VehicleLicense,
        DocumentType.LocalVaccinationCertificate,
        DocumentType.ChildLocalVaccinationCertificate,
        DocumentType.InternationalVaccinationCertificate,
        DocumentType.ResidencePermitPermanent,
        DocumentType.ResidencePermitTemporary,
        DocumentType.MilitaryBond,
    ]

    constructor(
        private readonly crypto: CryptoService,
        private readonly logger: Logger,
    ) {}

    async addDocument(
        userIdentifier: string,
        hashData: string,
        documentType: DocumentType,
        encryptedData: string,
        encryptedPhoto?: string,
        encryptedDocPhoto?: string,
        { mobileUid, compareExistedHashData }: AddDocumentOps = {},
    ): Promise<UserDocumentStorageModel | undefined> {
        const query: FilterQuery<UserDocumentStorageModel> = { userIdentifier, mobileUid, documentType }
        const userDocumentStorage = await userDocumentStorageModel.findOne(query)

        const data: UserDocumentStorage = {
            userIdentifier,
            mobileUid,
            hashData,
            documentType,
            encryptedData,
            encryptedPhoto,
            encryptedDocPhoto,
        }
        if (!userDocumentStorage) {
            return await userDocumentStorageModel.create(data)
        }

        const isHashDataMatched = userDocumentStorage.hashData === hashData
        if (compareExistedHashData && !isHashDataMatched) {
            throw new BadRequestError('Existed document already existed with a different data', { documentType })
        }

        if (isHashDataMatched && (encryptedPhoto || encryptedDocPhoto)) {
            userDocumentStorage.encryptedDocPhoto = encryptedDocPhoto || userDocumentStorage.encryptedDocPhoto
            userDocumentStorage.encryptedPhoto = encryptedPhoto || userDocumentStorage.encryptedPhoto

            await userDocumentStorage.save()
        }

        if (!isHashDataMatched) {
            return await userDocumentStorageModel.create(data)
        }
    }

    async getEncryptedDataFromStorage(
        userIdentifier: string,
        mobileUid?: string,
        documentTypes?: DocumentType[],
    ): Promise<EncryptedDataByDocumentType> {
        const query: FilterQuery<UserDocumentStorageModel> = mobileUid
            ? { userIdentifier, $or: [{ mobileUid: { $exists: false } }, { mobileUid }] }
            : { userIdentifier }
        if (documentTypes?.length) {
            query.documentType = { $in: documentTypes }
        }

        const userDocumentsStorage = await userDocumentStorageModel.find(query, {
            encryptedData: 1,
            documentType: 1,
            encryptedPhoto: 1,
            encryptedDocPhoto: 1,
        })

        const encryptedDataByDocumentTypes: EncryptedDataByDocumentType = {}

        userDocumentsStorage.forEach((userDocumentStorage) => {
            const { encryptedData, documentType } = userDocumentStorage

            encryptedDataByDocumentTypes[documentType] = [...(encryptedDataByDocumentTypes[documentType] || []), encryptedData]
        })

        return encryptedDataByDocumentTypes
    }

    async getDecryptedDataFromStorage(userIdentifier: string, ops: GetDocumentsOps = {}): Promise<DecryptedDocuments> {
        const { mobileUid, documentTypes } = ops
        const query: FilterQuery<UserDocumentStorageModel> = { userIdentifier }
        if (mobileUid) {
            query.$or = [{ mobileUid: { $exists: false } }, { mobileUid }]
        }

        if (documentTypes?.length) {
            query.documentType = { $in: documentTypes }
        }

        const storedUserDocuments: UserDocumentStorageModel[] = await userDocumentStorageModel.find(query)
        const decryptedDocuments: DecryptedDocuments = {}

        const tasks: Promise<void>[] = storedUserDocuments.map(async (storedDocument) => {
            const { documentType, encryptedData, encryptedPhoto, encryptedDocPhoto } = storedDocument

            const [decryptedDocument, photo, docPhoto] = await Promise.all([
                this.crypto.decryptData<DecryptedDocument>(encryptedData),
                encryptedPhoto && this.crypto.decryptData<string>(encryptedPhoto),
                encryptedDocPhoto && this.crypto.decryptData<string>(encryptedDocPhoto),
            ])

            decryptedDocument.photo = photo
            decryptedDocument.docPhoto = docPhoto
            decryptedDocuments[documentType] = [...(decryptedDocuments[documentType] || []), decryptedDocument]
        })

        await Promise.all(tasks)

        return decryptedDocuments
    }

    async removeFromStorageById(userIdentifier: string, documentType: DocumentType, documentId: string, mobileUid?: string): Promise<void> {
        if (!this.storageDocumentTypes.includes(documentType)) {
            return
        }

        const query: FilterQuery<UserDocumentStorageModel> = {
            userIdentifier,
            documentType,
            $or: [{ mobileUid: { $exists: false } }, { mobileUid }],
        }
        const documents: UserDocumentStorageModel[] = await userDocumentStorageModel.find(query)

        this.logger.info(`Found storage records: ${documents.length}`)

        const idsToRemove: ObjectId[] = []
        const tasks: Promise<void>[] = documents.map(async (document: UserDocumentStorageModel) => {
            const { _id: id, encryptedData } = document
            const data: StoredBirthCertificateData = await this.crypto.decryptData(encryptedData)
            if (data.id === documentId) {
                idsToRemove.push(id)
            }
        })

        await Promise.all(tasks)

        this.logger.info(`Found storage records to remove: ${idsToRemove.length}`)
        if (idsToRemove.length) {
            const removeQuery: FilterQuery<UserDocumentStorageModel> = { _id: { $in: idsToRemove } }
            const { deletedCount } = await userDocumentStorageModel.deleteMany(removeQuery)

            this.logger.info(`Removed storage records: ${deletedCount}`)
        }
    }

    async removeFromStorageByHashData(userIdentifier: string, documentType: DocumentType, hashData: string): Promise<void> {
        const { deletedCount }: { deletedCount?: number } = await userDocumentStorageModel.deleteOne({
            userIdentifier,
            documentType,
            hashData,
        })

        this.logger.info('Remove user data from storage result', { deletedCount, documentType })
    }

    async removeCovidCertificatesFromStorage(userIdentifier: string, mobileUid: string): Promise<void> {
        const query: FilterQuery<UserDocumentStorageModel> = {
            userIdentifier,
            mobileUid,
            documentType: {
                $in: [
                    DocumentType.LocalVaccinationCertificate,
                    DocumentType.ChildLocalVaccinationCertificate,
                    DocumentType.InternationalVaccinationCertificate,
                ],
            },
        }

        const { deletedCount }: { deletedCount?: number } = await userDocumentStorageModel.deleteMany(query)

        this.logger.info('Remove user covid certificates from storage', { userIdentifier, mobileUid, deletedCount })
    }

    async removeCovidCertificateFromStorage(
        userIdentifier: string,
        documentType: DocumentType,
        mobileUid: string,
        types: VaccinationCertificateType[],
        birthCertificateId?: string,
    ): Promise<void> {
        const query: FilterQuery<UserDocumentStorageModel> = {
            userIdentifier,
            mobileUid,
            documentType,
        }
        const storedCertificates: UserDocumentStorageModel[] = await userDocumentStorageModel.find(query)

        const idsToDelete: string[] = (
            await Promise.all(
                storedCertificates.map(async ({ _id: id, encryptedData }: UserDocumentStorageModel) => {
                    const medicalData: StoredMedicalData = await this.crypto.decryptData(encryptedData)

                    const toSkip: boolean = birthCertificateId
                        ? medicalData.documentIdentifier !== birthCertificateId
                        : medicalData.documentType === DocumentType.BirthCertificate
                    if (toSkip) {
                        return
                    }

                    const type = this.getCertificateType(medicalData)
                    if (!type || !types.includes(type)) {
                        return
                    }

                    return id
                }),
            )
        ).filter(Boolean)

        const deleteQuery: FilterQuery<UserDocumentStorageModel> = { _id: { $in: idsToDelete } }
        const { deletedCount }: { deletedCount?: number } = await userDocumentStorageModel.deleteMany(deleteQuery)

        this.logger.info('Remove user data from storage result', { deletedCount, documentType, types })
    }

    async hasStorageDocument(userIdentifier: string, mobileUid: string, documentType: DocumentType, id: string): Promise<boolean> {
        const storageDataByDocumentTypes = await this.getDecryptedDataFromStorage(userIdentifier, {
            mobileUid,
            documentTypes: [documentType],
        })
        const documentTypeStorageData = storageDataByDocumentTypes[documentType]
        const alreadyExistsInStorage = documentTypeStorageData?.some(({ id: docId }) => docId === id)
        if (alreadyExistsInStorage) {
            this.logger.info('Document already exists in storage', { id, documentType })

            return true
        }

        this.logger.info('Not found document in storage', { id, documentType })

        return false
    }

    private getCertificateType(medicalData: StoredMedicalData): VaccinationCertificateType | undefined {
        if (medicalData.vaccinations?.length) {
            return VaccinationCertificateType.Vaccination
        }

        if (medicalData.tests?.length) {
            return VaccinationCertificateType.Test
        }

        if (medicalData.recoveries?.length) {
            return VaccinationCertificateType.Recovery
        }
    }
}
