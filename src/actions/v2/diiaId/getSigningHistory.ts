import { AppAction } from '@diia-inhouse/diia-app'

import { I18nService } from '@diia-inhouse/i18n'
import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import DiiaIdService from '@services/diiaId'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v2/diiaId/getSigningHistory'
import { Locales } from '@interfaces/locales'
import { AttentionMessageParameterType } from '@interfaces/services'
import { DiiaIdIdentifier } from '@interfaces/services/diiaId'

export default class GetDiiaIdSigningHistoryAction implements AppAction {
    constructor(
        private readonly diiaIdService: DiiaIdService,

        private readonly i18n: I18nService<Locales>,
    ) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V2

    readonly name: string = 'getDiiaIdSigningHistory'

    readonly validationRules: ValidationSchema = {
        skip: { type: 'number', convert: true, optional: true },
        limit: { type: 'number', convert: true, optional: true },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            session: {
                user: { identifier: userIdentifier },
            },
            headers: { mobileUid },
        } = args

        const [identifiers, signingRequests, total]: [DiiaIdIdentifier[], unknown[], number] = await Promise.all([
            this.diiaIdService.getIdentifierAvailability(userIdentifier, mobileUid),
            [],
            0,
        ])

        const isAvailable = identifiers.length > 0
        if (isAvailable) {
            return {
                isAvailable,
                signingRequests,
                total,
            }
        }

        return {
            isAvailable,
            text: this.i18n.get('diiaId.getIdentifier.v2.notActivated.description'),
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
            signingRequests,
            total,
        }
    }
}
