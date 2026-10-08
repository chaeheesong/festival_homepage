// Application form content, ported from yongyeon-application-forms.html

/**
 * 'name': Korean/English letters only. 'tel': digits only, auto-hyphenated.
 * 'docs': the program's `docs` rows as a table.
 * 'number': digits only; the extra is the unit shown after the box and stored with it (e.g. '분' → "8분").
 */
export type FieldType = 'text' | 'name' | 'tel' | 'number' | 'choice' | 'select' | 'area' | 'file' | 'video' | 'check' | 'rules' | 'docs'

/** Contact for applicants: video submissions by email and general inquiries */
export const CONTACT_EMAIL = 'jms7564@hanmail.net'
export const CONTACT_TEL = '064)900-4085'
export const VIDEO_EMAIL = CONTACT_EMAIL

/** [key, label, type, placeholder or options/rules] */
export type FieldDef = [key: string, label: string, type: FieldType, extra?: string | string[]]

export type FormValues = Record<string, string | boolean | undefined>

type Table = {
  title: string
  lead?: [string, string][]
  /** [item, description, score/amount] */
  rows: [string, string, string][]
  total?: [string, string]
}

export type Program = {
  name: string
  sub: string
  cap: string
  /** Shows the "may close early" note above the submit button */
  early?: boolean
  /** [label, value, note?] — a "\n" in the value starts a new line */
  info: [string, string, string?][]
  notice?: string
  /** [title, description] */
  steps?: [string, string][]
  /** Recruitment timeline, shown as its own "일정" box above 참가방법 */
  schedule?: [string, string][]
  tables?: Table[]
  /** Ask for companion names based on the headcount */
  mates?: boolean
  req: FieldDef[]
  opt?: FieldDef[]
  attach?: FieldDef[]
  /** Whether guardian details are needed for the current answers */
  minor?: (v: FormValues) => boolean
  guardNote?: string
  when: string
  /**
   * Headcount limit enforced by the database (see admin/3-walk-capacity.sql):
   * `rpc` returns seats left per option of `groupField`; `countField` is the party size
   * (without one, each application takes one seat, e.g. one team)
   */
  capacity?: { rpc: string; groupField?: string; countField?: string }
  /** Message shown instead of the form once every seat is taken */
  fullNote?: string
  /** Personal data collected by this form, listed in the privacy consent (item 3) */
  privacyItems: string
  /** Documents to send by email, shown as a table where the 'docs' field sits: [document, note, required?] */
  docs?: [document: string, note: string, need: string][]
  /** Fields shown only while the predicate holds, by field key (hidden answers are not submitted) */
  showIf?: Record<string, (v: FormValues) => boolean>
  /** Own recruitment period, when it differs from APPLY_DEADLINE / APPLY_PERIOD_LABEL */
  period?: { deadline: Date; label: string }
  /** Light-colored notes shown next to field labels, by field key */
  hints?: Record<string, string>
  /** Place shown in the done-screen summary (default: 메인 무대) */
  where?: string
  doneNote: string
}

/** Applications close at this moment (KST); forms and cards switch to "마감" after it */
/** Applications run through the whole of Oct 13 and close at midnight (KST) */
export const APPLY_DEADLINE = new Date('2026-10-14T00:00:00+09:00')
export const APPLY_PERIOD_LABEL = '10월 1일 ~ 10월 13일'

export function isApplyClosed(p?: Program, now = new Date()) {
  return now.getTime() >= (p?.period?.deadline ?? APPLY_DEADLINE).getTime()
}

export function applyPeriodLabel(p?: Program) {
  return p?.period?.label ?? APPLY_PERIOD_LABEL
}

/** Consent terms shown under each checkbox on every application form: [label, text, sub-line?] */
export type ConsentTerm = [label: string, text: string, sub?: string]

