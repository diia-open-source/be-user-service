import config from '@src/config'

export type AppConfig = Awaited<ReturnType<typeof config>>
