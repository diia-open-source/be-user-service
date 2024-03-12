/* eslint-disable max-len */
import { Db } from 'mongodb'

import { Onboarding } from '@interfaces/models/onboarding'
import 'module-alias/register'

const onboardingCollectionName = 'onboardings'

export async function up(db: Db): Promise<void> {
    const title = 'Запис до листа очікування вакцинації від COVID-19'

    await db
        .collection<Onboarding>(onboardingCollectionName)
        .updateMany({ 'data.boards.title': title }, { $pull: { 'data.boards': { title } } })
}
