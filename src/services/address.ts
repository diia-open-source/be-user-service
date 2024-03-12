import { MoleculerService } from '@diia-inhouse/diia-app'

import { ActionVersion } from '@diia-inhouse/types'

export default class AddressService {
    private readonly serviceName = 'Address'

    constructor(private readonly moleculer: MoleculerService) {}

    async findCommunityCodeByKoatuu(koatuu?: string): Promise<string> {
        return await this.moleculer.act(
            this.serviceName,
            { name: 'findCommunityCodeByKoatuu', actionVersion: ActionVersion.V1 },
            { params: { koatuu } },
        )
    }
}
