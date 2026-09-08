export default function Home() {
  return (
    <main className="shell">
      <header className="brand" aria-label="WhaleDEX">
        <span className="brand-mark" aria-hidden="true">
          W
        </span>
        WhaleDEX
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">WhaleDEX / Foundation</p>
        <h1 id="page-title">DEX App</h1>
        <p className="description">A clean foundation for what comes next.</p>
        <span className="status">
          <span aria-hidden="true" />
          Frontend is ready
        </span>
      </section>
      <footer>WhaleDEX — Project foundation</footer>
    </main>
  );
}
