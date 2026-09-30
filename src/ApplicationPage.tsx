import { useEffect, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import { GUARDIAN_FIELDS, PROGRAMS, VIDEO_EMAIL } from './applications'
import type { FieldDef, FormValues, Program, ProgramKey } from './applications'
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
        fields: Array.from({ length: n }, (_, i): FieldDef => [`mate${i}`, `동반 참가자 ${i + 1} 이름`, 'text', '이름']),
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
}

function Field({ def: [key, label, type, extra], required, values, set }: FieldProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const value = values[key]
  const text = typeof value === 'string' ? value : ''
  const placeholder = typeof extra === 'string' ? extra : ''
  const options = Array.isArray(extra) ? extra : []
  const id = `field-${key}`

  return (
    <div className={`apply-field${FULL_WIDTH_TYPES.includes(type) ? ' apply-field--full' : ''}`}>
      {type !== 'check' && (
        <label className="apply-label" htmlFor={id}>
          {label} {required && type !== 'rules' && <span className="apply-star">*</span>}
        </label>
      )}

      {(type === 'text' || type === 'tel') && (
        <input
          id={id}
          className="apply-input"
          type={type}
          placeholder={placeholder}
          value={text}
          onChange={(e) => set(key, e.target.value)}
        />
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
            {options.map((o) => (
              <option key={o} value={o}>{o === '기타' ? '기타 (직접 입력)' : `${o}명`}</option>
            ))}
          </select>
          {text === '기타' && (
            <input
              className="apply-etc-input"
              placeholder="인원을 직접 입력해 주세요 (예: 12명)"
              value={String(values[`${key}Etc`] ?? '')}
              onChange={(e) => set(`${key}Etc`, e.target.value)}
            />
          )}
        </>
      )}

      {type === 'choice' && (
        <div className="apply-chips" role="radiogroup" id={id}>
          {options.map((o) => {
            const selected = value === o
            return (
              <div
                key={o}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                className={`apply-chip${selected ? ' is-selected' : ''}`}
                onClick={() => set(key, selected ? undefined : o)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    set(key, selected ? undefined : o)
                  }
                }}
              >
                {o}
                {o === '기타' && selected && (
                  <input
                    className="apply-chip-input"
                    placeholder="직접 입력"
                    value={String(values[`${key}Etc`] ?? '')}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onChange={(e) => set(`${key}Etc`, e.target.value)}
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
            유튜브·구글 드라이브 등 영상 링크를 입력해 주세요. 링크가 없으면{' '}
            <a href={`mailto:${VIDEO_EMAIL}`}>{VIDEO_EMAIL}</a>로 영상 파일을 보내주세요.
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
        <div className="apply-file">
          <input
            id={id}
            className="apply-input apply-file-name"
            placeholder={placeholder}
            value={text}
            onChange={(e) => set(key, e.target.value)}
          />
          <input
            ref={fileInput}
            type="file"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) set(key, file.name)
            }}
          />
          <button type="button" className="apply-file-button" onClick={() => fileInput.current?.click()}>
            파일 첨부
          </button>
        </div>
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
  if (!p.steps) return null
  return (
    <div className={compact ? 'apply-steps apply-steps--compact' : 'apply-steps'}>
      <span className="apply-box-title">참가방법</span>
      <ol>
        {p.steps.map(([t, d], i) => (
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

function ApplyForm({ p, onSubmit }: { p: Program; onSubmit: () => void }) {
  const [values, setValues] = useState<FormValues>({})
  const set = (key: string, value: string | boolean | undefined) => setValues((v) => ({ ...v, [key]: value }))
  const agreed = !!values.agreePriv
  const sections = buildSections(p, values)
  const canSubmit =
    agreed && sections.every((sec) => !sec.required || sec.fields.every((def) => isAnswered(def, values)))

  return (
    <>
      <section className="apply-hero">
        <span className="apply-hero__eyebrow">참가신청</span>
        <h1>{p.name}</h1>
        <span className="apply-hero__sub">{p.sub}</span>
        <div className="apply-hero__badges">
          <span className="apply-badge apply-badge--gold">{p.cap}</span>
          <span className="apply-badge">QR 온라인 사전접수</span>
        </div>
      </section>

      <div className="apply-body">
        <aside className="apply-aside">
          <InfoRows p={p} />
          <Notice p={p} />
          <Steps p={p} />
          <Tables p={p} />
        </aside>

        <form
          className="apply-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) onSubmit()
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
                  <Field key={def[0]} def={def} required={sec.required} values={values} set={set} />
                ))}
              </div>
            </div>
          ))}

          <div className="apply-section apply-agree">
            <div className="apply-section__head">
              <span className="apply-section__title">동의</span>
            </div>
            <button
              type="button"
              role="checkbox"
              aria-checked={agreed}
              className={`apply-agree__item${agreed ? ' is-checked' : ''}`}
              onClick={() => set('agreePriv', !agreed)}
            >
              <Checkbox checked={agreed} />
              <div>
                <strong>개인정보 수집·이용 동의 <span className="apply-star">(필수)</span></strong>
                <span>
                  <span className="desktop-only">수집 목적: 접수·연락·안전관리·운영 · 행사 종료 후 파기</span>
                  <span className="mobile-only">목적: 접수·연락·안전관리·운영</span>
                </span>
              </div>
            </button>
            <button
              type="button"
              role="checkbox"
              aria-checked={!!values.agreePhoto}
              className={`apply-agree__item${values.agreePhoto ? ' is-checked' : ''}`}
              onClick={() => set('agreePhoto', !values.agreePhoto)}
            >
              <Checkbox checked={!!values.agreePhoto} />
              <div>
                <strong>사진·영상 촬영 및 홍보 활용 동의 <span className="apply-optional">(선택)</span></strong>
                <span>
                  <span className="desktop-only">행사 기록 및 홍보물·SNS 게시에 활용 · </span>동의하지 않아도 참가할 수 있어요
                </span>
              </div>
            </button>
          </div>

          <div className="apply-submit">
            {p.early && <span className="apply-submit__early">모집인원 마감 시 조기마감될 수 있습니다</span>}
            <button type="submit" className="apply-submit__button" disabled={!canSubmit}>
              신청하기
            </button>
            <span className="apply-submit__hint">
              {canSubmit
                ? '신청 완료 후 입력하신 연락처로 접수 확인 문자가 발송됩니다.'
                : '필수 항목(*)을 모두 입력하고 개인정보 수집·이용에 동의하면 신청할 수 있어요.'}
            </span>
          </div>
        </form>
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

function ApplyDone({ p }: { p: Program }) {
  const captureRef = useRef<HTMLDivElement>(null)
  // Offer to save right after completing the application
  const [dialogOpen, setDialogOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summary = [
    ['프로그램', p.name],
    ['일시', p.when],
    ['장소', '용연 구름다리 일대'],
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
              문의 · 용담1동<span className="desktop-only">주민센터</span> 064-728-4592 · 용담2동
              <span className="desktop-only">주민센터</span> 064-728-4637
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
        <ApplyDone p={p} />
      ) : (
        <ApplyForm
          p={p}
          onSubmit={() => {
            setDone(true)
            window.scrollTo({ top: 0, behavior: 'instant' })
          }}
        />
      )}
    </div>
  )
}
