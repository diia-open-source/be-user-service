import { MoleculerService } from '@diia-inhouse/diia-app'

import { ActionVersion, AppUser } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import { DiiaIdAgreementGenerationData, EResidentDiiaIdAgreementGenerationData } from '@interfaces/services/diiaId'
import { IdentityDocument } from '@interfaces/services/documents'
import { GenerationResult } from '@interfaces/services/superGen'

export default class SuperGenService {
    private readonly serviceName = 'SuperGen'

    constructor(private readonly moleculer: MoleculerService) {}

    async generateDiiaIdAgreement(user: AppUser, document: DiiaIdAgreementGenerationData): Promise<string> {
        const result: GenerationResult = await this.moleculer.act(
            this.serviceName,
            {
                name: 'generateDiiaIdAgreement',
                actionVersion: ActionVersion.V2,
            },
            {
                params: { document },
                session: utils.makeSession(user),
            },
        )

        return result.file
    }

    async generateEResidentDiiaIdAgreement(user: AppUser, document: EResidentDiiaIdAgreementGenerationData): Promise<string> {
        const result: GenerationResult = await this.moleculer.act(
            this.serviceName,
            {
                name: 'generateEResidentDiiaIdAgreement',
                actionVersion: ActionVersion.V2,
            },
            {
                params: { document },
                session: utils.makeSession(user),
            },
        )

        return result.file
    }

    async generatePassport(user: AppUser, passport: IdentityDocument): Promise<string> {
        const result: GenerationResult = await this.moleculer.act(
            this.serviceName,
            {
                name: 'generatePassport',
                actionVersion: ActionVersion.V1,
            },
            {
                params: { passport },
                session: utils.makeSession(user),
            },
        )

        return result.file
    }

    async generateEResidentPassport(user: AppUser, passport: IdentityDocument): Promise<string> {
        const result: GenerationResult = await this.moleculer.act(
            this.serviceName,
            {
                name: 'generateEResidentPassport',
                actionVersion: ActionVersion.V1,
            },
            {
                params: { passport },
                session: utils.makeSession(user),
            },
        )

        return result.file
    }

    async generateResidencePermit(user: AppUser, residencePermit: IdentityDocument): Promise<string> {
        const result: GenerationResult = await this.moleculer.act(
            this.serviceName,
            {
                name: 'generateResidencePermit',
                actionVersion: ActionVersion.V1,
            },
            {
                params: { residencePermit },
                session: utils.makeSession(user),
            },
        )

        return result.file
    }
}
