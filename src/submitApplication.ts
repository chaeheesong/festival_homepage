import type { FormValues, ProgramKey } from './applications'
import { supabase } from './supabase'

const FILE_BUCKET = 'application-files'

/** The database refused the application because the chosen group is (now) full */
export class CapacityError extends Error {}

/**
 * Uploads attached files to Storage, then inserts the application row.
 * Throws an Error with a message that can be shown to the applicant.
 */
/** Seats left per group, e.g. { 용담1동: 12, 용담2동: 35 }; null when unavailable */
export async function fetchRemaining(rpc: string): Promise<Record<string, number> | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc(rpc)
  if (error) {
    console.error('[supabase] remaining seats lookup failed', error)
    return null
  }
  return data as Record<string, number>
}

export async function submitApplication(program: ProgramKey, values: FormValues, files: Record<string, File>) {
  if (!supabase) throw new Error('신청 접수 설정이 아직 완료되지 않았어요. 담당자에게 문의해 주세요.')

  const { agreePriv, agreePhoto, ...rest } = values
  const answers: Record<string, unknown> = rest

  // Random object names: Storage keys can't hold Korean file names, and they must not collide
  for (const [key, file] of Object.entries(files)) {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
    const path = `${program}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(FILE_BUCKET).upload(path, file, { contentType: file.type })
    if (error) {
      console.error('[supabase] upload failed', error)
      throw new Error('첨부파일을 올리지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
    answers[key] = path
    answers[`${key}FileName`] = file.name
  }

  // No .select(): the anon role may insert but not read rows back
  const { error } = await supabase.from('applications').insert({
    program,
    name: typeof values.name === 'string' ? values.name : null,
    tel: typeof values.tel === 'string' ? values.tel : null,
    answers,
    agree_privacy: agreePriv === true,
    agree_photo: agreePhoto === true,
  })
  if (error) {
    if (error.message?.includes('capacity_exceeded')) {
      throw new CapacityError('그 사이 다른 신청이 들어와 남은 자리가 줄었어요. 남은 자리를 확인하고 다시 신청해 주세요.')
    }
    console.error('[supabase] insert failed', error)
    throw new Error('신청을 접수하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
}
