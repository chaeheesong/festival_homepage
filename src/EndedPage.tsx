import './EndedPage.css'

// The festival is over, so the whole site is just this thank-you message for now.
// The main page (App.tsx) and application forms (ApplicationPage.tsx) are kept as files.
export default function EndedPage() {
  return (
    <main className="ended">
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
