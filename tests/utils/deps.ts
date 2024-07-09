import { AwilixContainer, BaseDeps, DepsFactoryFn, MoleculerService, asClass, asValue } from '@diia-inhouse/diia-app'

import TestKit, { mockClass } from '@diia-inhouse/test'

import deps from '@src/deps'

import { TestDeps } from '@tests/interfaces/utils'
import { documentsDocServiceClient } from '@tests/mocks/grpc/clients'

import { AppDeps } from '@interfaces/application'
import { AppConfig } from '@interfaces/config'

export default async (
    config: AppConfig,
    baseContainer: AwilixContainer<BaseDeps>,
): ReturnType<DepsFactoryFn<AppConfig, AppDeps & TestDeps>> => {
    return {
        ...(await deps(config, baseContainer)),

        testKit: asClass(TestKit).singleton(),
        moleculer: asClass(mockClass(MoleculerService)).singleton(),
        documentsServiceClient: asValue(documentsDocServiceClient),
    }
}
