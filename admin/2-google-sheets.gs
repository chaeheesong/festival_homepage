/**
 * 용담용연 음악회·문화제 신청 내역 → 구글 시트
 *
 * 설치 (처음 한 번)
 * 1. 새 구글 시트 → 확장 프로그램 → Apps Script → 이 파일 내용을 통째로 붙여 넣고 저장
 * 2. 왼쪽 톱니바퀴(프로젝트 설정) → 맨 아래 "스크립트 속성" → 3개 추가
 *      SUPABASE_URL   https://xxxx.supabase.co
 *      SUPABASE_KEY   sb_publishable_...   (홈페이지 .env 의 VITE_SUPABASE_ANON_KEY 와 같은 값)
 *      EXPORT_TOKEN   1-supabase-export.sql 을 실행했을 때 나온 token 값
 * 3. 위쪽 함수 목록에서 refreshAll 선택 → 실행 → 권한 허용
 * 4. 시트를 새로고침하면 메뉴에 "신청 내역"이 생깁니다
 *
 * 자동 새로고침(선택): 함수 목록에서 setupAutoRefresh 실행 → 10분마다 갱신
 */

const PROGRAMS = [
  ['walk', '용의 산책'],
  ['culture', '예술의 물결'],
  ['busking', '찾아가는 버스킹'],
  ['song', '용연가요제'],
  ['runner', '드래곤러너'],
  ['stamp', '찾아라 드래곤볼'],
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('신청 내역')
    .addItem('새로고침', 'refreshAll')
    .addSeparator()
    .addItem('10분마다 자동 새로고침 켜기', 'setupAutoRefresh')
    .addItem('자동 새로고침 끄기', 'stopAutoRefresh')
    .addToUi();
}

function refreshAll() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_KEY');
  const token = props.getProperty('EXPORT_TOKEN');
  if (!url || !key || !token) {
    throw new Error('프로젝트 설정 → 스크립트 속성에 SUPABASE_URL, SUPABASE_KEY, EXPORT_TOKEN 을 넣어 주세요.');
  }
  // Keep only https://xxxx.supabase.co even if a .../rest/v1/ address was pasted
  const origin = (String(url).trim().match(/^https?:\/\/[^/]+/) || [''])[0];
  const endpoint = origin + '/rest/v1/rpc/export_applications';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const updatedAt = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
  const counts = [];

  PROGRAMS.forEach(([program, title]) => {
    const res = UrlFetchApp.fetch(endpoint, {
      method: 'post',
      contentType: 'application/json',
      headers: { apikey: key, Authorization: 'Bearer ' + key },
      payload: JSON.stringify({ p_token: token, p_program: program }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) {
      throw new Error(title + ' 불러오기 실패 (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 200));
    }
    const rows = JSON.parse(res.getContentText()) || [];
    writeSheet(ss, title, rows, updatedAt);
    counts.push(title + ' ' + rows.length + '건');
  });

  ss.toast(counts.join(' · '), '새로고침 완료 (' + updatedAt + ')', 8);
}

function writeSheet(ss, title, rows, updatedAt) {
  const sheet = ss.getSheetByName(title) || ss.insertSheet(title);
  sheet.clear();
  if (rows.length === 0) {
    sheet.getRange(1, 1, 2, 1).setValues([['아직 신청이 없습니다'], ['마지막 새로고침: ' + updatedAt]]);
    return;
  }
  const headers = Object.keys(rows[0]);
  const values = rows.map((r) =>
    headers.map((h) => {
      const v = r[h];
      if (v === null || v === undefined) return '';
      // 신청일시: "2026-10-01T14:03:12.123" → "2026-10-01 14:03"
      if (h === '신청일시') return String(v).slice(0, 16).replace('T', ' ');
      return v;
    }),
  );
  // 전화번호 등이 숫자로 바뀌지 않도록 모두 텍스트로 기록
  const range = sheet.getRange(1, 1, values.length + 1, headers.length);
  range.setNumberFormat('@').setValues([headers].concat(values));
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e6ecfb');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  sheet.getRange(values.length + 3, 1).setValue('마지막 새로고침: ' + updatedAt).setFontColor('#8a90a8');
}

function setupAutoRefresh() {
  stopAutoRefresh();
  ScriptApp.newTrigger('refreshAll').timeBased().everyMinutes(10).create();
  SpreadsheetApp.getActiveSpreadsheet().toast('10분마다 자동으로 새로고침합니다.', '자동 새로고침 켜짐', 5);
}

function stopAutoRefresh() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'refreshAll')
    .forEach((t) => ScriptApp.deleteTrigger(t));
}
