import { asClass } from 'awilix'

import { Application, MoleculerService, ServiceContext, ServiceOperator } from '@diia-inhouse/diia-app'

import { EventBus, ExternalEventBus, Queue, ScheduledTask, Task } from '@diia-inhouse/diia-queue'
import { StoreService } from '@diia-inhouse/redis'
import { mockClass } from '@diia-inhouse/test'

import configFactory from '@src/config'

import { TestDeps } from '@tests/interfaces/utils'
import deps from '@tests/utils/deps'

import { AppDeps } from '@interfaces/application'
import { AppConfig } from '@interfaces/config'

export async function getApp(): Promise<ServiceOperator<AppConfig, AppDeps & TestDeps>> {
    const app = new Application<ServiceContext<AppConfig, AppDeps & TestDeps>>('User')

    await app.setConfig(configFactory)

    app.setDeps(deps)

    app.overrideDeps({
        moleculer: asClass(mockClass(MoleculerService)).singleton(),
        queue: asClass(mockClass(Queue)).singleton(),
        scheduledTask: asClass(mockClass(ScheduledTask)).singleton(),
        eventBus: asClass(mockClass(EventBus)).singleton(),
        externalEventBus: asClass(mockClass(ExternalEventBus)).singleton(),
        task: asClass(mockClass(Task)).singleton(),
        store: asClass(mockClass(StoreService)).singleton(),
    })

    return app.initialize()
}
