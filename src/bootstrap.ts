import { Application, ServiceContext } from '@diia-inhouse/diia-app'

import configFactory from '@src/config'
import deps from '@src/deps'

import { AppDeps } from '@interfaces/application'
import { AppConfig } from '@interfaces/config'

export async function bootstrap(serviceName: string): Promise<void> {
    const app = new Application<ServiceContext<AppConfig, AppDeps>>(serviceName)

    await app.setConfig(configFactory)

    await app.setDeps(deps)

    const { start } = await app.initialize()

    await start()
}
