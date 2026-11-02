import { useState } from 'react'
import type { CSSProperties } from 'react'
import './EndedPage.css'

const CLAPS_PER_SIDE = 5

const random = (min: number, max: number) => min + Math.random() * (max - min)

/** Five claps per side, each in its own band down the screen so they don't pile up */
function makeClaps() {
  return (['left', 'right'] as const).flatMap((side) =>
    Array.from({ length: CLAPS_PER_SIDE }, (_, i) => {
      const band = 90 / CLAPS_PER_SIDE
      return {
        side,
        x: random(3, 20),
        y: random(5 + band * i, 5 + band * (i + 1) - 8),
        size: random(24, 56),
      }
    }),
  )
}

// The festival is over, so the whole site is just this thank-you message for now.
// The main page (App.tsx) and application forms (ApplicationPage.tsx) are kept as files.
export default function EndedPage() {
  // New random spots and sizes on every visit
  const [claps] = useState(makeClaps)

  return (
    <main className="ended">
      {claps.map((c, i) => (
        <span
          key={i}
          className={`ended__clap ended__clap--${c.side}`}
          style={{ [c.side]: `${c.x}%`, top: `${c.y}%`, fontSize: `${c.size}px` } as CSSProperties}
          aria-hidden
        >
          👏
        </span>
      ))}
      <p className="ended__text">
        축제가 성황리에 마무리되었습니다.
        <br />
        함께해 주신 모든 분께 감사드리며,
        <br />
        다음에는 더 발전된 모습으로 찾아뵙겠습니다.
      </p>
    </main>
  )
}
