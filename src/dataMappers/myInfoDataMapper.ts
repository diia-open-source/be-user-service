import moment from 'moment'

import { I18nService } from '@diia-inhouse/i18n'
import {
    DSBottomGroupItem,
    DSTopGroupItem,
    DocumentInstance,
    Gender,
    Icon,
    ListItemMlc,
    PublicServiceContextMenuType,
    RelationshipActRecordSubtype,
    UserTokenData,
} from '@diia-inhouse/types'

import { ActRecordRequestType, DefaultImage, GetActRecordsRes, GetFamilyRes, GetMyInfoRes } from '@src/generated'

import { ProcessCode } from '@interfaces/services'
import { ActionType } from '@interfaces/services/myInfo'

export default class MyInfoDataMapper {
    recordTypeToHideDocumentProcessCode: Record<ActRecordRequestType, ProcessCode> = {
        [ActRecordRequestType.marriage_record]: ProcessCode.HideMarriageRecord,
        [ActRecordRequestType.divorce_record]: ProcessCode.HideDivorceRecord,
        [ActRecordRequestType.change_name_record]: ProcessCode.HideNameChangeRecord,
        [ActRecordRequestType.birth_certificate]: ProcessCode.HideChildBirthRecord,
    }

    recordTypeToHiddenDocumentProcessCode: Record<ActRecordRequestType, ProcessCode> = {
        [ActRecordRequestType.marriage_record]: ProcessCode.MarriageRecordHidden,
        [ActRecordRequestType.divorce_record]: ProcessCode.DivorceRecordHidden,
        [ActRecordRequestType.change_name_record]: ProcessCode.NameChangeRecordHidden,
        [ActRecordRequestType.birth_certificate]: ProcessCode.ChildBirthRecordHidden,
    }

    private readonly genderToDefaultImageMap: Record<Gender, DefaultImage> = {
        [Gender.male]: DefaultImage.userMale,
        [Gender.female]: DefaultImage.userFemale,
    }

    private subTypeToRequestType: Record<RelationshipActRecordSubtype, ActRecordRequestType> = {
        [RelationshipActRecordSubtype.marriage]: ActRecordRequestType.marriage_record,
        [RelationshipActRecordSubtype.divorce]: ActRecordRequestType.divorce_record,
    }

    private subTypeToLabelKey: Record<RelationshipActRecordSubtype, string> = {
        [RelationshipActRecordSubtype.marriage]: 'myInfo.records.marriageRecords.listScreen.body.listItemGroupOrg.label',
        [RelationshipActRecordSubtype.divorce]: 'myInfo.records.divorceRecords.listScreen.body.listItemGroupOrg.label',
    }

    private subTypeToDescriptionKey: Record<RelationshipActRecordSubtype, string> = {
        [RelationshipActRecordSubtype.marriage]: 'myInfo.records.marriageRecords.listScreen.body.listItemGroupOrg.description',
        [RelationshipActRecordSubtype.divorce]: 'myInfo.records.divorceRecords.listScreen.body.listItemGroupOrg.description',
    }

    private actRecordsKeyPath: Record<ActRecordRequestType, string> = {
        [ActRecordRequestType.marriage_record]: 'myInfo.records.marriageRecords',
        [ActRecordRequestType.divorce_record]: 'myInfo.records.divorceRecords',
        [ActRecordRequestType.change_name_record]: 'myInfo.records.changeNameRecords',
        [ActRecordRequestType.birth_certificate]: 'myInfo.records.birthCertificates',
    }

    constructor(private readonly i18n: I18nService) {}

