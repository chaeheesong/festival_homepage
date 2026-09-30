// Application form content, ported from yongyeon-application-forms.html

/** 'name': Korean/English letters only. 'tel': digits only, auto-hyphenated. */
export type FieldType = 'text' | 'name' | 'tel' | 'choice' | 'select' | 'area' | 'file' | 'video' | 'check' | 'rules'

/** Where applicants without a video link should email their video */
export const VIDEO_EMAIL = 'changig77@gmail.com'

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
  /** [label, value, note?] */
  info: [string, string, string?][]
  notice?: string
  /** [title, description] */
  steps?: [string, string][]
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
  doneNote: string
}

const YONG = ['1940', '1952', '1964', '1976', '1988', '2000', '2012', '2024']
const COUNT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '기타']
const AGES = ['10대 미만', '10대', '20대', '30대', '40대', '50대', '60대 이상']
const TYPE4 = ['개인', '가족', '친구', '단체']

export const GUARDIAN_FIELDS: FieldDef[] = [
  ['gname', '보호자 성명', 'name', '보호자 성명'],
  ['gtel', '보호자 연락처', 'tel', '010-0000-0000'],
  ['gagree', '보호자로서 참가에 동의합니다', 'check'],
]

export const PROGRAMS = {
  walk: {
    name: '용의 산책',
    sub: '용띠들 모여라 · 퍼레이드 참가자 모집',
    cap: '선착순 60명',
    early: true,
    info: [
      ['일시', '2026. 10. 31.(토) 오전'],
      ['장소', '용담1·2동 출발 → 용연 행사장 일원'],
      ['참가대상', '용띠라면 누구나 (어린이~성인·가족 가능)'],
      ['참가비', '무료 (기념품 지급)'],
      ['모집인원', '용담1동 30명 / 용담2동 30명'],
    ],
    req: [
      ['name', '성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['year', '출생연도 (용띠 확인)', 'choice', YONG],
      ['area', '거주지역', 'choice', ['용담1동', '용담2동', '제주시 기타']],
      ['count', '참가인원 (본인 포함)', 'select', COUNT],
      ['type', '참가구분', 'choice', ['개인', '가족', '단체']],
      ['sos', '비상연락처', 'tel', '010-0000-0000'],
      ['line', '희망 행렬 노선', 'choice', ['용담1동', '용담2동', '상관없음']],
    ],
    minor: (v) => v.year === '2012' || v.year === '2024',
    when: '2026. 10. 31.(토) 오전',
    doneNote: '집결 시간·장소는 행사 전 문자로 안내드립니다.',
  },
  stamp: {
    name: '찾아라 드래곤볼',
    sub: '스탬프투어 참가자 모집',
    cap: '누구나 참가',
    info: [
      ['운영시간', '2026. 10. 31.(토) 11:00~17:30'],
      ['마감', '마지막 출발 15:00 / 완주 확인 17:30'],
      ['참가대상', '누구나 (어린이·청소년·가족·관광객)'],
      ['참가비', '무료 · 완주 시 기념품', '※ 기념품은 준비수량에 따라 조기 소진될 수 있습니다.'],
    ],
    steps: [
      ['사전접수', 'QR코드로 참가신청'],
      ['스탬프북 수령', '행사 당일 운영본부에서 신청자 확인 후 스탬프북 수령'],
      ['7대 명소 자유 탐방', '지도를 보고 원하는 순서대로 명소 방문'],
      ['스탬프 미션 수행', '각 장소에서 스탬프 또는 인증미션 완료'],
      ['완주 인증', '7개의 스탬프를 모두 모은 뒤 운영본부 방문'],
      ['완주 기념품 수령', '완주 확인 후 기념품 증정'],
    ],
    mates: true,
    req: [
      ['name', '신청자(대표) 성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['count', '참가인원 (본인 포함 총원)', 'select', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']],
      ['type', '참가형태', 'choice', TYPE4],
      ['area', '거주지역', 'choice', ['용담1동', '용담2동', '제주시 기타', '도외·관광객']],
      ['time', '예상 방문시간대', 'choice', ['11:00~13:00', '13:00~15:00', '15:00~17:30']],
    ],
    when: '2026. 10. 31.(토) 11:00~17:30',
    doneNote: '현장 안내부스에서 스탬프북을 받아 주세요.',
  },
  runner: {
    name: '드래곤 러너',
    sub: '드래곤러너 참가자 모집',
    cap: '선착순 150명',
    early: true,
    info: [
      ['일시', '2026. 10. 31.(토) 08:30~20:30'],
      ['마감', '마지막 출발 19:30 / 완주확인 20:30까지'],
      ['집결', '드래곤러너 안내부스 (용연구름다리 일대)'],
      ['참가비', '무료 · 완주 기념품 지급 (선착순 150명 한정)'],
    ],
    notice: '어린이·청소년 참가 시 보호자 동반이 필수입니다.',
    steps: [
      ['드래곤러너 안내부스 집결', '사전접수자 이름 또는 연락처 확인'],
      ['참가자 등록', '손목띠 또는 번호표 지급'],
      ['안전안내', '코스, 횡단보도, 반환지점, 유의사항 설명'],
      ['출발', '소규모 그룹으로 순차 출발'],
      ['코스 인증', 'START → TURN → FINISH 인증'],
      ['완주 확인', '드래곤러너 안내부스에서 완주 확인'],
      ['기념품 또는 완주인증 제공', '준비 시 기념품 지급'],
    ],
    req: [
      ['name', '참가자 성명', 'name', '홍길동'],
      ['tel', '연락처', 'tel', '010-0000-0000'],
      ['age', '연령대', 'choice', AGES],
      ['type', '참가구분', 'choice', TYPE4],
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
    opt: [
      ['area', '거주지역', 'text', '예: 용담2동'],
      ['mates', '동반 참가인원', 'select', ['0', '1', '2', '3', '4', '5', '기타']],
    ],
    minor: (v) => v.age === '10대 미만' || v.age === '10대',
    guardNote: '보호자 동반 필수',
    when: '2026. 10. 31.(토) 08:30~20:30',
    doneNote: '당일 안내부스에서 손목띠·번호표를 받아 주세요.',
  },
  culture: {
    name: '문화의 물결',
    sub: '공연팀 모집 · 메인무대',
    cap: '8팀 선정',
    early: true,
    info: [
      ['공연 일시', '2026. 10. 31.(토) 14:00~15:30'],
      ['장소', '용연 구름다리 일대 메인무대'],
      ['모집분야', '노래·밴드·댄스·난타·악기연주·퍼포먼스 등 (장르 제한 없음)'],
      ['모집규모', '8팀 (용담1동 3팀 / 용담2동 3팀 / 청소년팀 2팀)'],
      ['참가비', '300,000원'],
      ['선정방법', '서류 심사 후 개별 연락으로 결과 발표'],
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
      ['dur', '공연시간 (팀당 약 10분 내)', 'text', '예: 8분'],
      ['genre', '공연장르', 'choice', ['노래', '밴드', '댄스', '난타', '악기연주', '퍼포먼스', '기타']],
      ['content', '공연내용 (곡명·소개)', 'area', '곡명과 공연 구성을 적어 주세요'],
      ['intro', '팀(본인) 소개 (100~200자)', 'area', '팀(본인)을 소개해 주세요'],
    ],
    attach: [
      ['photo', '활동사진 1장', 'file', 'JPG·PNG 파일'],
      ['video', '공연영상 링크 (1~3분)', 'video', 'https://'],
    ],
    when: '2026. 10. 31.(토) 14:00~15:30',
    doneNote: '서류 심사 후 선정 결과를 개별 연락드립니다.',
  },
  song: {
    name: '용연가요제',
    sub: '가요제 참가자 모집 · 본선 8팀',
    cap: '본선 8팀',
    info: [
      ['모집대상', '노래를 좋아하는 누구나'],
      ['본선', '2026. 10. 31.(토)'],
      ['장소', '용연 구름다리 일대 메인무대'],
      ['참가형태', '개인 / 듀엣 / 팀'],
      ['예선방법', '제출 영상 온라인 심사'],
      ['결과발표', '본선 진출자 개별 안내'],
      ['상금', '총 2,000,000원 (상품권으로 지급)'],
    ],
    notice: '기성가수, 음반발매자, 타 가요제 대상 수상자 등은 참가할 수 없습니다.',
    steps: [
      ['온라인 참가신청', 'QR코드 접속 후 참가정보 입력'],
      ['노래 영상 제출', '본인이 직접 노래하는 영상을 제출해 주세요.'],
      ['온라인 영상 예선심사', '제출한 참가영상으로 심사 진행'],
      ['본선 8팀 선정', '선정자에게 개별 연락'],
      ['MR 및 무대자료 제출', '본선 참가곡 MR 및 필요한 자료 제출'],
      ['용연가요제 본선 참가', '10월 31일(토) 용연 구름다리 일대 메인무대'],
    ],
    tables: [
      {
        title: '시상 내역 · 총 상금 2,000,000원 (상품권)',
        lead: [['우승자 시상', '1등 시상만 개막식 전 제주시장님이 직접 시상 (1등 앵콜송)']],
        rows: [
          ['최우수상 · 용왕상', '1명 · 용연 가요제 최고의 참가자', '700,000원'],
          ['우수상 · 황룡상', '1명 · 뛰어난 가창과 무대매력을 보여준 참가자', '300,000원'],
          ['우수상 · 청룡상', '1명 · 뛰어난 가창과 무대매력을 보여준 참가자', '300,000원'],
          ['장려상 · 여의주상', '2명 · 자신만의 빛나는 매력을 보여준 참가자', '200,000원 × 2'],
          ['참가상 · 용연물결상', '3명 · 용연의 무대를 함께 빛낸 본선 참가자', '100,000원 × 3'],
        ],
        total: ['계 8명', '2,000,000원'],
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
        total: ['합계', '100점'],
      },
    ],
    req: [
      ['team', '참가자 또는 팀명', 'text', '이름 또는 팀명'],
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
    when: '본선 2026. 10. 31.(토)',
    doneNote: '예선 심사 결과는 개별 연락드립니다.',
  },
} satisfies Record<string, Program>

export type ProgramKey = keyof typeof PROGRAMS

export function isProgramKey(value: string | null): value is ProgramKey {
  return value !== null && Object.hasOwn(PROGRAMS, value)
}
