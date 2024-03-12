import { v4 as uuid } from 'uuid'

import { AppAction } from '@diia-inhouse/diia-app'

import { IdentifierService } from '@diia-inhouse/crypto'
import { CryptoDocServiceClient, VerifySignExternalRequest } from '@diia-inhouse/diia-crypto-client'
import { AccessDeniedError } from '@diia-inhouse/errors'
import { ActionVersion, Logger, SessionType } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'
import { ValidationSchema } from '@diia-inhouse/validators'

import UserSigningHistoryService from '@services/userSigningHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/diiaId/validateSignedFileHashes'
import { ProcessCode } from '@interfaces/services'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export default class ValidateSignedFileHashesAction implements AppAction {
    constructor(
        private readonly userSigningHistoryService: UserSigningHistoryService,
        private readonly cryptoDocServiceClient: CryptoDocServiceClient,

        private readonly identifier: IdentifierService,
        private readonly logger: Logger,
    ) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'validateSignedFileHashes' // TODO(BACK-0):  should be renamed: validateFileSignatures !!!

    readonly validationRules: ValidationSchema = {
        files: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    name: { type: 'string' },
                    data: { type: 'string' },
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
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { files, publicService, applicationId, documents, recipient },
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid, platformType, platformVersion },
        } = args
        const sessionId: string = this.identifier.createIdentifier(mobileUid)
        const currentDate: Date = new Date()

        try {
            const tasks = files.map(({ data, signature }) => {
                const request: VerifySignExternalRequest = { data, signature }

                return this.cryptoDocServiceClient.docVerifySignExternal(request)
            })

            try {
                await Promise.all(tasks)
            } catch (err) {
                const msg = 'Failed to verify signature'

                this.logger.error(msg, { err })

                throw new AccessDeniedError(msg, {}, ProcessCode.SignedDocumentsIntegrityViolated)
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

            return
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
