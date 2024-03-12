import { AppAction } from '@diia-inhouse/diia-app'

import { BadRequestError } from '@diia-inhouse/errors'
import { ActionVersion, SessionType } from '@diia-inhouse/types'

import OnboardingService from '@services/onboarding'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/userVerification/getFeatures'

export default class GetEResidentFeaturesAction implements AppAction {
    constructor(private readonly onboardingService: OnboardingService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getEResidentFeatures'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            headers: { mobileUid, appVersion, platformType },
        } = args

        if (!mobileUid || !appVersion || !platformType) {
            throw new BadRequestError('Missing mobileUid, appVersion or platformType', { mobileUid, appVersion, platformType })
        }

        return await this.onboardingService.getFeatures(mobileUid, appVersion, platformType, SessionType.EResident)
    }
}
