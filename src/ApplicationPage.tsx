import { useEffect, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import {
  APPLY_PERIOD_LABEL,
  CONTACT_EMAIL,
  CONTACT_TEL,
  GUARDIAN_FIELDS,
  PHOTO_TERMS,
  PRIVACY_TERMS,
  PROGRAMS,
  VIDEO_EMAIL,
  isApplyClosed,
} from './applications'
import { CapacityError, fetchRemaining, submitApplication } from './submitApplication'
import type { ConsentTerm, FieldDef, FieldType, FormValues, Program, ProgramKey } from './applications'
import './ApplicationPage.css'

const MAIN_URL = './'
const PROGRAM_LIST_URL = './#apply'

type Section = { title: string; note?: string; fields: FieldDef[]; required: boolean }

function buildSections(p: Program, v: FormValues): Section[] {
  const sections: Section[] = [{ title: '필수 정보', note: '* 표시는 필수 입력', fields: p.req, required: true }]
  if (p.opt) sections.push({ title: '선택 정보', fields: p.opt, required: false })
  if (p.mates) {
    const n = parseInt(String(v.count ?? '1'), 10) - 1
    if (n > 0) {
      sections.push({
        title: '동반 참가자',
        note: `참가인원에 맞춰 ${n}명 입력`,
        fields: Array.from({ length: n }, (_, i): FieldDef => [`mate${i}`, `동반 참가자 ${i + 1} 이름`, 'name', '이름']),
        required: false,
      })
    }
  }
  if (p.attach) sections.push({ title: '첨부파일', fields: p.attach, required: true })
  if (p.minor?.(v)) {
    sections.push({ title: '보호자 정보', note: p.guardNote ?? '미성년자 참가 시 필요해요', fields: GUARDIAN_FIELDS, required: true })
  }
  return sections
}

// Names: Korean (incl. jamo while an IME is composing), English letters and spaces
const NAME_INPUT_BLOCKED = /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z ]/g
const NAME_VALID = /^[가-힣a-zA-Z]+( [가-힣a-zA-Z]+)*$/
const PHONE_VALID = /^(02-\d{3,4}|0\d{2}-\d{3,4})-\d{4}$/

const digitsOf = (value: string) => value.replace(/\D/g, '')

