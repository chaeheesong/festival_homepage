import type { ProgramKey } from './applications'

export const IMAGE_DIR = '/asset/image'

// Must match the mobile breakpoint in App.css / index.css
export const MOBILE_QUERY = '(max-width: 768px)'

export const MAP = {
  // Kakao Map capture; replace the file and update width/height/marker if it changes
  image: `${IMAGE_DIR}/map.png`,
  width: 2000,
  height: 1000,
  // Event area (the park south of 용연구름다리 plus 용두암길 beside it), as polygon points in image pixels (2000 x 1000)
  area: '776,582 797,582 820,598 846,618 866,645 880,672 889,703 894,736 896,768 896,790 873,790 820,796 767,802 740,798 727,788 723,760 721,730 716,704 722,684 730,664 743,633 752,614 760,600 768,588',
  // Pin inside the event area, as a % of the image
  marker: { x: '39.8%', y: '70.5%' },
  kakaoUrl: 'https://kko.to/L4OXCh7Mn1',
}

export const navItems = [
  { label: '행사안내', href: '#about' },
  { label: '참가신청', href: '#apply' },
  { label: '시간표', href: '#schedule' },
  { label: '체험존', href: '#experience' },
  { label: '오시는 길', href: '#location' },
]

// Square, top-cropped photos pre-sized for 1x/2x/3x screens: artist-<slug>-{124,248,372}.jpg
// (made from artist-<slug>.png; regenerate them when the original is replaced)
const artistPhoto = (slug: string) => ({
  image: `${IMAGE_DIR}/artist-${slug}-248.jpg`,
  srcSet: [124, 248, 372].map((w) => `${IMAGE_DIR}/artist-${slug}-${w}.jpg ${w}w`).join(', '),
})

export const artists = [
  { name: '우연이', ...artistPhoto('wooyeon') },
  { name: '먼데이키즈', ...artistPhoto('mondaykiz') },
  { name: '장민호', ...artistPhoto('jangminho') },
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
  { no: '02', apply: 'culture', title: '예술의 물결', capacity: '8팀 선정' },
  { no: '03', apply: 'busking', title: '찾아가는 버스킹', capacity: '6팀 선정' },
  { no: '04', apply: 'song', title: '용연가요제', capacity: '8팀 선정' },
  { no: '05', apply: 'runner', title: '드래곤러너', capacity: '선착순 150명' },
  { no: '06', apply: 'stamp', title: '찾아라 드래곤볼', capacity: '선착순 150명', note: '마감 후 현장 신청' },
]

export type Wave = {
  label: string
  theme?: string
  color: string
  /** detail: a "\n" starts a new line */
  items: { title: string; time: string; detail: string }[]
}

export const waves: Wave[] = [
  {
    label: '1 WAVE',
    theme: '역사와 전통',
    color: '#6b9bff',
    items: [
      { title: '용의 산책', time: '10:00 ~ 11:00', detail: '용 퍼레이드' },
      { title: '용연 기우제', time: '11:00 ~ 12:00', detail: '용연기우제' },
    ],
  },
  {
    label: '2 WAVE',
    theme: '참여와 문화',
    color: '#5fc9ba',
    items: [
      { title: '리허설', time: '12:00 ~ 13:00', detail: '예술의 물결 공연팀 리허설' },
      { title: '예술의 물결', time: '13:00 ~ 15:00', detail: '용담1·2동 동아리 및 청소년팀' },
      {
        title: '화합의 물결',
        time: '15:00 ~ 16:00',
        detail: '15:00 ~ 15:30 용연 ‘황룡vs청룡’ 줄다리기\n15:30 ~ 16:00 참여 이벤트 (OX퀴즈)',
      },
      { title: '환호의 물결', time: '16:00 ~ 17:00', detail: '용연 가요제' },
    ],
  },
  {
    label: '3 WAVE',
    theme: '미래와 음악',
    color: '#a58bff',
    items: [
      { title: '축하 공연', time: '17:00 ~ 18:00', detail: '축하 공연' },
      { title: '개막식', time: '18:00 ~ 18:30', detail: '개막 퍼포먼스' },
      { title: '용연 음악회', time: '18:30 ~ 21:00', detail: '어린이합창단, 고강민, 우연이, 먼데이키즈, 장민호' },
    ],
  },
]

/** Side programs, shown as their own table below the main schedule */
export const sidePrograms: Wave['items'] = [
  { title: '찾아라 드래곤볼', time: '11:00 ~ 17:30', detail: '스탬프 투어' },
  { title: '드래곤 러너', time: '18:30 ~ 20:30', detail: '야간 러닝' },
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
