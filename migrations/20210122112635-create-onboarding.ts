/* eslint-disable max-len */
import 'module-alias/register'

import { Db } from 'mongodb'

import { Env } from '@diia-inhouse/env'
import { PlatformType } from '@diia-inhouse/types'

import { Onboarding, OnboardingBoard, OnboardingButtonAction, OnboardingData } from '@interfaces/models/onboarding'

const onboardingCollectionName = 'onboardings'
const newFeaturesCollectionName = 'newfeatures'

const forbiddenEnvs: Env[] = [Env.Prod]

const boards: OnboardingBoard[] = [
    {
        title: 'Державні послуги',
        backgroundColor: '#C5D9E9',
        text: 'Заміна посвідчення водія, сплата податків, шеринг техпаспорту - очікуйте найближчим часом.',
        image: 'https://plan2.diia.gov.ua/assets/img/main/state-presentation.jpg',
        footer: {
            backgroundColor: '#E2ECF4',
            button: {
                label: 'Пропустити',
                action: OnboardingButtonAction.Skip,
            },
        },
    },
    {
        title: 'Сплата штрафів',
        backgroundColor: '#C5D9E9',
        text: 'Сплата штрафів за порушення ПДР.',
        image: 'https://plan2.diia.gov.ua/assets/img/main/state-presentation.jpg',
        footer: {
            backgroundColor: '#E2ECF4',
            button: {
                label: 'Пропустити',
                action: OnboardingButtonAction.Skip,
            },
        },
    },
    {
        title: 'Що ще нового?',
        backgroundColor: '#C5D9E9',
        list: {
            bullet: '•',
            items: [
                {
                    text: 'Додано можливість налаштування порядку відображення документів у головному меню.',
                },
                {
                    text: 'Додано можливість вибору основного документа із кількох документів заданого типу, котрий має відображатися у головному меню.',
                },
                {
                    text: 'Доповнено логіку відображення раніше доданих свідоцтв про народження дітей після виходу та повторної авторизації.',
                },
            ],
        },
        footer: {
            backgroundColor: '#E2ECF4',
            button: {
                label: 'Пропустити',
                action: OnboardingButtonAction.Skip,
            },
        },
    },
]
const onboardingData: OnboardingData = {
    header: {
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D1%81%D0%B5%D1%80%D0%B2%D1%96%D1%81%D1%83_%D0%94%D1%96%D1%8F.svg/1200px-%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D1%81%D0%B5%D1%80%D0%B2%D1%96%D1%81%D1%83_%D0%94%D1%96%D1%8F.svg.png',
    },
    boards,
}

const featuresData: Record<string, unknown> = {
    header: {
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D1%81%D0%B5%D1%80%D0%B2%D1%96%D1%81%D1%83_%D0%94%D1%96%D1%8F.svg/1200px-%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D1%81%D0%B5%D1%80%D0%B2%D1%96%D1%81%D1%83_%D0%94%D1%96%D1%8F.svg.png',
        title: 'Дія',
        subTitle: 'Версія 2.0.16',
    },
    boards,
}

const appVersionByPlatformType: Partial<Record<PlatformType, string>> = {
    [PlatformType.Android]: '2.0.24',
    [PlatformType.Huawei]: '2.0.24',
    [PlatformType.iOS]: '2.0.10',
}

export async function up(db: Db): Promise<void> {
    if (forbiddenEnvs.includes(<Env>process.env.NODE_ENV)) {
        return
    }

    const tasks: Promise<void>[] = Object.keys(appVersionByPlatformType).map(async (platformType) => {
        const onboarding: Onboarding = {
            appVersion: appVersionByPlatformType[<PlatformType>platformType]!,
            platformType: <PlatformType>platformType,
            isVisible: true,
            data: onboardingData,
        }
        const newFeatures: Record<string, unknown> = { ...onboarding, data: featuresData, viewsCount: 1 }

        await Promise.all([
            db.collection(onboardingCollectionName).insertOne(onboarding),
            db.collection(newFeaturesCollectionName).insertOne(newFeatures),
        ])
    })

    await Promise.all(tasks)
}
