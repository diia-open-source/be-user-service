import { randomUUID as uuid } from 'node:crypto'

import { AppAction } from '@diia-inhouse/diia-app'

import { IdentifierService } from '@diia-inhouse/crypto'
import { AccessDeniedError } from '@diia-inhouse/errors'
import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'
import UserSigningHistoryService from '@services/userSigningHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/validateHashSignatures'
import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export default class ValidateHashSignaturesAction implements AppAction {
    constructor(
        private readonly diiaIdService: DiiaIdService,
        private readonly userSigningHistoryService: UserSigningHistoryService,

        private readonly identifier: IdentifierService,
    ) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'validateHashSignatures'

    readonly validationRules: ValidationSchema = {
        files: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    name: { type: 'string' },
                    hash: { type: 'string' },
                    signature: { type: 'string' },
                },
            },
        },
        publicService: { type: 'string' },
        applicationId: { type: 'string' },
        documents: { type: 'array', items: { type: 'string' } },
        recipient: {
            type: 'object',
            props: {
                name: { type: 'string' },
                address: { type: 'string' },
            },
        },
        returnOriginals: { type: 'boolean', optional: true },
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { files, publicService, applicationId, documents, recipient, returnOriginals, signAlgo },
            headers: { mobileUid, platformType, platformVersion },
            session: {
                user: { identifier: userIdentifier },
            },
        } = args
        const sessionId: string = this.identifier.createIdentifier(mobileUid)
        const currentDate: Date = new Date()

        try {
            const { areValid, checkResults } = await this.diiaIdService.areSignedFileHashesValid({
                userIdentifier,
                mobileUid,
                files,
                returnOriginals,
                signAlgo,
            })
            if (!areValid) {
                throw new AccessDeniedError('Documents integrity violated', {}, ProcessCode.SignedDocumentsIntegrityViolated)
            }

            await this.userSigningHistoryService.upsertItem({
                userIdentifier,
                sessionId,
                resourceId: applicationId,
                status: UserHistoryItemStatus.Done,
                platformType,
                platformVersion,
                documents,
                date: currentDate,
                recipient,
                publicService,
                applicationId,
            })

            return { checkResults }
        } catch (err) {
            await utils.handleError(err, async (e) => {
                if (!e.getData()?.processCode) {
                    return
                }

                await this.userSigningHistoryService.upsertItem({
                    userIdentifier,
                    sessionId,
                    resourceId: uuid(),
                    status: UserHistoryItemStatus.Refuse,
                    platformType,
                    platformVersion,
                    documents,
                    date: currentDate,
                    recipient,
                    publicService,
                    applicationId,
                })
            })

            throw err
        }
    }
}