    toMyInfoScreen(user: UserTokenData, useDocPhoto: boolean): GetMyInfoRes {
        const { fName, lName, gender } = user

        return {
            topGroup: [],
            body: [
                {
                    userCardMlc: {
                        userPictureAtm: {
                            useDocPhoto,
                            defaultImageCode: this.genderToDefaultImageMap[gender],
                            action: {
                                type: ActionType.ChangeUseDocPhoto,
                            },
                        },
                        label: this.i18n.get('myInfo.profile.mainScreen.body.userCardMlc.label', { firstName: fName, lastName: lName }),
                        description: this.i18n.get('myInfo.profile.mainScreen.body.userCardMlc.description'),
                    },
                },
                {
                    listItemGroupOrg: {
                        items: [
                            {
                                label: this.i18n.get('myInfo.profile.mainScreen.body.listItemGroupOrg.userBirthRecord.label'),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.UserBirthRecord,
                                },
                            },
                            {
                                label: this.i18n.get('myInfo.profile.mainScreen.body.listItemGroupOrg.changeNameRecords.label'),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.ToChangeNameRecords,
                                },
                            },
                            {
                                label: this.i18n.get('myInfo.profile.mainScreen.body.listItemGroupOrg.family.label'),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.Family,
                                },
                            },
                        ],
                    },
                },
            ],
        }
    }

    toFamilyScreen(): GetFamilyRes {
        return {
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc: {
                            label: this.i18n.get('myInfo.family.navigationPanel.navigationPanelMlc.label'),
                            ellipseMenu: [],
                        },
                    },
                },
            ],
            body: [
                {
                    listItemGroupOrg: {
                        items: [
                            {
                                label: this.i18n.get('myInfo.family.recordTypes.body.listItemGroupOrg.marriageRecords.label'),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.MarriageRecord,
                                },
                            },
                            {
                                label: this.i18n.get('myInfo.family.recordTypes.body.listItemGroupOrg.divorceRecords.label'),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.DivorceRecord,
                                },
                            },
                            {
                                label: this.i18n.get('myInfo.family.recordTypes.body.listItemGroupOrg.birthCertificates.label'),
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.BirthCertificate,
                                },
                            },
                        ],
                    },
                },
            ],
        }
    }

    toActRecordsInvalidItnRes(topGroup: DSTopGroupItem[]): GetActRecordsRes {
        return {
            topGroup,
            body: [
                {
                    attentionMessageMlc: {
                        icon: this.i18n.get('myInfo.records.marriageRecords.serviceUnavailable.body.missingTaxpayerCard.icon'),
                        text: this.i18n.get('myInfo.records.marriageRecords.serviceUnavailable.body.missingTaxpayerCard.text'),
                        parameters: [],
                    },
                },
            ],
            bottomGroup: [],
        }
    }

    toActRecordsInvalidAgeRes(topGroup: DSTopGroupItem[]): GetActRecordsRes {
        return {
            topGroup,
            body: [
                {
                    attentionMessageMlc: {
                        icon: this.i18n.get('myInfo.records.marriageRecords.serviceUnavailable.body.ageRestrictions.icon'),
                        text: this.i18n.get('myInfo.records.marriageRecords.serviceUnavailable.body.ageRestrictions.text'),
                        parameters: [],
                    },
                },
            ],
            bottomGroup: [],
        }
    }

    toActRecordsTopGroup(actRecordRequestType: ActRecordRequestType): DSTopGroupItem[] {
        return [
            {
                topGroupOrg: {
                    navigationPanelMlc: {
                        label: this.i18n.get(`${this.actRecordsKeyPath[actRecordRequestType]}.listScreen.body.navigationPanelMlc.label`),
                        ellipseMenu: [
                            {
                                type: PublicServiceContextMenuType.restoreRecords,
                                name: this.i18n.get('myInfo.records.navigationPanel.navigationPanelMlc.ellipseMenu.restoreRecords.name'),
                                code: actRecordRequestType,
                            },
                            {
                                type: PublicServiceContextMenuType.faqCategory,
                                name: this.i18n.get('myInfo.records.navigationPanel.navigationPanelMlc.ellipseMenu.faq.name'),
                                code: 'my_info',
                            },
                        ],
                        iconAtm: {
                            componentId: 'back',
                            code: 'back',
                            accessibilityDescription: 'Кнопка: назад',
                            action: {
                                type: 'back',
                            },
                        },
                    },
                },
            },
        ]
    }

    toActRecordsBottomGroup(subtype: string): DSBottomGroupItem[] {
        return [
            {
                bottomGroupOrg: {
                    componentId: 'bottom_group',
                    btnPrimaryDefaultAtm: {
                        componentId: 'update_data',
                        label: 'Оновити дані',
                        action: {
                            type: ActionType.ForceUpdate,
                            subtype,
                        },
                        actions: [],
                    },
                },
            },
        ]
    }

    toActRecordsEmptyRes(
        topGroup: DSTopGroupItem[],
        bottomGroup: DSBottomGroupItem[],
        actRecordRequestType: ActRecordRequestType,
        withHidden: boolean,
    ): GetActRecordsRes {
        const keyPath = `${this.actRecordsKeyPath[actRecordRequestType]}.stubMessage.body.stubMessageMlc`
        const stubMessageKey = withHidden ? 'noRecordsWithHidden' : 'noRecords'

        return {
            topGroup,
            body: [
                {
                    stubMessageMlc: {
                        icon: this.i18n.get([keyPath, stubMessageKey, 'icon'].join('.')),
                        title: this.i18n.get([keyPath, stubMessageKey, 'title'].join('.')),
                        description: this.i18n.get([keyPath, stubMessageKey, 'description'].join('.')),
                        parameters: [],
                    },
                },
            ],
            bottomGroup,
        }
    }

    toActRecordsRegistryErrorRes(topGroup: DSTopGroupItem[], bottomGroup: DSBottomGroupItem[]): GetActRecordsRes {
        return {
            topGroup,
            body: [],
            bottomGroup,
            processCode: ProcessCode.DracsRegistryError,
        }
    }

    toNameChangeItem(actRecord: DocumentInstance): ListItemMlc {
        const { fullName = '', eventDate: eventDateIso } = actRecord.docData || {}

        const eventDate = moment(eventDateIso).format('DD.MM.YYYY')

        return {
            label: this.i18n.get('myInfo.records.changeNameRecords.listScreen.body.listItemGroupOrg.label', { fullName }),
            description: this.i18n.get('myInfo.records.changeNameRecords.listScreen.body.listItemGroupOrg.description', { eventDate }),
            iconRight: {
                code: Icon.ellipseArrowRight,
            },
            action: {
                type: ActionType.ChangeNameRecord,
                resource: actRecord.id,
            },
        }
    }

    toChildBirthItem(actRecord: DocumentInstance): ListItemMlc {
        const { fullName = '', birthday = 'Не визначено' } = actRecord.docData || {}

        return {
            label: this.i18n.get('myInfo.records.birthCertificates.listScreen.body.listItemGroupOrg.label', {
                childFullName: fullName,
            }),
            description: this.i18n.get('myInfo.records.birthCertificates.listScreen.body.listItemGroupOrg.description', {
                eventDate: birthday,
            }),
            iconRight: {
                code: Icon.ellipseArrowRight,
            },
            action: {
                type: ActionType.BirthCertificate,
                resource: actRecord.id,
            },
        }
    }

    toPartnerItem(actRecord: DocumentInstance): ListItemMlc {
        const { partnerFullName = '', eventDate: eventDateIso, relationshipActRecordSubtype: subtype } = actRecord.docData || {}
        if (!subtype) {
            throw new Error('relationshipDocSubtype is required in docData')
        }

        const eventDate = moment(eventDateIso).format('DD.MM.YYYY')
        const requestType = this.subTypeToRequestType[subtype]

        return {
            label: this.i18n.get(this.subTypeToLabelKey[subtype], { partnerFullName }),
            description: this.i18n.get(this.subTypeToDescriptionKey[subtype], { eventDate }),
            iconRight: {
                code: Icon.ellipseArrowRight,
            },
            action: {
                type: requestType,
                resource: actRecord.id,
            },
        }
    }
}