export const PRIVACY_TERMS: ConsentTerm[] = [
  ['제공받는 자', '지방자치단체 등 관련 단체'],
  ['제공받는 자의 이용목적', '신청접수, 운영 및 안전관리 목적'],
  ['제공하는 개인정보 항목', ''], // filled per program from Program.privacyItems
  ['제공받는 자의 개인정보 보유 및 이용기간', '1년'],
  [
    '동의 거부 권리 사실 및 불이익 내용',
    '개인정보 수집·이용에 관한 동의는 거부할 수 있으며, 동의하지 않으시는 경우 신청 체결이 불가하며 사업 수행에 제한이 있을 수 있다.',
  ],
]
export const PHOTO_TERMS: ConsentTerm[] = [
  ['개인정보제공', '사진·영상촬영 및 홍보 활용 동의'],
]

/** Shared recruitment timeline for the performance programs (예술의 물결, 찾아가는 버스킹, 환호의 물결) */
const RECRUIT_SCHEDULE: [string, string][] = [
  ['참가팀 공개모집', '10월 1일 ~ 13일'],
  ['온라인 심사', '10월 16일'],
  ['선정팀 발표', '10월 19일'],
  ['공연자료 및 장비 요청 마감', '10월 21일'],
]

const COUNT_1_10 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

const COUNT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '기타']
const AGES = ['10대 미만', '10대', '20대', '30대', '40대', '50대', '60대 이상']
const TYPE4 = ['개인', '가족', '친구', '단체']

export const GUARDIAN_FIELDS: FieldDef[] = [
  ['gname', '보호자 성명', 'name', '보호자 성명'],
  ['gtel', '보호자 연락처', 'tel', '010-0000-0000'],
  ['gagree', '보호자로서 참가에 동의합니다', 'check'],
]

/** Recruitment period for the vendor programs (플리마켓, 푸드트럭): Oct 8 through the whole of Oct 15 */
const VENDOR_PERIOD = { deadline: new Date('2026-10-16T00:00:00+09:00'), label: '10월 8일 ~ 10월 15일' }

const VENDOR_INFO: [string, string][] = [
  ['운영 일시', '2026. 10. 31.(토) 11:00~21:00'],
  ['모집기간', '10. 8.(목) ~ 10. 15.(목)'],
]

/** 플리마켓 및 푸드트럭 참가 운영수칙 준수 서약서 */
const VENDOR_PLEDGE: FieldDef[] = [
  [
    'pledgeRules',
    '참가 운영수칙 준수 서약서',
    'rules',
    [
      '행사 운영시간을 준수하며, 주최·주관 측이 지정한 장소에서만 영업하겠습니다.',
      '신청서에 기재한 판매품목 및 메뉴를 임의로 변경하지 않겠습니다.',
      '판매가격을 소비자가 쉽게 확인할 수 있도록 표시하겠습니다.',
      '행사장 내 안전·위생·청결을 유지하겠습니다.',
      '무단 양도, 대리 운영 및 승인되지 않은 판매행위를 하지 않겠습니다.',
      '화기·전기·가스 사용 시 안전수칙과 관계 법령을 준수하겠습니다.',
      '발생한 쓰레기와 폐기물은 지정된 방법으로 처리하겠습니다.',
      '주최·주관 측의 정당한 현장 운영 및 안전관리 지침에 협조하겠습니다.',
      '허위서류 제출, 운영수칙 위반 등 참가자 귀책사유가 발생한 경우 행사 운영규정에 따른 조치를 수용하겠습니다.',
    ],
  ],
  ['pledge', '위 내용을 충분히 숙지하였으며 이를 준수할 것을 서약합니다', 'check'],
]