/** Formats digits as 010-1234-5678 / 064-728-4592 / 02-123-4567 */
function formatPhone(input: string) {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.startsWith('02')) {
    const x = d.slice(0, 10)
    if (x.length <= 2) return x
    if (x.length <= 5) return `${x.slice(0, 2)}-${x.slice(2)}`
    if (x.length <= 9) return `${x.slice(0, 2)}-${x.slice(2, 5)}-${x.slice(5)}`
    return `${x.slice(0, 2)}-${x.slice(2, 6)}-${x.slice(6)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

function isValidFormat(type: FieldType, value: string) {
  if (type === 'name') return NAME_VALID.test(value.trim())
  if (type === 'tel') return PHONE_VALID.test(value)
  return true
}

const FORMAT_ERRORS: Partial<Record<FieldType, string>> = {
  name: '이름은 한글 또는 영문으로 정확히 입력해 주세요.',
  tel: '전화번호를 끝까지 입력해 주세요.',
}

/** Whether a required field has been answered ("기타" also needs its free-text value) */
function isAnswered([key, , type, extra]: FieldDef, v: FormValues): boolean {
  const value = v[key]
  const filled = (x: unknown) => typeof x === 'string' && x.trim() !== ''
  switch (type) {
    case 'rules':
      return true
    case 'check':
      return value === true
    case 'video':
      return filled(value) || v[`${key}Email`] === true
    case 'name':
    case 'tel':
      return filled(value) && isValidFormat(type, value as string)
    case 'select': {
      const selected = filled(value) ? value : Array.isArray(extra) ? extra[0] : undefined
      return selected !== '기타' || filled(v[`${key}Etc`])
    }
    case 'choice':
      return filled(value) && (value !== '기타' || filled(v[`${key}Etc`]))
    default:
      return filled(value)
  }
}

const FULL_WIDTH_TYPES = ['choice', 'area', 'file', 'video', 'check', 'rules']

function Checkbox({ checked }: { checked: boolean }) {
  return <span className={`apply-checkbox${checked ? ' is-checked' : ''}`} aria-hidden>{checked ? '✓' : ''}</span>
}

type FieldProps = {
  def: FieldDef
  required: boolean
  values: FormValues
  set: (key: string, value: string | boolean | undefined) => void
  setFile: (key: string, file: File) => void
  /** Seats left per choice option; options with 0 are shown as full */
  seats?: Record<string, number>
  /** Highest selectable number in a headcount dropdown */
  maxOption?: number
  /** Light-colored note next to the label */
  hint?: string
}

const MAX_FILE_MB = 10

function Field({ def: [key, label, type, extra], required, values, set, setFile, seats, maxOption, hint }: FieldProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  // Format errors show only after leaving the field, not mid-typing
  const [blurred, setBlurred] = useState(false)
  const value = values[key]
  const text = typeof value === 'string' ? value : ''
  const placeholder = typeof extra === 'string' ? extra : ''
  const options = Array.isArray(extra) ? extra : []
  const id = `field-${key}`

  return (
    // A field with a side note gets the full row so the note stays on the label's line
    <div className={`apply-field${FULL_WIDTH_TYPES.includes(type) || hint ? ' apply-field--full' : ''}`}>
      {type !== 'check' && (
        <label className="apply-label" htmlFor={id}>
          {label} {required && type !== 'rules' && <span className="apply-star">*</span>}
          {hint && <span className="apply-label__hint">{hint}</span>}
        </label>
      )}

      {type === 'text' && (
        <input
          id={id}
          className="apply-input"
          type="text"
          placeholder={placeholder}
          value={text}
          onChange={(e) => set(key, e.target.value)}
        />
      )}

      {type === 'number' && (
        <div className="apply-number">
          <input
            id={id}
            className="apply-input"
            inputMode="numeric"
            maxLength={4}
            placeholder="숫자만 입력"
            value={digitsOf(text)}
            onChange={(e) => {
              const d = digitsOf(e.target.value)
              set(key, d ? `${d}${placeholder}` : undefined)
            }}
          />
          <span className="apply-number__unit">{placeholder}</span>
        </div>
      )}

      {(type === 'name' || type === 'tel') && (
        <>
          <input
            id={id}
            className="apply-input"
            type={type === 'tel' ? 'tel' : 'text'}
            inputMode={type === 'tel' ? 'numeric' : undefined}
            autoComplete={type === 'tel' ? 'tel' : 'name'}
            maxLength={type === 'tel' ? 13 : 30}
            placeholder={placeholder}
            value={text}
            aria-invalid={blurred && text !== '' && !isValidFormat(type, text)}
            onChange={(e) =>
              set(key, type === 'tel' ? formatPhone(e.target.value) : e.target.value.replace(NAME_INPUT_BLOCKED, ''))
            }
            onBlur={() => {
              setBlurred(true)
              if (type === 'name') set(key, text.replace(/ +/g, ' ').trim())
            }}
          />
          {blurred && text !== '' && !isValidFormat(type, text) && (
            <p className="apply-field-error">{FORMAT_ERRORS[type]}</p>
          )}
        </>
      )}

      {type === 'area' && (
        <textarea
          id={id}
          className="apply-input apply-textarea"
          rows={3}
          placeholder={placeholder}
          value={text}
          onChange={(e) => set(key, e.target.value)}
        />
      )}

      {type === 'rules' && (
        <ul className="apply-rules">
          {options.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      )}

      {type === 'select' && (
        <>
          <select
            id={id}
            className="apply-input apply-select"
            value={text || options[0]}
            onChange={(e) => set(key, e.target.value)}
          >
            {options
              .filter((o) => maxOption === undefined || o === '기타' || Number(o) <= maxOption)
              .map((o) => (
                <option key={o} value={o}>{o === '기타' ? '기타 (직접 입력)' : `${o}명`}</option>
              ))}
          </select>
          {text === '기타' && (
            <div className="apply-number apply-number--etc">
              <input
                className="apply-etc-input"
                inputMode="numeric"
                maxLength={4}
                placeholder="인원을 숫자로 입력해 주세요 (예: 12)"
                value={digitsOf(String(values[`${key}Etc`] ?? ''))}
                onChange={(e) => {
                  const d = digitsOf(e.target.value)
                  set(`${key}Etc`, d ? `${d}명` : undefined)
                }}
              />
              <span className="apply-number__unit">명</span>
            </div>
          )}
        </>
      )}

      {type === 'choice' && (
        <div className="apply-chips" role="radiogroup" id={id}>
          {options.map((o) => {
            const selected = value === o
            const left = seats?.[o]
            const full = left !== undefined && left <= 0
            const toggle = () => !full && set(key, selected ? undefined : o)
            return (
              <div
                key={o}
                role="radio"
                aria-checked={selected}
                aria-disabled={full}
                tabIndex={full ? -1 : 0}
                className={`apply-chip${selected ? ' is-selected' : ''}${full ? ' is-full' : ''}`}
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle()
                  }
                }}
              >
                {o}
                {left !== undefined && (
                  <span className="apply-chip__seats">{full ? '마감' : `잔여 ${left}명`}</span>
                )}
                {o === '기타' && selected && (
                  <input
                    className="apply-chip-input"
                    placeholder="직접 입력"
                    value={String(values[`${key}Etc`] ?? '')}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onChange={(e) => set(`${key}Etc`, e.target.value.replace(NAME_INPUT_BLOCKED, ''))}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {type === 'video' && (
        <>
          <input
            id={id}
            className="apply-input"
            type="url"
            inputMode="url"
            placeholder={placeholder}
            value={text}
            onChange={(e) => set(key, e.target.value)}
          />
          <p className="apply-video-note">
            유튜브·구글 드라이브 등 영상 링크를 입력해 주세요. 링크가 없으면 영상 파일을 이메일(
            <a href={`mailto:${VIDEO_EMAIL}`}>{VIDEO_EMAIL}</a>)로 보내주세요.
            <span>메일 제목에 팀명(이름)과 연락처를 적어 주세요.</span>
          </p>
          <button
            type="button"
            role="checkbox"
            aria-checked={!!values[`${key}Email`]}
            className={`apply-check${values[`${key}Email`] ? ' is-checked' : ''}`}
            onClick={() => set(`${key}Email`, !values[`${key}Email`])}
          >
            <Checkbox checked={!!values[`${key}Email`]} />
            링크가 없어 이메일로 보내겠습니다
          </button>
        </>
      )}

      {type === 'file' && (
        <>
          <div className="apply-file">
            <input
              id={id}
              className="apply-input apply-file-name"
              placeholder={placeholder}
              value={text}
              readOnly
              onClick={() => fileInput.current?.click()}
            />
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                if (file.size > MAX_FILE_MB * 1024 * 1024) {
                  setFileError(`${MAX_FILE_MB}MB 이하의 이미지 파일만 첨부할 수 있어요.`)
                  return
                }
                setFileError(null)
                setFile(key, file)
                set(key, file.name)
              }}
            />
            <button type="button" className="apply-file-button" onClick={() => fileInput.current?.click()}>
              파일 첨부
            </button>
          </div>
          {fileError && <p className="apply-field-error">{fileError}</p>}
        </>
      )}

      {type === 'check' && (
        <button
          type="button"
          role="checkbox"
          aria-checked={!!value}
          className={`apply-check${value ? ' is-checked' : ''}`}
          onClick={() => set(key, !value)}
        >
          <Checkbox checked={!!value} />
          {label}
        </button>
      )}
    </div>
  )
}

function InfoRows({ p, compact }: { p: Program; compact?: boolean }) {
  return (
    <div className={compact ? 'apply-info apply-info--compact' : 'apply-info'}>
      {p.info.map(([k, v, note]) => (
        <div key={k} className="apply-info__row">
          <span className="apply-info__key">{k}</span>
          <span className="apply-info__value">
            {v}
            {note && <span className="apply-info__note">{note}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

function Steps({ p, compact }: { p: Program; compact?: boolean }) {
  const boxes: [string, [string, string][]][] = []
  if (p.schedule) boxes.push(['일정', p.schedule])
  if (p.steps) boxes.push(['참가방법', p.steps])
  return (
    <>
      {boxes.map(([title, items]) => (
        <div key={title} className={compact ? 'apply-steps apply-steps--compact' : 'apply-steps'}>
          <span className="apply-box-title">{title}</span>
          <ol>
            {items.map(([t, d], i) => (
              <li key={t}>
                <span className="apply-steps__n">{i + 1}</span>
                <div>
                  <strong>{t}</strong>
                  {d && <span>{d}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </>
  )
}

function Tables({ p, compact }: { p: Program; compact?: boolean }) {
  if (!p.tables) return null
  return (
    <div className={compact ? 'apply-tables apply-tables--compact' : 'apply-tables'}>
      {p.tables.map((tb) => (
        <div key={tb.title} className="apply-table">
          <span className="apply-box-title">{tb.title}</span>
          {tb.lead && (
            <div className="apply-table__lead">
              {tb.lead.map(([k, v]) => (
                <span key={k}><b>{k}</b> {v}</span>
              ))}
            </div>
          )}
          <div>
            {tb.rows.map(([a, sub, c]) => (
              <div key={a} className="apply-table__row">
                <div>
                  <strong>{a}</strong>
                  {sub && !compact && <span>{sub}</span>}
                </div>
                <span className="apply-table__value">{c}</span>
              </div>
            ))}
            {tb.total && (
              <div className="apply-table__total">
                <span>{tb.total[0]}</span>
                <span>{tb.total[1]}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function Notice({ p }: { p: Program }) {
  return p.notice ? <div className="apply-notice">{p.notice}</div> : null
}

/** Required consent checkbox with its terms listed underneath */
function ConsentItem({
  checked,
  onToggle,
  title,
  terms,
  startAt = 1,
}: {
  checked: boolean
  onToggle: () => void
  title: string
  terms: ConsentTerm[]
  startAt?: number
}) {
  return (
    <div className="apply-consent">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className={`apply-agree__item${checked ? ' is-checked' : ''}`}
        onClick={onToggle}
      >
        <Checkbox checked={checked} />
        <strong>
          {title} <span className="apply-star">(필수)</span>
        </strong>
      </button>
      <ol className="apply-consent__terms" start={startAt}>
        {terms.map(([k, v, sub]) => (
          <li key={k}>
            <b>{k}:</b> {v}
            {sub && <span className="apply-consent__sub">- {sub}</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}

function ApplyClosed({ full = false, fullNote }: { full?: boolean; fullNote?: string }) {
  return (
    <div className="apply-closed">
      <span className="apply-closed__icon" aria-hidden>!</span>
      <h2>{full ? '모집 인원이 모두 찼습니다' : '신청이 마감되었습니다'}</h2>
      <p>
        {full && fullNote ? (
          <span className="apply-closed__note">{fullNote}</span>
        ) : (
          <>
            {full ? '많은 관심에 감사드립니다.' : `신청 기간: ${APPLY_PERIOD_LABEL}`}
            <br />
            {full ? '다른 프로그램도 둘러봐 주세요. 행사 당일 현장에서 만나요!' : '참여해 주셔서 감사합니다. 행사 당일 현장에서 만나요!'}
          </>
        )}
      </p>
      <a className="apply-done__home" href={MAIN_URL}>메인으로</a>
    </div>
  )
}

function ApplyForm({
  programKey,
  p,
  onDone,
}: {
  programKey: ProgramKey
  p: Program
  /** videoByEmail: the applicant ticked "링크가 없어 이메일로 보내겠습니다" */
  onDone: (result: { videoByEmail: boolean }) => void
}) {
  const [closed, setClosed] = useState(() => isApplyClosed())
  // Dropdowns show their first option, so start with that as the stored answer too
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(
      [...p.req, ...(p.opt ?? [])]
        .filter(([, , type, extra]) => type === 'select' && Array.isArray(extra))
        .map(([key, , , extra]) => [key, (extra as string[])[0]]),
    ),
  )
  const [files, setFiles] = useState<Record<string, File>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Guards against a double click landing before the disabled state re-renders
  const submittingRef = useRef(false)
  const set = (key: string, value: string | boolean | undefined) => setValues((v) => ({ ...v, [key]: value }))
  const setFile = (key: string, file: File) => setFiles((f) => ({ ...f, [key]: file }))

  // Headcount limits (용의 산책): seats left per group, from the database
  const capacity = p.capacity
  const [seats, setSeats] = useState<Record<string, number> | null>(null)
  const loadSeats = () => {
    if (capacity) fetchRemaining(capacity.rpc).then(setSeats)
  }
  useEffect(loadSeats, [capacity])
  // Without a groupField the whole program shares one pool, returned as { 전체: n }
  const group = capacity ? (capacity.groupField ? values[capacity.groupField] : '전체') : undefined
  const seatsLeft = seats && typeof group === 'string' ? seats[group] : undefined
  const maxSeats = seats ? Math.max(0, ...Object.values(seats)) : undefined
  const maxPeople = seatsLeft ?? maxSeats
  const allFull = maxSeats === 0
  // Keep the answers within what is left: drop a group that filled up, shrink the party size
  const people = capacity ? Number(values[capacity.countField] ?? 1) : 0
  useEffect(() => {
    if (!capacity || !seats) return
    if (capacity.groupField && typeof group === 'string' && (seats[group] ?? 0) <= 0) set(capacity.groupField, undefined)
    if (maxPeople !== undefined && maxPeople > 0 && people > maxPeople) set(capacity.countField, String(maxPeople))
  }, [capacity, seats, group, maxPeople, people])

  const agreed = !!values.agreePriv
  const sections = buildSections(p, values)
  const photoAgreed = !!values.agreePhoto
  const canSubmit =
    agreed && photoAgreed && sections.every((sec) => !sec.required || sec.fields.every((def) => isAnswered(def, values)))

  return (
    <>
      <section className="apply-hero">
        <span className="apply-hero__eyebrow">참가신청</span>
        <h1>{p.name}</h1>
        <span className="apply-hero__sub">{p.sub}</span>
        <div className="apply-hero__badges">
          <span className="apply-badge apply-badge--gold">{p.cap}</span>
        </div>
      </section>

      <div className="apply-body">
        <aside className="apply-aside">
          {!closed && (
            <p className="apply-save-hint">신청 완료 후 아래 참가 안내를 이미지로 저장할 수 있어요.</p>
          )}
          <InfoRows p={p} />
          <Notice p={p} />
          <Steps p={p} />
          <Tables p={p} />
        </aside>

        {closed || allFull ? (
          <ApplyClosed full={!closed && allFull} fullNote={p.fullNote} />
        ) : (
          <form
            className="apply-form"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!canSubmit || submittingRef.current) return
              // The page may have been left open past the deadline
              if (isApplyClosed()) {
                setClosed(true)
                window.scrollTo({ top: 0, behavior: 'instant' })
                return
              }
              submittingRef.current = true
              setSubmitting(true)
              setSubmitError(null)
              try {
                await submitApplication(programKey, values, files)
                const videoByEmail = [...p.req, ...(p.opt ?? []), ...(p.attach ?? [])].some(
                  ([key, , type]) => type === 'video' && values[`${key}Email`] === true && !values[key],
                )
                onDone({ videoByEmail })
              } catch (err) {
                if (err instanceof CapacityError) loadSeats()
                setSubmitError(err instanceof Error ? err.message : '신청을 접수하지 못했어요. 잠시 후 다시 시도해 주세요.')
              } finally {
                submittingRef.current = false
                setSubmitting(false)
              }
            }}
          >
            {sections.map((sec) => (
              <div key={sec.title} className="apply-section">
                <div className="apply-section__head">
                  <span className="apply-section__title">{sec.title}</span>
                  {sec.note && <span className="apply-section__note">{sec.note}</span>}
                </div>
                <div className="apply-section__fields">
                  {sec.fields.map((def) => (
                    <Field
                      key={def[0]}
                      def={def}
                      required={sec.required}
                      values={values}
                      set={set}
                      setFile={setFile}
                      seats={capacity && def[0] === capacity.groupField ? (seats ?? undefined) : undefined}
                      maxOption={capacity && def[0] === capacity.countField ? maxPeople : undefined}
                      hint={p.hints?.[def[0]]}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="apply-section apply-agree">
              <div className="apply-section__head">
                <span className="apply-section__title">동의</span>
              </div>
              <ConsentItem
                checked={agreed}
                onToggle={() => set('agreePriv', !agreed)}
                title="개인정보 수집·이용 동의"
                terms={PRIVACY_TERMS}
              />
              <ConsentItem
                checked={photoAgreed}
                onToggle={() => set('agreePhoto', !photoAgreed)}
                title="사진·영상 촬영 및 홍보 활용 동의"
                terms={PHOTO_TERMS}
                startAt={PRIVACY_TERMS.length + 1}
              />
            </div>

            <div className="apply-submit">
              {p.early && <span className="apply-submit__early">모집인원 마감 시 조기마감될 수 있습니다</span>}
              <button type="submit" className="apply-submit__button" disabled={!canSubmit || submitting}>
                {submitting ? '신청 중…' : '신청하기'}
              </button>
              {submitError && (
                <p className="apply-submit__error" role="alert">
                  {submitError}
                </p>
              )}
              <span className="apply-submit__hint">
                {canSubmit
                  ? '신청 완료 후 입력하신 연락처로 접수 확인 문자가 발송됩니다.'
                  : '필수 항목(*)을 모두 입력하고 두 가지 동의에 모두 체크하면 신청할 수 있어요.'}
              </span>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

/** Renders the node to a PNG; phones get the share sheet ("이미지 저장"), others a download */
async function saveAsImage(node: HTMLElement, fileName: string) {
  const padding = 24
  const cardBg = getComputedStyle(node.closest('.apply-done__card') ?? node).backgroundColor
  const backgroundColor = cardBg === 'rgba(0, 0, 0, 0)' ? '#f3f4f9' : cardBg
  const blob = await toBlob(node, {
    pixelRatio: 2,
    backgroundColor,
    width: node.offsetWidth + padding * 2,
    height: node.offsetHeight + padding * 2,
    style: { margin: '0', padding: `${padding}px`, boxSizing: 'content-box' },
    filter: (el) => !(el instanceof HTMLElement && el.dataset.captureIgnore !== undefined),
  })
  if (!blob) throw new Error('이미지를 만들지 못했습니다')

  const file = new File([blob], fileName, { type: 'image/png' })
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function SaveImageDialog({
  open,
  saving,
  error,
  onSave,
  onClose,
}: {
  open: boolean
  saving: boolean
  error: string | null
  onSave: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="apply-dialog"
      aria-labelledby="save-image-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="apply-dialog__body">
        <span className="apply-dialog__icon" aria-hidden>↓</span>
        <h2 id="save-image-title">프로그램 정보를 이미지로 저장하시겠습니까?</h2>
        <p>참가 안내를 이미지로 저장해 두면 행사 당일에도 쉽게 확인할 수 있어요.</p>
        {error && <p className="apply-dialog__error">{error}</p>}
        <div className="apply-dialog__actions">
          <button type="button" className="apply-dialog__cancel" onClick={onClose}>
            취소
          </button>
          <button type="button" className="apply-dialog__save" onClick={onSave} disabled={saving}>
            {saving ? '저장 중…' : '저장하기'}
          </button>
        </div>
      </div>
    </dialog>
  )
}

function ApplyDone({ p, videoByEmail = false }: { p: Program; videoByEmail?: boolean }) {
  const captureRef = useRef<HTMLDivElement>(null)
  // Offer to save right after completing the application
  const [dialogOpen, setDialogOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summary = [
    ['프로그램', p.name],
    ['일시', p.when],
    ['장소', p.where ?? '메인 무대'],
  ]

  const save = async () => {
    if (!captureRef.current) return
    setSaving(true)
    setError(null)
    try {
      await document.fonts.ready
      await saveAsImage(captureRef.current, `${p.name}_참가안내.png`)
      setDialogOpen(false)
    } catch {
      setError('이미지를 저장하지 못했어요. 화면을 캡처해 저장해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="apply-done">
      <div className="apply-done__card">
        <span className="apply-done__check" aria-hidden>✓</span>
        <h1>신청이 완료되었습니다</h1>
        <p className="apply-done__lead">
          입력하신 연락처로 접수 확인 문자가 발송됩니다.
          <br />
          {p.doneNote}
        </p>

        {/* Everything in here is what gets saved as the image */}
        <div ref={captureRef} className="apply-done__capture">
          {videoByEmail && (
            <div className="apply-done__video">
              <strong>영상 파일을 이메일로 보내주세요</strong>
              <p>
                링크 대신 이메일 제출을 선택하셨어요. 영상 파일을 이메일(
                <a href={`mailto:${VIDEO_EMAIL}`}>{VIDEO_EMAIL}</a>)로 보내주세요.
                <br />
                메일 제목에 팀명(이름)과 연락처를 적어 주세요.
              </p>
            </div>
          )}
          <div className="apply-done__summary">
            {summary.map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>

          <div className="apply-done__guide">
            <div className="apply-done__guide-head">
              <strong>{p.name} 참가 안내</strong>
              <button
                type="button"
                className="apply-done__save"
                data-capture-ignore
                onClick={() => {
                  setError(null)
                  setDialogOpen(true)
                }}
              >
                이미지로 저장 ↓
              </button>
            </div>
            <InfoRows p={p} compact />
            <Notice p={p} />
            <Steps p={p} compact />
            <Tables p={p} compact />
            <span className="apply-done__contact">
              문의 · 이메일: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> · 전화번호:{' '}
              <a href={`tel:${CONTACT_TEL.replace(/\D/g, '')}`}>{CONTACT_TEL}</a>
            </span>
          </div>
        </div>

        <a className="apply-done__home" href={MAIN_URL}>메인으로</a>
      </div>

      <SaveImageDialog
        open={dialogOpen}
        saving={saving}
        error={error}
        onSave={save}
        onClose={() => setDialogOpen(false)}
      />
    </section>
  )
}

export default function ApplicationPage({ programKey }: { programKey: ProgramKey }) {
  const p: Program = PROGRAMS[programKey]
  const [done, setDone] = useState(false)
  const [videoByEmail, setVideoByEmail] = useState(false)

  useEffect(() => {
    document.title = `${p.name} 참가신청 | 2026 용담용연 음악회 문화제`
  }, [p.name])

  return (
    <div className="apply-page">
      <header className="apply-header">
        <a href={MAIN_URL} className="apply-header__title">2026 용담용연 음악회·문화제</a>
        {!done && (
          <a href={PROGRAM_LIST_URL} className="apply-header__back">
            ← <span className="desktop-only">전체 프로그램</span><span className="mobile-only">목록</span>
          </a>
        )}
      </header>
      {done ? (
        <ApplyDone p={p} videoByEmail={videoByEmail} />
      ) : (
        <ApplyForm
          programKey={programKey}
          p={p}
          onDone={(result) => {
            setVideoByEmail(result.videoByEmail)
            setDone(true)
            window.scrollTo({ top: 0, behavior: 'instant' })
          }}
        />
      )}
    </div>
  )
}
