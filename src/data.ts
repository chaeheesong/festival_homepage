import type { ProgramKey } from './applications'

export const IMAGE_DIR = '/asset/image'

// Must match the mobile breakpoint in App.css / index.css
export const MOBILE_QUERY = '(max-width: 768px)'

export const MAP = {
  // Kakao Map capture; replace the file and update width/height/marker if it changes
  image: `${IMAGE_DIR}/map.png`,
  width: 2000,
  height: 1000,
  // 용연 구름다리, as a % of the image
  marker: { x: '44.75%', y: '50.4%' },
  kakaoUrl: 'https://map.kakao.com/link/search/용연구름다리',
}

export const navItems = [
  { label: '행사안내', href: '#about' },
  { label: '참가신청', href: '#apply' },
  { label: '시간표', href: '#schedule' },
  { label: '체험존', href: '#experience' },
  { label: '오시는 길', href: '#location' },
]

export const artists = [
  { name: '우연이', image: `${IMAGE_DIR}/artist-wooyeon.png` },
  { name: '먼데이키즈', image: `${IMAGE_DIR}/artist-mondaykiz.png` },
  { name: '장민호', image: `${IMAGE_DIR}/artist-jangminho.png` },
]

export type Program = {
  no: string
  /** Application form shown when the card is clicked (see applications.ts) */
  apply: ProgramKey
  title: string
  description?: string
  capacity?: string
  note?: string
}

export const programs: Program[] = [
  { no: '01', apply: 'walk', title: '용의 산책', description: '“용띠들 모여라” 퍼레이드', capacity: '선착순 60명' },
  { no: '02', apply: 'culture', title: '문화의 물결' },
  { no: '03', apply: 'song', title: '용연가요제' },
  { no: '04', apply: 'runner', title: '드래곤러너', note: '선착순 100명 (인원 확정 필요)' },
  { no: '05', apply: 'stamp', title: '찾아라 드래곤볼', description: '스탬프투어' },
]

export type Wave = {
  label: string
  theme: string
  color: string
  items: { title: string; time: string; detail: string }[]
}

export const waves: Wave[] = [
  {
    label: '1 WAVE',
    theme: '역사와 전통',
    color: '#6b9bff',
    items: [
      { title: '용의 산책', time: '10:00 ~ 11:00', detail: '용담 1·2동 용 퍼레이드' },
      { title: '용연 기우제', time: '11:00 ~ 12:00', detail: '기우제 재현' },
    ],
  },
  {
    label: '2 WAVE',
    theme: '참여와 문화',
    color: '#5fc9ba',
    items: [
      { title: '예술의 물결', time: '12:00 ~ 15:00', detail: '용담 1·2동 동아리 및 자생단체 및 도민 열린 문화제' },
      { title: '화합의 물결', time: '15:00 ~ 16:00', detail: '용연 ‘청룡vs황룡’ 줄다리기' },
      { title: '환호의 물결', time: '16:00 ~ 17:00', detail: '용연 가요제' },
    ],
  },
  {
    label: '3 WAVE',
    theme: '미래와 음악',
    color: '#a58bff',
    items: [
      { title: '축하 공연', time: '17:00 ~ 18:00', detail: '초청 아티스트 축하 공연' },
      { title: '개막식', time: '18:00 ~ 18:30', detail: '내빈 소개 및 인사 말씀 및 개막 퍼포먼스' },
      { title: '용연 음악회', time: '18:30 ~ 21:00', detail: '초청 아티스트 축하 공연' },
    ],
  },
]

export const experiences = [
  {
    title: '여의주 만들기',
    description: '나만의 여의주를 꾸며 보아요',
    image: `${IMAGE_DIR}/experience-yeouiju.png`,
    mobileImage: `${IMAGE_DIR}/experience-yeouiju-mobile.png`,
    // Figma crop of the desktop background image: vertical position/size relative to the
    // card; the width follows the image's own ratio and it is anchored to the card's right edge
    crop: { top: '-98.5%', height: '227.28%' },
    // Mobile: move the photo down within its card (positive = lower)
    mobileShiftY: '10px',
  },
  {
    title: '소원수 체험',
    description: '소원수 유리병에 소원을 적어보아요',
    image: `${IMAGE_DIR}/experience-wish.png`,
    mobileImage: `${IMAGE_DIR}/experience-wish-mobile.png`,
    crop: { top: '-56.25%', height: '200.63%' },
  },
]

export const contacts: { office: string; tel: string; desktopPrefix?: string }[] = [
  { office: '용담1동주민센터', tel: '064-728-4592' },
  { office: '용담2동주민센터', tel: '064-728-4637', desktopPrefix: '제주시' },
]