export const PROGRAMS = {
  walk: {
    name: '용의 산책',
    privacyItems: '성명, 연락처, 거주지역, 참가인원, 비상연락처, 희망 행렬 노선',
    sub: '용띠들 모여라 · 퍼레이드 참가자 모집',
    cap: '선착순 60명',
    early: true,
    info: [
      ['일시', '2026. 10. 31.(토) 오전 10:00 ~ 11:00', '※ 오전 9시 50분까지 해당 동사무소에 도착해 인원 체크를 합니다.'],
      ['장소', '용담1동 동사무소 또는 용담2동 동사무소'],
      ['참가대상', '누구나 (어린이~성인·가족 가능)'],
      ['참가자', '기념품 증정 (보조배터리)'],
      ['모집인원', '용담1동 30명 / 용담2동 30명'],
    ],
    req: [
      ['name', '성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['area', '거주지역', 'choice', ['용담1동', '용담2동', '제주시 기타', '도외·관광객']],
      ['count', '참가인원 (본인 포함)', 'select', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']],
      ['type', '참가구분', 'choice', ['개인', '가족', '단체']],
      ['sos', '비상연락처', 'tel', '010-0000-0000'],
      ['line', '희망 행렬 노선', 'choice', ['용담1동', '용담2동']],
    ],
    capacity: { rpc: 'walk_remaining', groupField: 'line', countField: 'count' },
    when: '2026. 10. 31.(토) 오전 10:00 ~ 11:00',
    where: '용담1동 동사무소 또는 용담2동 동사무소',
    doneNote: '오전 9시 50분까지 해당 동사무소에 도착해 주세요.',
  },
  stamp: {
    name: '찾아라 드래곤볼',
    privacyItems: '성명, 연락처, 참가인원, 거주지역, 동반 참가자 이름',
    sub: '용의 길 스탬프 투어 참가자 모집',
    cap: '선착순 150명',
    early: true,
    info: [
      ['운영시간', '2026. 10. 31.(토) 11:00~17:30'],
      ['마감', '마지막 출발 15:00 / 완주 확인 17:30'],
      ['참가대상', '누구나 (어린이·청소년·가족·관광객)'],
      ['참가비', '무료 · 완주 시 기념품 (용 키링, 드래곤볼 키링)', '※ 기념품은 준비수량에 따라 조기 소진될 수 있습니다.'],
    ],
    notice: '온라인 사전접수는 선착순 150명까지 받습니다. 마감 후에는 행사 당일 운영본부에서 현장 신청해 주세요.',
    steps: [
      ['사전접수', ''],
      ['스탬프북 수령', '행사 당일 운영본부에서 신청자 확인 후 스탬프북 수령'],
      ['7대 명소 자유 탐방', '지도를 보고 원하는 순서대로 명소 방문'],
      ['스탬프 미션 수행', '각 장소에서 스탬프 또는 인증미션 완료'],
      ['완주 인증', '7개의 스탬프를 모두 모은 뒤 운영본부 방문'],
      ['완주 기념품 수령', '완주 확인 후 용 키링과 드래곤볼 키링 증정 (준비수량 소진 시 조기 마감)'],
    ],
    mates: true,
    req: [
      ['name', '신청자(대표) 성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['count', '참가인원 (본인 포함 총원)', 'select', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']],
      ['type', '참가형태', 'choice', TYPE4],
      ['area', '거주지역', 'choice', ['용담1동', '용담2동', '제주시 기타', '도외·관광객']],
      ['time', '예상 방문시간대', 'choice', ['11:00~13:00', '13:00~15:00']],
    ],
    when: '2026. 10. 31.(토) 11:00~17:30',
    where: '운영본부 (스탬프북 수령)',
    capacity: { rpc: 'stamp_remaining', countField: 'count' },
    fullNote: '온라인 사전접수(선착순 150명)가 마감되었습니다.\n행사 당일 운영본부에서 현장 신청해 주세요.',
    doneNote: '현장 안내부스에서 스탬프북을 받아 주세요.',
  },
  runner: {
    name: '드래곤 러너',
    privacyItems: '성명, 연락처, 연령대, 참가인원, 비상연락처, 거주지역, 보호자 성명·연락처(미성년자에 한함)',
    sub: '용담의 해안길을 달리는 특별한 러닝 참가자 모집 (자유러닝)',
    cap: '선착순 150명',
    early: true,
    info: [
      ['일시', '2026. 10. 31.(토) 18:30~20:30\n마지막 출발 19:30\n도착 완주 확인 20:30까지'],
      ['집결', '드래곤러너 안내부스'],
      ['참가비', '무료\n완주 기념품 러닝 조끼 지급 (선착순 150명까지)'],
    ],
    notice:
      '완주 기념품(러닝 조끼)은 총 150개 한정으로, 사전접수 참가자에게 우선 지급됩니다. 현장접수도 가능하며, 사전접수 인원이 150명 미만일 경우 잔여 수량에 한해 현장접수 순으로 지급됩니다.\n어린이·청소년 참가 시 보호자 동반이 필수입니다.',
    steps: [
      ['드래곤러너 안내부스 집결', '사전접수자 이름 또는 연락처 확인'],
      ['참가자 등록', '야광팔찌 지급'],
      ['안전안내', '코스, 횡단보도, 반환지점, 유의사항 설명'],
      ['출발', '소규모 그룹으로 순차 출발'],
      ['코스 인증', '용연구름다리 일대 행사장 러너 안내부스 출발 → 어영공원 TURN → 행사장 안내부스 도착'],
      ['완주 확인', '드래곤러너 안내부스에서 완주 확인'],
      ['기념품 지급 (완주 확인 후)', '러닝 조끼 지급'],
    ],
    req: [
      ['name', '참가자 성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['age', '연령대', 'choice', AGES],
      ['type', '참가구분', 'choice', TYPE4],
      ['count', '참가인원 (본인 포함)', 'select', COUNT_1_10],
      ['sos', '비상연락처', 'tel', '010-0000-0000'],
      ['exp', '러닝 경험', 'choice', ['처음', '가끔', '정기적']],
      [
        'rules',
        '안전수칙',
        'rules',
        [
          '신호를 반드시 준수하고 횡단보도로만 건넙니다',
          '보행자와 관람객을 배려하며 앞지르기 시 양해를 구합니다',
          '차도 진입은 금지되며 지정된 코스로만 이동합니다',
          '이어폰 사용을 자제하고 주변 안내에 따릅니다',
          '몸에 이상이 느껴지면 즉시 멈추고 운영요원에게 알립니다',
        ],
      ],
      ['safe', '안전수칙을 확인했습니다', 'check'],
      ['cond', '본인의 컨디션을 확인하고 무리하지 않겠습니다', 'check'],
    ],
    opt: [['area', '거주지역', 'text', '예: 용담2동']],
    minor: (v) => v.age === '10대 미만' || v.age === '10대',
    guardNote: '보호자 동반 필수',
    capacity: { rpc: 'runner_remaining', countField: 'count' },
    fullNote: '온라인 사전접수(선착순 150명)가 마감되었습니다.\n행사 당일 드래곤러너 안내부스에서 현장 신청해 주세요.',
    when: '2026. 10. 31.(토) 18:30~20:30',
    where: '드래곤러너 안내부스',
    doneNote: '당일 안내부스에서 야광팔찌를 받아 주세요.',
  },
  culture: {
    name: '예술의 물결',
    privacyItems: '팀명, 대표자 성명, 연락처, 활동지역, 참가인원, 공연 정보(장르·내용·팀 소개), 공연 영상',
    sub: '용담1·2동 동아리 및 청소년 공연팀 공개 모집',
    cap: '8팀 선정',
    early: true,
    schedule: RECRUIT_SCHEDULE,
    info: [
      ['공연 일시', '2026. 10. 31.(토) 13:00~15:00'],
      ['장소', '메인무대'],
      ['모집분야', '노래·밴드·댄스·난타·악기연주·퍼포먼스 등 (장르 제한 없음)'],
      ['모집규모', '8팀 (용담1동 3팀 / 용담2동 3팀 / 청소년팀 2팀)'],
      ['선정팀 공연비', '1인 100,000원\n2인 200,000원\n3인 이상 300,000원'],
      ['결과발표', '10. 19. 결과 개별 안내'],
    ],
    tables: [
      {
        title: '심사기준 및 배점',
        rows: [
          ['완성도', '', '30점'],
          ['분위기 적합성', '', '25점'],
          ['관객 호응도', '', '20점'],
          ['개성·차별성', '', '15점'],
          ['지역 참여성', '', '10점'],
        ],
      },
    ],
    req: [
      ['team', '팀명', 'text', '팀명'],
      ['name', '대표자 성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['area', '활동지역', 'text', '예: 용담1동'],
      ['count', '참가인원 (출연인원)', 'select', COUNT],
      ['dur', '공연시간 (팀당 약 10분 내)', 'number', '분'],
      ['genre', '공연장르', 'choice', ['노래', '밴드', '댄스', '난타', '악기연주', '퍼포먼스', '기타']],
      ['content', '공연내용 (곡명·소개)', 'area', '곡명과 공연 구성을 적어 주세요'],
      ['intro', '팀(본인) 소개 (100~200자)', 'area', '팀(본인)을 소개해 주세요'],
    ],
    attach: [['video', '공연영상 링크 (1~3분)', 'video', 'https://']],
    when: '2026. 10. 31.(토) 13:00~15:00',
    doneNote: '서류 심사 후 선정 결과를 개별 연락드립니다.',
  },
  busking: {
    name: '찾아가는 버스킹',
    privacyItems: '팀명, 대표자 성명, 연락처, 활동지역, 참가인원, 공연 정보(장르·내용·팀 소개), 공연 영상',
    sub: '2026 용담용연 음악회·문화제의 시작을 함께할 버스킹 공연팀 공개 모집',
    cap: '총 6팀',
    info: [
      ['일정', '10. 23.(금) 18:00~19:00\n함스치킨 앞 · 3팀\n10. 24.(토) 18:00~19:00\n아재맥주 앞 · 3팀'],
      ['모집대상', '제주 지역에서 활동하는 개인 및 단체 공연팀'],
      ['모집분야', '보컬, 어쿠스틱, 밴드, 국악, 기악 등 다양한 장르 (3인 이하)'],
      ['모집규모', '총 6팀'],
      ['공연시간', '팀당 약 20분'],
      ['결과발표', '10. 19. 결과 개별 안내'],
      ['선정팀 공연비', '200,000원'],
    ],
    notice: '공연 장소 및 세부 출연 시간은 선정 후 안내합니다.\n사전 버스킹은 경연이 아닌 축제 홍보 공연으로 진행됩니다.',
    schedule: RECRUIT_SCHEDULE,
    tables: [
      {
        title: '심사 기준',
        rows: [
          ['공연 완성도', '', '40점'],
          ['독창성', '', '20점'],
          ['대중성', '', '20점'],
          ['축제 적합성', '', '20점'],
        ],
      },
    ],
    req: [
      ['team', '팀명', 'text', '팀명'],
      ['name', '대표자 성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['area', '활동지역', 'text', '예: 제주시'],
      ['count', '참가인원 (3인 이하)', 'select', ['1', '2', '3']],
      ['genre', '공연장르', 'choice', ['보컬', '어쿠스틱', '밴드', '국악', '기악', '기타']],
      ['content', '공연내용 (곡명·공연 소개)', 'area', '곡명과 공연 구성을 적어 주세요'],
      ['video', '공연영상 (온라인 심사용)', 'video', 'https://'],
      ['intro', '팀 소개', 'area', '팀을 소개해 주세요'],
    ],
    when: '10. 23.(금) · 10. 24.(토) 18:00~19:00',
    where: '선정 후 개별 안내',
    doneNote: '10. 19. 온라인 심사 결과를 개별 연락드립니다.',
  },
  song: {
    name: '환호의 물결',
    privacyItems: '팀명, 대표자 성명, 연락처, 참가인원, 연령대, 거주지역, 예선 영상, 참가자 소개·활동경력, 보호자 성명·연락처(미성년자에 한함)',
    sub: '용연가요제 참가자 공개 모집',
    cap: '본선 8팀',
    schedule: RECRUIT_SCHEDULE,
    info: [
      ['모집대상', '노래를 좋아하는 누구나 (제주시 거주자)'],
      ['본선', '2026. 10. 31.(토) 16:00~17:00'],
      ['장소', '메인무대'],
      ['참가형태', '개인 / 듀엣 / 팀'],
      ['예선방법', '제출 영상 온라인 심사'],
      ['결과발표', '10. 19. 결과 개별 안내 (본선 진출자)'],
    ],
    notice: '기성가수, 음반발매자, 타 가요제 대상 수상자 등은 참가할 수 없습니다.',
    steps: [
      ['온라인 참가신청', ''],
      ['노래 영상 제출', '본인이 직접 노래하는 영상을 제출해 주세요.'],
      ['온라인 영상 예선심사', '제출한 참가영상으로 심사 진행'],
      ['본선 8팀 선정', '선정자에게 개별 연락'],
      ['MR 및 무대자료 제출', '본선 참가곡 MR 및 필요한 자료 제출'],
      ['환호의 물결 본선 참가', '10월 31일(토) 메인무대'],
    ],
    tables: [
      {
        title: '시상 내역 · 총 상금 2,000,000원 (상품권)',
        lead: [['우승자 시상', '1등 시상만 개막식 전 제주시장님이 직접 시상 (1등 앵콜송)']],
        rows: [
          ['최우수상 · 용왕상', '1팀 · 용연 가요제 최고의 참가자', '700,000원'],
          ['우수상 · 황룡상', '1팀 · 뛰어난 가창과 무대매력을 보여준 참가자', '300,000원'],
          ['우수상 · 청룡상', '1팀 · 뛰어난 가창과 무대매력을 보여준 참가자', '300,000원'],
          ['장려상 · 여의주상', '2팀 · 자신만의 빛나는 매력을 보여준 참가자', '200,000원 × 2'],
          ['참가상 · 용연물결상', '3팀 · 용연의 무대를 함께 빛낸 본선 참가자', '100,000원 × 3'],
        ],
        total: ['계 8팀', '2,000,000원'],
      },
      {
        title: '심사 기준',
        lead: [
          ['1차 온라인 심사', '용담 축제위원회 (1동 1명, 2동 1명, 외부 2명)'],
          ['본선 심사', '외부심사위원 3명'],
        ],
        rows: [
          ['가창력', '음정, 박자, 발성, 호흡 등 전반적인 가창 능력', '40점'],
          ['표현력', '곡의 이해도, 감정 전달력 및 음악적 표현 능력', '25점'],
          ['음색·개성', '참가자만의 독창적인 음색과 차별화된 개성', '20점'],
          ['무대 장악력', '자신감, 전달력, 퍼포먼스 및 관객의 시선을 끄는 능력', '15점'],
        ],
      },
    ],
    req: [
      ['team', '팀명', 'text', '팀명'],
      ['name', '대표자 성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['type', '참가형태', 'choice', ['개인', '듀엣', '팀']],
      ['count', '참가인원', 'select', COUNT],
      ['age', '연령대', 'choice', AGES],
      ['video', '예선 영상 링크', 'video', 'https://'],
      ['key', '키(Key) 조정', 'choice', ['필요', '불필요']],
      ['intro', '참가자 소개', 'area', '간단한 소개'],
      ['career', '활동경력', 'area', '공연·수상 경력 등'],
    ],
    opt: [['area', '거주지역', 'text', '예: 용담1동']],
    minor: (v) => v.age === '10대 미만' || v.age === '10대',
    when: '본선 2026. 10. 31.(토) 16:00~17:00',
    doneNote: '예선 심사 결과는 개별 연락드립니다.',
  },
  market: {
    name: '플리마켓',
    privacyItems: '대표자 성명, 업체명(상호), 연락처, 주소, 참가자 구분, 사업자등록 여부, 판매품목, 전기 사용 여부·예상 사용 전력',
    sub: '용담용연 음악회·문화제와 함께할 플리마켓 공개 모집',
    cap: '선착순 8팀',
    early: true,
    period: VENDOR_PERIOD,
    info: [
      ...VENDOR_INFO,
      ['모집인원', '선착순 8팀'],
      ['참가대상', '개인 · 사업자 · 단체'],
      ['판매품목', '수공예품, 액세서리, 생활용품, 의류, 농산품 등'],
    ],
    req: [
      ['name', '대표자 성명', 'name', '홍길동'],
      ['shop', '업체명(상호)', 'text', '업체명(상호)'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['addr', '주소', 'text', '주소'],
      ['kind', '참가자 구분', 'choice', ['개인', '사업자', '단체']],
      ['biz', '사업자등록 여부', 'choice', ['유', '무']],
      ['category', '판매품목 유형', 'choice', ['수공예품', '액세서리', '생활용품', '의류', '농산품', '기타']],
      ['items', '주요 판매 품목', 'area', '판매할 품목을 구체적으로 적어 주세요'],
      ['power', '전기 사용', 'choice', ['유', '무']],
      ['kw', '예상 사용 전력 (kW)', 'text', '예: 1.5kW'],
      ['docs', '추가 제출자료 (이메일 제출)', 'docs'],
      ...VENDOR_PLEDGE,
    ],
    docs: [
      ['사업자등록증 사본', '', '사업자 해당 시'],
      ['신고·허가·인증자료', '관련 품목의 판매에 필요한 경우', '해당 시'],
    ],
    showIf: { kw: (v) => v.power === '유' },
    capacity: { rpc: 'market_remaining' },
    fullNote: '선착순 8팀 모집이 마감되었습니다.\n많은 관심에 감사드립니다.',
    when: '2026. 10. 31.(토) 11:00~21:00',
    where: '행사장 (부스 위치는 참가 확정 후 안내)',
    doneNote: `추가 제출자료(해당 시)는 이메일(${CONTACT_EMAIL})로 보내주세요. 서류 확인 후 참가 확정 여부를 개별 연락드립니다.`,
  },
  foodtruck: {
    name: '푸드트럭',
    privacyItems:
      '대표자 성명, 사업자 대표자, 업체명(상호), 영업신고 상호, 사업자등록번호, 영업신고 등록번호, 연락처, 사업장 주소, 차량번호, 차량 크기, 영업신고 업종, 판매메뉴·가격, 전기·가스 사용 정보',
    sub: '용담용연 음악회·문화제와 함께할 푸드트럭 공개 모집',
    cap: '선착순 4팀',
    early: true,
    period: VENDOR_PERIOD,
    info: [...VENDOR_INFO, ['모집인원', '선착순 4팀'], ['가스 사용', 'LPG 사용 불가']],
    req: [
      ['name', '대표자 성명', 'name', '홍길동'],
      ['bizOwner', '사업자 대표자', 'name', '홍길동'],
      ['shop', '업체명(상호)', 'text', '업체명(상호)'],
      ['permitShop', '영업신고 상호', 'text', '영업신고증의 상호'],
      ['bizNo', '사업자등록번호', 'text', '000-00-00000'],
      ['permitNo', '영업신고 등록번호', 'text', '영업신고증의 등록번호'],
      ['tel', '연락처(대표자)', 'tel', '010-0000-0000'],
      ['addr', '사업장 주소', 'text', '사업장 주소'],
      ['car', '차량번호 (푸드트럭 차량등록번호)', 'text', '예: 12가 3456'],
      ['size', '차량 크기 (가로×세로×높이, m)', 'text', '예: 5.5 × 2.0 × 2.8'],
      ['permitType', '영업신고 업종', 'text', '예: 휴게음식점'],
      ['menu', '주요 판매메뉴 (메뉴명 및 판매가격)', 'area', '예: 닭꼬치 4,000원 (한 줄에 메뉴 하나씩)'],
      ['power', '전기 사용', 'choice', ['자체발전기', '행사장 전기']],
      ['kw', '전력 소요량 (소비전력, kW)', 'text', '예: 3kW'],
      ['gas', '가스 사용', 'choice', ['유', '무']],
      ['docs', '제출 서류 (이메일 제출)', 'docs'],
      ...VENDOR_PLEDGE,
    ],
    docs: [
      ['사업자등록증 사본', '', '필수'],
      ['식품 영업신고증 사본', '', '필수'],
      ['자동차등록증 사본', '', '필수'],
      ['건강진단결과서(보건증)', '', '필수'],
      ['위생교육 수료증', '', '필수'],
      ['생산물배상책임보험 가입증명서', '', '권장'],
    ],
    hints: { gas: 'LPG 사용 불가' },
    capacity: { rpc: 'foodtruck_remaining' },
    fullNote: '선착순 4팀 모집이 마감되었습니다.\n많은 관심에 감사드립니다.',
    when: '2026. 10. 31.(토) 11:00~21:00',
    where: '행사장 (위치는 참가 확정 후 안내)',
    doneNote: `제출 서류는 이메일(${CONTACT_EMAIL})로 보내주세요. 서류 확인 후 참가 확정 여부를 개별 연락드립니다.`,
  },
} satisfies Record<string, Program>

export type ProgramKey = keyof typeof PROGRAMS

export function isProgramKey(value: string | null): value is ProgramKey {
  return value !== null && Object.hasOwn(PROGRAMS, value)
}
