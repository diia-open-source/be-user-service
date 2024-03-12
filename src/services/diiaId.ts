import moment from 'moment'
import { FilterQuery, UpdateQuery } from 'mongoose'
import { v4 as uuid } from 'uuid'

import { IdentifierService } from '@diia-inhouse/crypto'
import { ExternalCommunicator, ExternalEvent, ExternalEventBus } from '@diia-inhouse/diia-queue'
import { EnvService } from '@diia-inhouse/env'
import { AccessDeniedError, ApiError, InternalServerError, ModelNotFoundError, ServiceUnavailableError } from '@diia-inhouse/errors'
import { I18nService } from '@diia-inhouse/i18n'
import { AppUser, AppUserActionHeaders, DocumentType, HttpStatusCode, Logger, SessionType, UserTokenData } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import AuthService from '@services/auth'
import DocumentsService from '@services/documents'
import EResidentDiiaIdConfirmationService from '@services/eResidentDiiaIdConfirmation'
import SuperGenService from '@services/superGen'
import UserSigningHistoryService from '@services/userSigningHistory'

import diiaIdModel from '@models/diiaId'

import { DiiaIdHashFilesRequest, DiiaIdHashFilesResponse, FileToHash, HashedFile } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import {
    DiiaIdHashFilesIntegrityRequest,
    DiiaIdHashFilesIntegrityResponse,
} from '@interfaces/externalEventListeners/diiaIdHashFilesIntegrity'
import {
    DiiaIdSignDpsPackagePrepareRequest,
    DiiaIdSignDpsPackagePrepareResponse,
    TaxReportDao,
} from '@interfaces/externalEventListeners/diiaIdSignDpsPackagePrepare'
import { DiiaIdSignHashesInitRequest, DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { Locales } from '@interfaces/locales'
import { DiiaId, DiiaIdModel, SignAlgo } from '@interfaces/models/diiaId'
import { AttentionMessageParameterType, ProcessCode } from '@interfaces/services'
import { AuthSchemaCode } from '@interfaces/services/auth'
import {
    AreSignedFileHashesValidParams,
    AreSignedFileHashesValidResult,
    DiiaIdAgreementGenerationData,
    DiiaIdCertificateCountryCode,
    DiiaIdCertificateUserInfo,
    DiiaIdCreateCertificateMessage,
    DiiaIdCreateCertificateResponse,
    DiiaIdIdentifier,
    DiiaIdIdentifierResponse,
    DiiaIdIdentifiersResponse,
    DiiaIdIdentifiersResponseV1,
    DiiaIdResponse,
    FileIntegrityResult,
    HashFilesToSignOptions,
} from '@interfaces/services/diiaId'
import { IdentityDocument, IdentityDocumentType, Passport } from '@interfaces/services/documents'
import { EResidentDiiaIdInfoRequest } from '@interfaces/services/eResidentDiiaIdConfirmation'

export default class DiiaIdService {
    private readonly dateFormat: string = 'DD.MM.YYYY'

    private readonly defaultExpirationOnCreationMs: number = 30 * 1000

    constructor(
        private readonly documentsService: DocumentsService,
        private readonly superGenService: SuperGenService,
        private readonly userSigningHistoryService: UserSigningHistoryService,
        private readonly authService: AuthService,

        private readonly i18n: I18nService<Locales>,
        private readonly envService: EnvService,
        private readonly externalEventBus: ExternalEventBus,
        private readonly external: ExternalCommunicator,
        private readonly logger: Logger,
        private readonly eResidentDiiaIdConfirmationService: EResidentDiiaIdConfirmationService,
        private readonly identifier: IdentifierService,
    ) {}

    async getIdentifierAvailability(userIdentifier: string, mobileUid: string): Promise<DiiaIdIdentifier[]> {
        await this.checkIfCreationExpiredAndSoftDelete(userIdentifier)

        const diiaIds: DiiaIdModel[] = await diiaIdModel.find({ mobileUid, userIdentifier, isDeleted: false })

        return diiaIds
            .filter((diiaId) => this.isDiiaIdActive(diiaId))
            .map(({ identifier, signAlgo }) => {
                return { identifier, signAlgo }
            })
    }

    async createDiiaIds(user: AppUser, mobileUid: string, signAlgos: SignAlgo[]): Promise<DiiaIdIdentifier[]> {
        const identityDocument = await this.getIdentityDocument(user, ProcessCode.RegistryUnavailableWhenDiiaIdCreating)
        const identityDocumentPdf = await this.generateIdentityDocument(identityDocument, user)

        return await Promise.all(
            signAlgos.map(async (signAlgo) => {
                const identifier = await this.createDiiaId(user, mobileUid, signAlgo, identityDocument, identityDocumentPdf)

                return { identifier, signAlgo }
            }),
        )
    }

    async createDiiaId(
        user: AppUser,
        mobileUid: string,
        signAlgo: SignAlgo,
        identityDocumentParam?: IdentityDocument,
        identityDocumentPdf?: string,
    ): Promise<string> {
        const { identifier: userIdentifier } = user

        await this.softDeleteIdentifiers(userIdentifier, { signAlgo })

        const identifier = uuid()
        const identityDocument =
            identityDocumentParam || (await this.getIdentityDocument(user, ProcessCode.RegistryUnavailableWhenDiiaIdCreating))

        const result = await this.initCreateCertificate(identifier, identityDocument, user, signAlgo, identityDocumentPdf)
        if (!result) {
            throw new InternalServerError('Failed to create certificate')
        }

        const diiaIdData: DiiaId = {
            mobileUid,
            userIdentifier,
            identifier,
            identityDocumentType: identityDocument.identityType,
            isDeleted: false,
            signAlgo,
        }

        try {
            await diiaIdModel.create(diiaIdData)
        } catch (err) {
            const errorMsg = 'Failed to create diia id'

            this.logger.fatal(errorMsg, { err })

            throw new InternalServerError(errorMsg)
        }

        return identifier
    }

    async handleCreateCertificateResponse({
        certificateSerialNumber,
        registryUserIdentifier,
        identifier,
        creationDate,
        expirationDate,
        signAlgo,
    }: DiiaIdCreateCertificateResponse): Promise<void> {
        const diiaId = await diiaIdModel.findOne({ identifier, isDeleted: false, signAlgo })
        if (!diiaId) {
            throw new ModelNotFoundError(diiaIdModel.modelName, identifier)
        }

        try {
            await diiaIdModel.updateOne(
                { identifier, isDeleted: false, signAlgo },
                { $set: { creationDate, expirationDate, registryUserIdentifier, certificateSerialNumber } },
            )

            const sessionType = this.identifier.getSessionTypeFromIdentifier(diiaId.userIdentifier)

            if (sessionType === SessionType.EResident) {
                this.logger.info('EResident: confirming diiaId creation')

                const isFirstDiiaId = !(await diiaIdModel.countDocuments({ isDeleted: true, registryUserIdentifier }))

                if (isFirstDiiaId) {
                    const request: EResidentDiiaIdInfoRequest = { certificateSerialNumber, registryUserIdentifier }

                    await this.eResidentDiiaIdConfirmationService.confirmEresidentCreation(request)
                }
            }
        } catch (err) {
            this.logger.error('Error while handle create certificate response', { err })
        }
    }

    async getIdentifierV1(user: UserTokenData, mobileUid: string, signAlgo: SignAlgo): Promise<DiiaIdResponse | undefined> {
        const { identifier: userIdentifier } = user

        await this.checkIfCreationExpiredAndSoftDelete(userIdentifier, signAlgo)

        const diiaId = await this.getDiiaId(userIdentifier, mobileUid, signAlgo)
        if (!diiaId) {
            return
        }

        if (!this.isDiiaIdActive(diiaId)) {
            throw new AccessDeniedError('Diia id certificate still in a process of creation', { identifier: diiaId.identifier })
        }

        try {
            const passport: Passport = await this.documentsService.getPassportToProcess(user)
            const { docNumber, lastNameUA, firstNameUA, middleNameUA, photo, sign } = passport
            const { creationDate, expirationDate } = diiaId

            return {
                identifier: diiaId.identifier,
                creationDate: moment(creationDate).format(this.dateFormat),
                expirationDate: moment(expirationDate).format(this.dateFormat),
                passport: {
                    docNumber,
                    lastNameUA,
                    firstNameUA,
                    middleNameUA,
                    photo,
                    sign,
                },
            }
        } catch (err) {
            await utils.handleError(err, async (e) => {
                if (e.getCode() === HttpStatusCode.NOT_FOUND) {
                    await this.softDeleteIdentifiers(userIdentifier, { mobileUid, signAlgo })
                }

                this.logger.error('Failed to retrieve passport to process', { err })
            })
        }
    }

    async getIdentifierV2(user: UserTokenData, headers: AppUserActionHeaders, signAlgo: SignAlgo): Promise<DiiaIdIdentifierResponse> {
        const { identifier: userIdentifier } = user
        const { mobileUid } = headers

        await this.checkIfCreationExpiredAndSoftDelete(userIdentifier, signAlgo)

        const [diiaId, totalHistory] = await Promise.all([
            this.getDiiaId(userIdentifier, mobileUid, signAlgo),
            this.userSigningHistoryService.countHistory(userIdentifier),
        ])
        const hasSigningHistory = !!totalHistory

        if (!this.isDiiaIdActive(diiaId)) {
            return {
                description: this.i18n.get('diiaId.getIdentifier.v2.notActivated.description'),
                attentionMessage: {
                    text: this.i18n.get('diiaId.getIdentifier.v2.notActivated.text'),
                    icon: '☝️',
                    parameters: [
                        {
                            type: AttentionMessageParameterType.Link,
                            data: {
                                name: 'link1',
                                alt: this.i18n.get('diiaId.getIdentifier.v2.notActivated.link1Name'),
                                resource: 'https://ca.diia.gov.ua/diia_signature_application',
                            },
                        },
                    ],
                },
                hasSigningHistory,
            }
        }

        return {
            identifier: diiaId?.identifier,
            hasSigningHistory,
            stubMessage: hasSigningHistory
                ? undefined
                : {
                      icon: '🤷‍♂️',
                      text: this.i18n.get('diiaId.getIdentifier.v2.activated.noDocumentWasSigned'),
                  },
        }
    }

    async getIdentifiersV1(user: UserTokenData, headers: AppUserActionHeaders): Promise<DiiaIdIdentifiersResponseV1> {
        const { identifier: userIdentifier } = user
        const { mobileUid } = headers

        const availableDiiaIds = await this.getAvailableDiiaIds(userIdentifier, mobileUid)
        const hasAnyDiiaIdTypeAvailable = availableDiiaIds.some((diiaId) => this.isDiiaIdActive(diiaId))

        const totalHistory = await this.userSigningHistoryService.countHistory(userIdentifier)
        const hasSigningHistory = !!totalHistory

        if (!hasAnyDiiaIdTypeAvailable) {
            return {
                identifiers: [],
                description: this.i18n.get('diiaId.getIdentifier.v2.notActivated.description'),
                attentionMessage: {
                    text: this.i18n.get('diiaId.getIdentifier.v2.notActivated.text'),
                    icon: '☝️',
                    parameters: [
                        {
                            type: AttentionMessageParameterType.Link,
                            data: {
                                name: 'link1',
                                alt: this.i18n.get('diiaId.getIdentifier.v2.notActivated.link1Name'),
                                resource: 'https://ca.diia.gov.ua/diia_signature_application',
                            },
                        },
                    ],
                },
                hasSigningHistory,
            }
        }

        return {
            identifiers: availableDiiaIds.map(({ identifier, signAlgo }) => {
                return { identifier, signAlgo }
            }),
            hasSigningHistory,
            stubMessage: hasSigningHistory
                ? undefined
                : {
                      icon: '🤷‍♂️',
                      text: this.i18n.get('diiaId.getIdentifier.v2.activated.noDocumentWasSigned'),
                  },
        }
    }

    async getIdentifiers(user: UserTokenData, headers: AppUserActionHeaders): Promise<DiiaIdIdentifiersResponse> {
        const { identifier: userIdentifier } = user
        const { mobileUid } = headers

        const availableDiiaIds = await this.getAvailableDiiaIds(userIdentifier, mobileUid)
        const hasAnyDiiaIdTypeAvailable = availableDiiaIds.some((diiaId) => this.isDiiaIdActive(diiaId))

        const buttonHistoryName = this.i18n.get('diiaId.getIdentifiers.v2.history.button.name')

        if (!hasAnyDiiaIdTypeAvailable) {
            return {
                identifiers: [],
                description: this.i18n.get('diiaId.getIdentifier.v2.notActivated.description'),
                attentionMessage: {
                    text: this.i18n.get('diiaId.getIdentifier.v2.notActivated.text'),
                    icon: '☝️',
                    parameters: [
                        {
                            type: AttentionMessageParameterType.Link,
                            data: {
                                name: 'link1',
                                alt: this.i18n.get('diiaId.getIdentifier.v2.notActivated.link1Name'),
                                resource: 'https://ca.diia.gov.ua/diia_signature_application',
                            },
                        },
                    ],
                },
                buttonHistoryName,
            }
        }

        return {
            identifiers: availableDiiaIds.map(({ identifier, signAlgo }) => {
                return { identifier, signAlgo }
            }),
            buttonHistoryName,
        }
    }

    async hasIdentifier(userIdentifier: string, mobileUidToFilter: string): Promise<boolean> {
        const query: FilterQuery<DiiaIdModel> = { userIdentifier, isDeleted: false, mobileUid: { $ne: mobileUidToFilter } }
        const diiaId = await diiaIdModel.findOne(query)
        if (!diiaId) {
            return false
        }

        if (!this.isDiiaIdActive(diiaId)) {
            throw new AccessDeniedError(
                'Diia id certificate still in a process of creation',
                { identifier: diiaId.identifier },
                ProcessCode.DiiaIdInCreationProcess,
            )
        }

        return true
    }

    async softDeleteIdentifiers(userIdentifier: string, filterParams: FilterQuery<DiiaIdModel> = {}): Promise<boolean> {
        this.logger.info('Start soft delete Diia Id')

        const query: FilterQuery<DiiaIdModel> = { ...filterParams, userIdentifier, isDeleted: false }
        const diiaIds: DiiaIdModel[] = await diiaIdModel.find(query)

        if (diiaIds.length === 0) {
            return false
        }

        await Promise.all(
            diiaIds.map(async ({ _id, identifier, certificateSerialNumber, registryUserIdentifier, mobileUid, expirationDate }) => {
                const eventUuid: string = uuid()
                const modifier: UpdateQuery<DiiaIdModel> = { isDeleted: true, deletedAt: new Date(), revoking: { eventUuid } }

                await diiaIdModel.findByIdAndUpdate(_id, modifier)
                await this.authService.revokeSubmitAfterUserAuthSteps(mobileUid, userIdentifier, AuthSchemaCode.DiiaIdCreation)

                if (!certificateSerialNumber || !registryUserIdentifier || (expirationDate && new Date() > expirationDate)) {
                    return
                }

                return await this.externalEventBus.publish(ExternalEvent.DiiaIdCertificateRevoke, {
                    uuid: eventUuid,
                    request: {
                        certificateSerialNumber,
                        registryUserIdentifier,
                        identifier: identifier,
                    },
                })
            }),
        )

        return true
    }

    async softDeleteDiiaIdBasedOnPassport(userIdentifier: string): Promise<boolean> {
        const query: FilterQuery<DiiaIdModel> = {
            isDeleted: false,
            identityDocumentType: { $exists: false },
        }

        return await this.softDeleteIdentifiers(userIdentifier, query)
    }

    async hardDeleteIdentifierByEventUuid(eventUuid: string): Promise<void> {
        const query: FilterQuery<DiiaIdModel> = { 'revoking.eventUuid': eventUuid }

        const { deletedCount }: { deletedCount?: number } = await diiaIdModel.deleteOne(query)

        this.logger.info('Deleted diia id entity', { eventUuid, deletedCount })
    }

    async handleUnsuccessRevoking(eventUuid: string, error = 'unknown'): Promise<void> {
        const query: FilterQuery<DiiaIdModel> = { 'revoking.eventUuid': eventUuid }
        const modifier: UpdateQuery<DiiaIdModel> = { 'revoking.error': error }

        const { modifiedCount } = await diiaIdModel.updateOne(query, modifier)

        this.logger.info('Updated diia id entity with unsuccess revoking', { eventUuid, modifiedCount, error })
    }

    async hashFilesToSign(
        user: UserTokenData,
        mobileUid: string,
        files: FileToHash[],
        signAlgo: SignAlgo,
        options: HashFilesToSignOptions = {},
    ): Promise<HashedFile[]> {
        const { identifier: userIdentifier } = user
        const diiaId = await this.getDiiaId(userIdentifier, mobileUid, signAlgo)
        if (!diiaId) {
            throw new ModelNotFoundError(diiaIdModel.modelName, userIdentifier)
        }

        const { identifier, certificateSerialNumber, registryUserIdentifier } = diiaId
        const { signType, noSigningTime, noContentTimestamp } = options

        if (!registryUserIdentifier || !certificateSerialNumber) {
            throw new InternalServerError('Missing registryUserIdentifier and certificateSerialNumber')
        }

        const hashFilesRequest: DiiaIdHashFilesRequest = {
            identifier,
            registryUserIdentifier,
            certificateSerialNumber,
            files,
            signAlgo,
        }
        const response = await this.external.receive<DiiaIdHashFilesResponse>(ExternalEvent.DiiaIdHashFiles, hashFilesRequest)
        if (!response) {
            throw new ServiceUnavailableError(`Missing [${ExternalEvent.DiiaIdHashFiles}] response`)
        }

        await this.initHashesSigning(userIdentifier, mobileUid, signAlgo, signType, noSigningTime, noContentTimestamp, diiaId)

        return response.hashes
    }

    async getDpsHashFilesToSign(userIdentifier: string, mobileUid: string, files: FileToHash[], signAlgo: SignAlgo): Promise<HashedFile[]> {
        const diiaId = await this.getDiiaId(userIdentifier, mobileUid, signAlgo)
        if (!diiaId) {
            throw new ModelNotFoundError(diiaIdModel.modelName, userIdentifier)
        }

        const { identifier, registryUserIdentifier, certificateSerialNumber } = diiaId

        if (!registryUserIdentifier || !certificateSerialNumber) {
            throw new InternalServerError('Missing registryUserIdentifier and certificateSerialNumber')
        }

        const hashFilesRequest: DiiaIdHashFilesRequest = {
            identifier,
            registryUserIdentifier,
            certificateSerialNumber,
            files,
            signAlgo,
        }
        const response = await this.external.receive<DiiaIdHashFilesResponse>(ExternalEvent.DiiaIdSignDpsPackageInit, hashFilesRequest)
        if (!response) {
            throw new ServiceUnavailableError(`Missing [${ExternalEvent.DiiaIdSignDpsPackageInit}] response`)
        }

        return response.hashes
    }

    async getDpsPreparedPackage(userIdentifier: string, mobileUid: string, signAlgo: SignAlgo): Promise<TaxReportDao[]> {
        const diiaId = await this.getDiiaId(userIdentifier, mobileUid, signAlgo)
        if (!diiaId) {
            throw new ModelNotFoundError(diiaIdModel.modelName, userIdentifier)
        }

        const { identifier, certificateSerialNumber, registryUserIdentifier } = diiaId

        if (!registryUserIdentifier || !certificateSerialNumber) {
            throw new InternalServerError('Missing registryUserIdentifier and certificateSerialNumber')
        }

        const packagePrepareRequest: DiiaIdSignDpsPackagePrepareRequest = {
            identifier,
            registryUserIdentifier,
            certificateSerialNumber,
        }
        const response = await this.external.receive<DiiaIdSignDpsPackagePrepareResponse>(
            ExternalEvent.DiiaIdSignDpsPackagePrepare,
            packagePrepareRequest,
        )
        if (!response) {
            throw new ServiceUnavailableError(`Missing [${ExternalEvent.DiiaIdSignDpsPackagePrepare}] response`)
        }

        return response.inReportDaoArray
    }

    async getDiiaIdByIdentifier(identifier: string): Promise<DiiaIdModel | never> {
        const query: FilterQuery<DiiaIdModel> = { identifier }
        const diiaId = await diiaIdModel.findOne(query)
        if (!diiaId) {
            throw new ModelNotFoundError(diiaIdModel.modelName, identifier)
        }

        return diiaId
    }

    async areSignedFileHashesValid({
        userIdentifier,
        mobileUid,
        files,
        returnOriginals,
        signAlgo,
    }: AreSignedFileHashesValidParams): Promise<AreSignedFileHashesValidResult | never> {
        const diiaId = await this.getDiiaId(userIdentifier, mobileUid, signAlgo)
        if (!diiaId) {
            throw new ModelNotFoundError(diiaIdModel.modelName, mobileUid)
        }

        const { identifier: diiaIdIdentifier, registryUserIdentifier, certificateSerialNumber } = diiaId

        if (!registryUserIdentifier || !certificateSerialNumber) {
            throw new InternalServerError('Missing registryUserIdentifier and certificateSerialNumber')
        }

        const request: DiiaIdHashFilesIntegrityRequest = {
            identifier: diiaIdIdentifier,
            registryUserIdentifier,
            certificateSerialNumber,
            files,
            returnOriginals,
        }
        const response = await this.external.receive<DiiaIdHashFilesIntegrityResponse>(ExternalEvent.DiiaIdHashFilesIntegrity, request)
        if (!response) {
            throw new ServiceUnavailableError(`Missing [${ExternalEvent.DiiaIdHashFilesIntegrity}] response`)
        }

        const { checkResults } = response

        const areValid: boolean = checkResults.every(({ checked }: FileIntegrityResult) => checked)

        return { areValid, checkResults }
    }

    async initHashesSigning(
        userIdentifier: string,
        mobileUid: string,
        signAlgo: SignAlgo,
        signType?: DiiaIdSignType,
        noSigningTime?: boolean,
        noContentTimestamp?: boolean,
        optionalDiiaId?: DiiaIdModel,
    ): Promise<boolean> {
        const diiaId = optionalDiiaId || (await this.getDiiaId(userIdentifier, mobileUid, signAlgo))
        if (!diiaId) {
            throw new ModelNotFoundError(diiaIdModel.modelName, userIdentifier)
        }

        const { identifier, certificateSerialNumber, registryUserIdentifier } = diiaId

        if (!registryUserIdentifier || !certificateSerialNumber) {
            throw new InternalServerError('Missing registryUserIdentifier and certificateSerialNumber')
        }

        const signHashesInitRequest: DiiaIdSignHashesInitRequest = {
            uuid: uuid(),
            request: {
                identifier,
                certificateSerialNumber,
                registryUserIdentifier,
                signType,
                noSigningTime,
                noContentTimestamp,
            },
        }

        return await this.externalEventBus.publish(
            ExternalEvent.DiiaIdSignHashesInit,
            <Record<string, unknown>>(<unknown>signHashesInitRequest),
        )
    }

    async softDeleteDiiaIdByIdentityDocument(userIdentifier: string, mobileUid: string, documentType: DocumentType): Promise<void> {
        const isIdentityDocument: boolean = Object.values(<DocumentType>(<unknown>IdentityDocumentType)).includes(documentType)
        if (!isIdentityDocument) {
            return
        }

        const query: FilterQuery<DiiaIdModel> = {
            mobileUid,
            isDeleted: false,
            identityDocumentType: documentType,
        }

        await this.softDeleteIdentifiers(userIdentifier, query)
    }

    private async getDiiaId(userIdentifier: string, mobileUid: string, signAlgo: SignAlgo): Promise<DiiaIdModel | null> {
        return await diiaIdModel.findOne({ mobileUid, userIdentifier, isDeleted: false, signAlgo })
    }

    private async getAvailableDiiaIds(userIdentifier: string, mobileUid: string): Promise<DiiaIdModel[]> {
        const nullableDiiaIds = await Promise.all(
            Object.values(SignAlgo).map(async (signAlgo) => {
                await this.checkIfCreationExpiredAndSoftDelete(userIdentifier, signAlgo)

                return await this.getDiiaId(userIdentifier, mobileUid, signAlgo)
            }),
        )

        return nullableDiiaIds.filter((diiaId): diiaId is DiiaIdModel => Boolean(diiaId))
    }

    private generateIdentityDocument(identityDocument: IdentityDocument, user: AppUser): Promise<string> {
        const { identityType } = identityDocument

        switch (identityType) {
            case IdentityDocumentType.ResidencePermitPermanent:
            case IdentityDocumentType.ResidencePermitTemporary: {
                return this.superGenService.generateResidencePermit(user, identityDocument)
            }
            case IdentityDocumentType.ForeignPassport:
            case IdentityDocumentType.InternalPassport: {
                return this.superGenService.generatePassport(user, identityDocument)
            }
            case IdentityDocumentType.EResidentPassport: {
                return this.superGenService.generateEResidentPassport(user, identityDocument)
            }
            default: {
                throw new TypeError(`Unhandled identity type: ${identityType}`)
            }
        }
    }

    private generateDiiaIdAgreement(identityDocument: IdentityDocument, user: AppUser, signAlgo: SignAlgo): Promise<string> {
        const { sessionType } = user
        switch (sessionType) {
            case SessionType.CabinetUser:
            case SessionType.User: {
                const { identityType, docNumber, sign } = identityDocument
                const fullName = this.getFullName(identityDocument, signAlgo)

                const agreementGenerationData: DiiaIdAgreementGenerationData = {
                    identityType,
                    docNumber,
                    sign,
                    ...fullName,
                }

                return this.superGenService.generateDiiaIdAgreement(user, agreementGenerationData)
            }
            case SessionType.EResident: {
                return this.superGenService.generateEResidentDiiaIdAgreement(user, {
                    docNumber: identityDocument.docNumber,
                    sign: identityDocument.sign,
                    lastNameUA: identityDocument.lastNameUA,
                    middleNameUA: identityDocument.middleNameUA || '',
                    firstNameUA: identityDocument.firstNameUA,
                    lastName: identityDocument.lastNameEN,
                    firstName: identityDocument.firstNameEN,
                    middleName: '',
                })
            }
            default: {
                const unhandledSessionType: never = sessionType

                throw new TypeError(`Unhandled session type: ${unhandledSessionType}`)
            }
        }
    }

    private getFullName(
        identityDocument: IdentityDocument,
        signAlgo: SignAlgo,
    ): { lastName: string; firstName: string; middleName: string } {
        switch (signAlgo) {
            case SignAlgo.DSTU: {
                const { firstNameUA, lastNameUA, middleNameUA } = identityDocument

                return {
                    firstName: firstNameUA,
                    lastName: lastNameUA,
                    middleName: middleNameUA || '',
                }
            }
            case SignAlgo.ECDSA: {
                const { firstNameEN, lastNameEN } = identityDocument

                return {
                    firstName: firstNameEN,
                    lastName: lastNameEN,
                    middleName: '',
                }
            }
            default: {
                const unhandledSignAlgoType: never = signAlgo

                throw new TypeError(`Unhandled sign algo type: ${unhandledSignAlgoType}`)
            }
        }
    }

    private mapUserInfo(identityDocument: IdentityDocument, user: AppUser, signAlgo: SignAlgo): DiiaIdCertificateUserInfo {
        if (user.sessionType === SessionType.EResident) {
            return this.mapEResidentInfo(identityDocument, user, signAlgo)
        }

        const fullName = this.getFullName(identityDocument, signAlgo)

        const userInfo: DiiaIdCertificateUserInfo = {
            countryCode: DiiaIdCertificateCountryCode.Ua,
            rnokpp: user.itn,
            unzr: identityDocument.recordNumber,
            ...fullName,
        }

        return userInfo
    }

    private mapEResidentInfo(identityDocument: IdentityDocument, user: AppUser, signAlgo: SignAlgo): DiiaIdCertificateUserInfo {
        if (signAlgo === SignAlgo.DSTU) {
            const userInfo: DiiaIdCertificateUserInfo = {
                countryCode: identityDocument.residenceCountryCodeAlpha2 || '',
                rnokpp: user.itn,
                unzr: identityDocument.recordNumber,
                location: identityDocument.residenceCityUA,
                firstName: identityDocument.firstNameUA,
                lastName: identityDocument.lastNameUA,
                middleName: identityDocument.middleNameUA || '',
            }

            if (!this.envService.isProd()) {
                userInfo.firstName = `Тестовий${userInfo.firstName}`
                userInfo.lastName = `Тестовий${userInfo.lastName}`
                userInfo.middleName = userInfo.middleName ? `Тестовий${userInfo.middleName}` : userInfo.middleName
            }

            return userInfo
        } else if (signAlgo === SignAlgo.ECDSA) {
            const userInfo: DiiaIdCertificateUserInfo = {
                countryCode: identityDocument.residenceCountryCodeAlpha2 || '',
                rnokpp: user.itn,
                unzr: identityDocument.recordNumber,
                location: identityDocument.residenceCityEN,
                firstName: identityDocument.firstNameEN,
                lastName: identityDocument.lastNameEN,
                middleName: '',
            }

            if (!this.envService.isProd()) {
                userInfo.firstName = `Test${userInfo.firstName}`
                userInfo.lastName = `Test${userInfo.lastName}`
            }

            return userInfo
        }

        throw new InternalServerError(`Unexpected signAlgo ${signAlgo}`)
    }

    private async initCreateCertificate(
        diiaIdentifier: string,
        identityDocument: IdentityDocument,
        user: AppUser,
        signAlgo: SignAlgo,
        identityDocumentPdfParam?: string,
    ): Promise<boolean> {
        const [agreement, identityDocumentPdf] = await Promise.all([
            this.generateDiiaIdAgreement(identityDocument, user, signAlgo),
            identityDocumentPdfParam || this.generateIdentityDocument(identityDocument, user),
        ])

        const message: DiiaIdCreateCertificateMessage = {
            identifier: diiaIdentifier,
            userInfo: this.mapUserInfo(identityDocument, user, signAlgo),
            signAlgo,
            files: {
                agreement,
                passport: identityDocumentPdf,
            },
        }

        const requestId = uuid()

        this.logger.info('Init create certificate', { requestId, identifier: diiaIdentifier })

        return await this.externalEventBus.publish(ExternalEvent.DiiaIdCertificateCreate, {
            uuid: requestId,
            request: message,
        })
    }

    private async checkIfCreationExpiredAndSoftDelete(userIdentifier: string, signAlgo?: SignAlgo): Promise<void> {
        const query: FilterQuery<DiiaIdModel> = {
            userIdentifier,
            isDeleted: false,
            creationDate: { $exists: false },
            expirationDate: { $exists: false },
            createdAt: { $lt: new Date(Date.now() - this.defaultExpirationOnCreationMs) },
        }

        if (signAlgo) {
            query.signAlgo = signAlgo
        }

        const diiaIdsWithExpiredCreation: DiiaIdModel[] = await diiaIdModel.find(query)
        const softRemovalPromises: Promise<boolean>[] = diiaIdsWithExpiredCreation.map((diiaId) =>
            this.softDeleteIdentifiers(userIdentifier, { mobileUid: diiaId.mobileUid, signAlgo: diiaId.signAlgo }),
        )

        await Promise.all(softRemovalPromises)
    }

    private isDiiaIdActive(diiaId: DiiaIdModel | null): boolean {
        return Boolean(diiaId?.creationDate && diiaId?.expirationDate)
    }

    private async getIdentityDocument(user: AppUser, unavailableProcessCode: ProcessCode): Promise<IdentityDocument | never> {
        try {
            return await this.documentsService.getIdentityDocument(user)
        } catch (e) {
            return utils.handleError(e, (err) => {
                const code = err.getCode()
                const processCode = code === HttpStatusCode.NOT_FOUND ? ProcessCode.NoRequiredDocument : unavailableProcessCode

                throw new ApiError('Identity document not received', code, {}, processCode)
            })
        }
    }
}
