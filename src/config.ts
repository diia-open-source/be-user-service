import { BalancingStrategy, MetricsConfig, TransporterConfig } from '@diia-inhouse/diia-app'

import { AuthConfig, IdentifierConfig } from '@diia-inhouse/crypto'
import { AppDbConfig, ReplicaSetNodeConfig } from '@diia-inhouse/db'
import {
    InternalQueueName,
    ListenerOptions,
    QueueConnectionConfig,
    QueueConnectionType,
    ScheduledTaskQueueName,
} from '@diia-inhouse/diia-queue'
import { EnvService } from '@diia-inhouse/env'
import { HealthCheckConfig } from '@diia-inhouse/healthcheck'
import { RedisConfig } from '@diia-inhouse/redis'
import { GenericObject } from '@diia-inhouse/types'

import { ServiceTask } from '@interfaces/tasks'

export default async (envService: EnvService, serviceName: string): Promise<GenericObject> => ({
    isMoleculerEnabled: true,

    transporter: <TransporterConfig>{
        type: envService.getVar('TRANSPORT_TYPE'),
        options: process.env.TRANSPORT_OPTIONS ? envService.getVar('TRANSPORT_OPTIONS', 'object') : {},
    },

    balancing: <BalancingStrategy>{
        strategy: process.env.BALANCING_STRATEGY_NAME,
        strategyOptions: process.env.BALANCING_STRATEGY_OPTIONS ? JSON.parse(process.env.BALANCING_STRATEGY_OPTIONS) : {},
    },

    db: <AppDbConfig>{
        database: process.env.MONGO_DATABASE,
        replicaSet: process.env.MONGO_REPLICA_SET,
        user: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD,
        authSource: process.env.MONGO_AUTH_SOURCE,
        port: envService.getVar('MONGO_PORT', 'number'),
        replicaSetNodes: envService
            .getVar('MONGO_HOSTS', 'string')
            .split(',')
            .map((replicaHost: string): ReplicaSetNodeConfig => ({ replicaHost })),
        readPreference: process.env.MONGO_READ_PREFERENCE,
        indexes: {
            sync: process.env.MONGO_INDEXES_SYNC === 'true',
            exitAfterSync: process.env.MONGO_INDEXES_EXIT_AFTER_SYNC === 'true',
        },
    },

    redis: <RedisConfig>{
        readWrite: envService.getVar('REDIS_READ_WRITE_OPTIONS', 'object'),

        readOnly: envService.getVar('REDIS_READ_ONLY_OPTIONS', 'object'),
    },

    store: <RedisConfig>{
        readWrite: envService.getVar('STORE_READ_WRITE_OPTIONS', 'object'),

        readOnly: envService.getVar('STORE_READ_ONLY_OPTIONS', 'object'),
    },

    rabbit: <QueueConnectionConfig>{
        [QueueConnectionType.Internal]: {
            connection: {
                hostname: process.env.RABBIT_HOST,
                port: process.env.RABBIT_PORT ? envService.getVar('RABBIT_PORT', 'number') : undefined,
                username: process.env.RABBIT_USERNAME,
                password: process.env.RABBIT_PASSWORD,
                heartbeat: process.env.RABBIT_HEARTBEAT ? envService.getVar('RABBIT_HEARTBEAT', 'number') : undefined,
            },
            socketOptions: {
                clientProperties: {
                    applicationName: `${serviceName} Service`,
                },
            },
            reconnectOptions: {
                reconnectEnabled: true,
            },
            listenerOptions: <ListenerOptions>{
                prefetchCount: process.env.RABBIT_QUEUE_PREFETCH_COUNT ? envService.getVar('RABBIT_QUEUE_PREFETCH_COUNT', 'number') : 10,
            },
            queueName: InternalQueueName.QueueUser,
            scheduledTaskQueueName: ScheduledTaskQueueName.ScheduledTasksQueueUser,
        },
        [QueueConnectionType.External]: {
            connection: {
                hostname: process.env.EXTERNAL_RABBIT_HOST,
                port: process.env.EXTERNAL_RABBIT_PORT ? envService.getVar('EXTERNAL_RABBIT_PORT', 'number') : undefined,
                username: process.env.EXTERNAL_RABBIT_USERNAME,
                password: process.env.EXTERNAL_RABBIT_PASSWORD,
                heartbeat: process.env.EXTERNAL_RABBIT_HEARTBEAT ? envService.getVar('EXTERNAL_RABBIT_HEARTBEAT', 'number') : undefined,
            },
            socketOptions: {
                clientProperties: {
                    applicationName: `${serviceName} Service`,
                },
            },
            reconnectOptions: {
                reconnectEnabled: true,
            },
            listenerOptions: <ListenerOptions>{
                prefetchCount: process.env.EXTERNAL_RABBIT_QUEUE_PREFETCH_COUNT
                    ? envService.getVar('EXTERNAL_RABBIT_QUEUE_PREFETCH_COUNT', 'number')
                    : 1,
            },
            custom: {
                responseRoutingKeyPrefix: process.env.EXTERNAL_RABBIT_CUSTOM_RESPONSE_ROUTING_KEY_PREFIX,
            },
            assertExchanges: process.env.EXTERNAL_RABBIT_ASSERT_EXCHANGES === 'true',
        },
    },

    healthCheck: <HealthCheckConfig>{
        isEnabled: envService.getVar('HEALTH_CHECK_IS_ENABLED', 'boolean'),
        port: process.env.HEALTH_CHECK_IS_PORT ? envService.getVar('HEALTH_CHECK_IS_PORT', 'number') : 3000,
    },

    grpc: {
        notificationServiceAddress: envService.getVar('GRPC_NOTIFICATION_SERVICE_ADDRESS', 'string'),
        authServiceAddress: envService.getVar('GRPC_AUTH_SERVICE_ADDRESS', 'string'),
        cryptoDocServiceAddress: envService.getVar('GRPC_CRYPTO_DOC_SERVICE_ADDRESS', 'string'),
    },

    metrics: <MetricsConfig>{
        moleculer: {
            prometheus: {
                isEnabled: envService.getVar('METRICS_MOLECULER_PROMETHEUS_IS_ENABLED', 'boolean', true),
                port: envService.getVar('METRICS_MOLECULER_PROMETHEUS_PORT', 'number', 3031),
                path: envService.getVar('METRICS_MOLECULER_PROMETHEUS_PATH', 'string', '/metrics'),
            },
        },
        custom: {
            disabled: envService.getVar('METRICS_CUSTOM_DISABLED', 'boolean', false),
            port: envService.getVar('METRICS_CUSTOM_PORT', 'number', 3030),
            moleculer: {
                disabled: envService.getVar('METRICS_CUSTOM_MOLECULER_DISABLED', 'boolean', false),
                port: envService.getVar('METRICS_CUSTOM_MOLECULER_PORT', 'number', 3031),
                path: envService.getVar('METRICS_CUSTOM_MOLECULER_PATH', 'string', '/metrics'),
            },
            disableDefaultMetrics: envService.getVar('METRICS_CUSTOM_DISABLE_DEFAULT_METRICS', 'boolean', false),
            defaultLabels: envService.getVar('METRICS_CUSTOM_DEFAULT_LABELS', 'object', {}),
        },
    },

    app: {
        integrationPointsTimeout: process.env.INTEGRATION_TIMEOUT_IN_MSEC
            ? envService.getVar('INTEGRATION_TIMEOUT_IN_MSEC', 'number')
            : 10 * 1000,
    },

    identifier: <IdentifierConfig>{
        salt: process.env.SALT,
    },

    hashBytes: process.env.HASH_BYTES ? envService.getVar('HASH_BYTES', 'number') : 10,

    auth: <AuthConfig>{
        jwt: {
            tokenVerifyOptions: {
                algorithms: ['RS256'],
                ignoreExpiration: false,
            },
        },
        jwk: process.env.JWE_SECRET_DATA_JWK,
    },

    tasks: {
        [ServiceTask.CREATE_NOTIFICATIONS_BATCHES]: {
            notificationsBatchSize: process.env.CREATE_NOTIFICATIONS_BATCHES_TASK_NOTIFICATIONS_BATCH_SIZE
                ? envService.getVar('CREATE_NOTIFICATIONS_BATCHES_TASK_NOTIFICATIONS_BATCH_SIZE', 'number')
                : 500,
        },
    },

    faceReco: {
        featurePointsLength: process.env.FACE_RECO_FEATURE_POINTS_LENGTH
            ? envService.getVar('FACE_RECO_FEATURE_POINTS_LENGTH', 'number')
            : 192,
    },

    otp: {
        expiration: process.env.OTP_EXPIRATION ? envService.getVar('OTP_EXPIRATION', 'number') : 86400000,
        perDay: process.env.OTP_PER_DAY ? envService.getVar('OTP_PER_DAY', 'number') : 3,
        verifyAttempts: process.env.OTP_VERIFY_ATTEMPTS ? envService.getVar('OTP_VERIFY_ATTEMPTS', 'number') : 3,
    },

    subscription: {
        debtsSalt: process.env.SUBSCRIPTION_DEBTS_SALT,
    },

    ubch: {
        isEnabled: envService.getVar('UBCH_IS_ENABLED', 'boolean', false),
        host: envService.getVar('UBCH_HOST', 'string', ''),
        login: envService.getVar('UBCH_LOGIN', 'string', ''),
        password: envService.getVar('UBCH_PASSWORD', 'string', ''),
        authPath: envService.getVar('UBCH_AUTH_PATH', 'string', ''),
        subscribePath: envService.getVar('UBCH_SUBSCRIBE_PATH', 'string', ''),
        unsubscribePath: envService.getVar('UBCH_UNSUBSCRIBE_PATH', 'string', ''),
        staticSessid: envService.getVar('UBCH_STATIC_SESS_ID', 'string', ''),
    },

    notifications: {
        isEnabled: envService.getVar('NOTIFICATION_IS_ENABLED', 'boolean'),
        targetBatchSize: process.env.NOTIFICATION_TARGET_BATCH_SIZE ? envService.getVar('NOTIFICATION_TARGET_BATCH_SIZE', 'number') : 1000,
    },

    profileFeatures: {
        isEnabled: envService.getVar('PROFILE_FEATURES_ENABLED', 'boolean'),
    },
})
