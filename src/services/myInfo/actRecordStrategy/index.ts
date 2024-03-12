import { ActRecordRequestType } from '@src/generated'

import ActRecordStrategyChildBirthService from '@services/myInfo/actRecordStrategy/childBirth'
import ActRecordStrategyDivorceService from '@services/myInfo/actRecordStrategy/divorce'
import ActRecordStrategyMarriageService from '@services/myInfo/actRecordStrategy/marriage'
import ActRecordStrategyNameChangeService from '@services/myInfo/actRecordStrategy/nameChange'
import ActRecordStrategyUserBirthService from '@services/myInfo/actRecordStrategy/userBirth'

import { ActRecordStrategyType, DedicatedActRecord } from '@interfaces/services/myInfo'
import { ActRecordStrategy } from '@interfaces/services/myInfo/actRecordStrategy'

export default class ActRecordStrategyService {
    constructor(
        private readonly myInfoActRecordStrategyMarriageService: ActRecordStrategyMarriageService,
        private readonly myInfoActRecordStrategyDivorceService: ActRecordStrategyDivorceService,
        private readonly myInfoActRecordStrategyChildBirthService: ActRecordStrategyChildBirthService,
        private readonly myInfoActRecordStrategyNameChangeService: ActRecordStrategyNameChangeService,
        private readonly myInfoActRecordStrategyUserBirthService: ActRecordStrategyUserBirthService,
    ) {}

    getStrategy(actRecordRequestType: ActRecordStrategyType): ActRecordStrategy {
        const strategiesMap: Record<ActRecordStrategyType, ActRecordStrategy> = {
            [ActRecordRequestType.marriage_record]: this.myInfoActRecordStrategyMarriageService,
            [ActRecordRequestType.divorce_record]: this.myInfoActRecordStrategyDivorceService,
            [ActRecordRequestType.change_name_record]: this.myInfoActRecordStrategyNameChangeService,
            [ActRecordRequestType.birth_certificate]: this.myInfoActRecordStrategyChildBirthService,
            [DedicatedActRecord.UserBirthRecord]: this.myInfoActRecordStrategyUserBirthService,
        }

        return strategiesMap[actRecordRequestType]
    }
}
