import unregisteredOfficeProfile from '@models/unregisteredOfficeProfile'

import { DiiaOfficeProfile } from '@interfaces/models/userProfile'

export default class UnregisteredOfficeProfile {
    async addUnregisteredProfile(identifier: string, profile: DiiaOfficeProfile): Promise<void> {
        await unregisteredOfficeProfile.deleteOne({
            'profile.profileId': profile.profileId,
            identifier: { $ne: identifier },
        })

        await unregisteredOfficeProfile.updateOne({ identifier }, { profile }, { upsert: true })
    }

    async removeUnregisteredProfile(identifier: string): Promise<void> {
        await unregisteredOfficeProfile.deleteOne({ identifier })
    }

    async getUnregisteredProfile(identifier: string): Promise<DiiaOfficeProfile | undefined> {
        return (await unregisteredOfficeProfile.findOne({ identifier }))?.profile
    }
}
