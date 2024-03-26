import { randomUUID as uuid } from 'node:crypto'

import { AppAction } from '@diia-inhouse/diia-app'

import { IdentifierService } from '@diia-inhouse/crypto'
import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'
import UserSigningHistoryService from '@services/userSigningHistory'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/diiaId/hashFilesToSign'
import { HashedFile } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'
import { UserHistoryItemStatus } from '@interfaces/services/userHistory'

export default class HashFilesToSignAction implements AppAction {
    constructor(
        private readonly diiaIdService: DiiaIdService,
        private readonly userSigningHistoryService: UserSigningHistoryService,

        private readonly identifier: IdentifierService,
    ) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'hashFilesToSign'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        files: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    name: { type: 'string' },
                    file: { type: 'string' },
                    isRequireInternalSign: { type: 'boolean', optional: true },
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
        options: {
            type: 'object',
            optional: true,
            props: {
                signType: { type: 'enum', values: Object.values(DiiaIdSignType).filter(Number.isInteger), optional: true },
                noSigningTime: { type: 'boolean', optional: true },
                noContentTimestamp: { type: 'boolean', optional: true },
            },
        },
        signAlgo: { type: 'string', enum: Object.values(SignAlgo), default: SignAlgo.DSTU },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { files, publicService, applicationId, documents, recipient, options, signAlgo },
            session: { user },
            headers: { mobileUid, platformType, platformVersion },
        } = args
        const { identifier: userIdentifier } = user
        const sessionId: string = this.identifier.createIdentifier(mobileUid)
        const currentDate: Date = new Date()
        const noSigningTime = options?.noSigningTime
        const noContentTimestamp = options?.noContentTimestamp

        try {
            const hashedFiles: HashedFile[] = await this.diiaIdService.hashFilesToSign(user, mobileUid, files, signAlgo, options)

            await this.userSigningHistoryService.upsertItem({
                userIdentifier,
                sessionId,
                resourceId: applicationId,
                status: UserHistoryItemStatus.Processing,
                platformType,
                platformVersion,
                documents,
                date: currentDate,
                recipient,
                publicService,
                applicationId,
                noSigningTime,
                noContentTimestamp,
            })

            return { hashedFiles }
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
                    noSigningTime,
                    noContentTimestamp,
                })
            })

            throw err
        }
    }
}
