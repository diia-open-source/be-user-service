import { asClass } from 'awilix'

import { DepsFactoryFn } from '@diia-inhouse/diia-app'

import TestKit from '@diia-inhouse/test'

import deps from '@src/deps'

import { TestDeps } from '@tests/interfaces/utils'

import { AppDeps } from '@interfaces/application'
import { AppConfig } from '@interfaces/config'

export default (config: AppConfig): ReturnType<DepsFactoryFn<AppConfig, AppDeps & TestDeps>> => {
    return {
        ...deps(config),

        testKit: asClass(TestKit).singleton(),
    }
}
