function WaveMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 10.5c3.5 0 4.5 3 7.8 3s4.4-3 7.7-3 4.4 3 6.5 3" />
      <path d="M5 16c3.5 0 4.5 3 7.8 3s4.4-3 7.7-3 4.4 3 6.5 3" />
      <path d="M5 21.5c3.5 0 4.5 3 7.8 3s4.4-3 7.7-3 4.4 3 6.5 3" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4v12m0 0 4-4m-4 4-4-4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 5h8m4 0h2M3 10h2m4 0h8M3 15h7m4 0h3" />
      <circle cx="13" cy="5" r="2" />
      <circle cx="7" cy="10" r="2" />
      <circle cx="12" cy="15" r="2" />
    </svg>
  );
}

const journey = [
  [
    '01',
    'Connect with confidence',
    'Account and network context stay visible before any signature.',
  ],
  [
    '02',
    'Review every boundary',
    'Minimum received, route, fees, and expiry belong next to the decision.',
  ],
  [
    '03',
    'Track the real outcome',
    'Submitted is not confirmed. Every transaction keeps a clear lifecycle.',
  ],
] as const;

const principles = [
  {
    label: 'Context first',
    title: 'Know what you sign',
    detail: 'Network, account, token identity, and spender are designed to remain in view.',
  },
  {
    label: 'Bounded outcomes',
    title: 'See the downside',
    detail: 'Quote expiry and minimum received are treated as decision inputs, not fine print.',
  },
  {
    label: 'Honest status',
    title: 'Follow finality',
    detail: 'The interface distinguishes wallet approval, submission, confirmation, and failure.',
  },
] as const;

export default function Home() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="app-header">
        <a className="brand" href="#top" aria-label="WhaleDEX home">
          <span className="brand-mark">
            <WaveMark />
          </span>
          <span>
            <strong>WhaleDEX</strong>
            <small>Testnet workspace</small>
          </span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          <a href="#swap" aria-current="page">
            Swap
          </a>
          <span aria-disabled="true">Activity</span>
        </nav>

        <span className="prototype-badge">
          <span aria-hidden="true" />
          Prototype · No live data
        </span>
      </header>

      <main id="main-content">
        <section className="workspace" id="top" aria-labelledby="page-title">
          <div className="context-panel">
            <p className="eyebrow">Requirements-led product preview</p>
            <h1 id="page-title">Trade with context, not guesswork.</h1>
            <p className="hero-copy">
              A focused preview of WhaleDEX&apos;s proposed testnet swap experience. The interface
              makes permission, price boundaries, and transaction state visible before they become
              real product behaviour.
            </p>

            <div className="prototype-note" role="note" aria-label="Prototype limitation">
              <span className="note-icon" aria-hidden="true">
                i
              </span>
              <div>
                <strong>Interface preview only</strong>
                <p>Wallet, network, quote provider, and contracts are not connected.</p>
              </div>
            </div>

            <ol className="journey-list" aria-label="Proposed swap journey">
              {journey.map(([number, title, description]) => (
                <li key={number}>
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <section className="swap-card" id="swap" aria-labelledby="swap-title">
            <div className="swap-card-header">
              <div>
                <p className="section-kicker">Testnet preview</p>
                <h2 id="swap-title">Swap</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Swap settings unavailable"
                disabled
              >
                <SettingsIcon />
              </button>
            </div>

            <form className="swap-form" aria-label="Swap preview" aria-describedby="swap-help">
              <div className="asset-field">
                <div className="field-heading">
                  <label htmlFor="pay-amount">You pay</label>
                  <span>Balance —</span>
                </div>
                <div className="amount-row">
                  <input id="pay-amount" inputMode="decimal" placeholder="0.00" disabled />
                  <button type="button" className="token-button" disabled>
                    Select token
                    <ChevronDown />
                  </button>
                </div>
                <p className="fiat-value" aria-label="Fiat value unavailable">
                  $—
                </p>
              </div>

              <div className="direction-divider" aria-hidden="true">
                <span>
                  <ArrowDown />
                </span>
              </div>

              <div className="asset-field">
                <div className="field-heading">
                  <label htmlFor="receive-amount">You receive</label>
                  <span>Balance —</span>
                </div>
                <div className="amount-row">
                  <input id="receive-amount" inputMode="decimal" placeholder="0.00" disabled />
                  <button type="button" className="token-button" disabled>
                    Select token
                    <ChevronDown />
                  </button>
                </div>
                <p className="fiat-value" aria-label="Fiat value unavailable">
                  $—
                </p>
              </div>

              <dl className="quote-summary">
                <div>
                  <dt>Rate</dt>
                  <dd>—</dd>
                </div>
                <div>
                  <dt>Minimum received</dt>
                  <dd>—</dd>
                </div>
                <div>
                  <dt>Network fee</dt>
                  <dd>—</dd>
                </div>
              </dl>

              <button className="primary-action" type="button" disabled>
                Wallet integration pending
              </button>
              <p id="swap-help" className="form-help">
                Trading remains unavailable until a network and protocol deployment are approved.
              </p>
            </form>
          </section>
        </section>

        <section className="principles" aria-labelledby="principles-title">
          <div className="section-intro">
            <p className="eyebrow">Designed for safer decisions</p>
            <h2 id="principles-title">The critical details stay visible.</h2>
          </div>
          <div className="principle-grid">
            {principles.map((principle) => (
              <article key={principle.label}>
                <span>{principle.label}</span>
                <h3>{principle.title}</h3>
                <p>{principle.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <span>WhaleDEX product preview</span>
        <span>Built from the Chapter 3 requirements baseline</span>
      </footer>
    </div>
  );
}
