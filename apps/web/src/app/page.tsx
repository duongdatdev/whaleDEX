import Link from 'next/link';

function WaveMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12c3-4 6-4 9 0 3 4 6 4 9 0 3-4 4-4 4-4" />
      <path d="M2 17c3-4 6-4 9 0 3 4 6 4 9 0 3-4 4-4 4-4" />
      <path d="M2 7c3-4 6-4 9 0 3 4 6 4 9 0 3-4 4-4 4-4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const dualModes = [
  {
    mode: 'swap',
    tag: 'Phổ thông · Nhanh gọn',
    isFeatured: false,
    title: 'Đổi token (Swap)',
    description:
      'Giao diện trực quan một thao tác. Tự động tính toán tỷ giá thực thi tối ưu, bảo vệ trượt giá chặt chẽ và hiển thị lượng nhận tối thiểu trước khi ký ví.',
    features: [
      'Báo giá tức thì từ sổ lệnh DeepBookV3',
      'Mức trượt giá mặc định 0,5%, cảnh báo từ 1%',
      'Tự động giữ gas reserve an toàn cho SUI',
    ],
    ctaText: 'Đến màn hình Swap',
    ctaHref: '#swap-preview',
  },
  {
    mode: 'pro',
    tag: 'Chuyên nghiệp · Sổ lệnh CLOB',
    isFeatured: true,
    title: 'Bàn giao dịch Nâng cao (Pro Terminal)',
    description:
      'Dành cho nhà giao dịch chuyên nghiệp. Hệ thống khớp lệnh trung tâm trực tiếp on-chain, sổ lệnh đa tầng, độ trễ mili-giây và tùy chọn lệnh nâng cao.',
    features: [
      'Sổ lệnh Bid/Ask 10 cấp độ với hiệu ứng Tick-Flash',
      'Lệnh Giới hạn (Limit) và Lệnh Chỉ Maker (Post-Only)',
      'Tách bạch Số dư ví và Tài khoản BalanceManager',
    ],
    ctaText: 'Khám phá Pro Terminal',
    ctaHref: '#pro-preview',
  },
] as const;

const journeySteps = [
  {
    step: '01',
    title: 'Kết nối ví Sui',
    description:
      'Hỗ trợ các ví chuẩn Sui như Sui Wallet, Suiet, Nightly. Thông tin tài khoản và mạng được kiểm tra tự động trước mọi thao tác.',
  },
  {
    step: '02',
    title: 'Nhận token Faucet',
    description:
      'Nhận token thử nghiệm (SUI, USDC, DEEP) hoàn toàn miễn phí từ vòi Faucet chính thức trên Sui Testnet để trải nghiệm không rủi ro.',
  },
  {
    step: '03',
    title: 'Xem trước & Ký xác nhận',
    description:
      'Quy trình Review 2 bước minh bạch: tỷ giá, tác động giá, phí gas ước tính và lượng nhận tối thiểu hiển thị đầy đủ trước khi mở ví ký.',
  },
] as const;

const faqs = [
  {
    question: 'Token trên sàn có giá trị tiền thật không?',
    answer:
      'Hoàn toàn không. WhaleDEX hiện đang vận hành trên môi trường Sui Testnet. Toàn bộ các token như SUI, USDC, DEEP đều là tài sản thử nghiệm dùng để kiểm thử tính năng và không có giá trị quy đổi tài chính thực tế.',
  },
  {
    question: 'BalanceManager là gì và tại sao cần sử dụng?',
    answer:
      'BalanceManager là đối tượng tài khoản giao dịch on-chain trên DeepBookV3. Nó giữ tài sản ký quỹ để đặt và khớp lệnh tức thì mà không cần bạn phải ký ví từng lệnh nhỏ. Bạn giữ toàn quyền nạp và rút tài sản về ví cá nhân bất kỳ lúc nào.',
  },
  {
    question: 'Làm thế nào để nhận token SUI và token thử nghiệm?',
    answer:
      'Bạn có thể dùng tính năng Faucet tích hợp sẵn trong ví Sui (Sui Wallet / Suiet) hoặc qua kênh Discord chính thức của Sui Network để nhận SUI Testnet miễn phí dùng trả phí gas mạng.',
  },
  {
    question: 'Chi phí giao dịch trên WhaleDEX được tính như thế nào?',
    answer:
      'Mỗi giao dịch chỉ gồm 2 khoản phí minh bạch: Phí gas mạng Sui (thường dưới 0.01 SUI) và Phí giao thức DeepBookV3 (Maker/Taker theo quy chuẩn giao thức). WhaleDEX tuyệt đối không thu thêm bất kỳ phụ phí ẩn nào.',
  },
] as const;

export default function Home() {
  return (
    <div className="app-shell">
      {/* Accessibility Skip Link */}
      <a className="skip-link" href="#main-content">
        Chuyển đến nội dung chính
      </a>

      {/* Fixed Top Testnet Banner */}
      <div className="testnet-banner" role="region" aria-label="Môi trường thử nghiệm">
        <strong>Sui Testnet:</strong> token thử nghiệm không có giá trị thật.
      </div>

      {/* Terminal Header */}
      <header className="app-header">
        <div className="container header-inner">
          <Link className="brand-group" href="/" aria-label="Trang chủ WhaleDEX">
            <span className="brand-mark">
              <WaveMark />
            </span>
            <span className="brand-name">
              WhaleDEX
              <span className="brand-badge">Sui CLOB</span>
            </span>
          </Link>

          <nav className="primary-nav" aria-label="Điều hướng chính">
            <Link className="nav-link active" href="/">
              WhaleDEX
            </Link>
            <a className="nav-link" href="#modes">
              Giao dịch
            </a>
            <a className="nav-link" href="#markets">
              Thị trường
            </a>
            <a className="nav-link" href="#journey">
              Hướng dẫn
            </a>
            <a className="nav-link" href="#faq">
              Hỏi đáp
            </a>
          </nav>

          <div className="header-actions">
            <div className="telemetry-badge" title="Độ trễ RPC mạng Sui Testnet">
              <span className="pulse-dot" aria-hidden="true" />
              <span className="tabular-nums">24ms</span>
              <span>Sui Testnet</span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              aria-label="Kết nối ví Sui"
            >
              Kết nối ví Sui
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-content">
                <div className="eyebrow-tag">
                  <span className="pulse-dot" aria-hidden="true" />
                  DeepBookV3 Spot DEX · Sui Testnet
                </div>

                <h1 id="hero-title" className="hero-title">
                  Sàn giao dịch Spot phi tập trung trên Sui Testnet
                </h1>

                <p className="hero-subtitle">
                  Giao dịch không lưu ký qua sổ lệnh DeepBookV3. Toàn quyền kiểm soát tài sản,
                  khớp lệnh on-chain tốc độ cao với phí gas tối thiểu.
                </p>

                <div className="hero-actions">
                  <a href="#modes" className="btn btn-primary">
                    Mở ứng dụng
                    <ArrowRightIcon />
                  </a>
                  <a href="#journey" className="btn btn-secondary">
                    Hướng dẫn Testnet
                  </a>
                </div>
              </div>

              {/* Terminal Radar Graphic */}
              <div className="terminal-card" aria-label="Thông số kỹ thuật mạng và giao thức">
                <div className="terminal-card-header">
                  <div className="terminal-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="terminal-label">WHALEDEX_PROTOCOL // LIVE_METRICS</span>
                </div>

                <div className="terminal-card-body">
                  <div className="radar-display">
                    <div className="radar-head">
                      <span>Cơ chế khớp lệnh</span>
                      <span className="brand-badge">CLOB On-chain</span>
                    </div>
                    <div className="radar-metrics">
                      <div className="metric-box">
                        <p className="metric-label">Giao thức</p>
                        <p className="metric-value primary">DeepBookV3</p>
                      </div>
                      <div className="metric-box">
                        <p className="metric-label">Phí gas ước tính</p>
                        <p className="metric-value positive tabular-nums">&lt; 0.01 SUI</p>
                      </div>
                      <div className="metric-box">
                        <p className="metric-label">Lưu ký tài sản</p>
                        <p className="metric-value positive">100% Tự lưu ký</p>
                      </div>
                      <div className="metric-box">
                        <p className="metric-label">Thời gian xác nhận</p>
                        <p className="metric-value tabular-nums">~300ms</p>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Chuẩn minh bạch: Không tạo khối lượng ảo, không đòn bẩy rủi ro, mọi trạng thái
                    giao dịch đều hiển thị mã băm (Digest) đối soát trên Sui Explorer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dual-Mode Section */}
        <section id="modes" className="section" aria-labelledby="modes-title">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">Linh hoạt theo nhu cầu</p>
              <h2 id="modes-title" className="section-title">
                Hai chế độ giao dịch chuyên biệt
              </h2>
              <p className="section-description">
                Chuyển đổi liền mạch giữa giao diện Đổi token tối giản và Bàn giao dịch chuyên nghiệp
                với đầy đủ công cụ phân tích sổ lệnh.
              </p>
            </div>

            <div className="dual-mode-grid">
              {dualModes.map((item) => (
                <article key={item.mode} className="mode-card">
                  <div>
                    <span className={`mode-tag ${item.isFeatured ? 'featured' : ''}`}>
                      {item.tag}
                    </span>
                    <h3 className="mode-title">{item.title}</h3>
                    <p className="mode-desc">{item.description}</p>
                  </div>

                  <ul className="feature-list" aria-label={`Tính năng của ${item.title}`}>
                    {item.features.map((feature) => (
                      <li key={feature} className="feature-item">
                        <span className="feature-check" aria-hidden="true">
                          <CheckIcon />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a href={item.ctaHref} className={`btn ${item.isFeatured ? 'btn-primary' : 'btn-secondary'}`}>
                    {item.ctaText}
                    <ArrowRightIcon />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3-Step Journey Section */}
        <section id="journey" className="section" aria-labelledby="journey-title">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">Bắt đầu trong 3 phút</p>
              <h2 id="journey-title" className="section-title">
                Quy trình tiếp cận an toàn trên Sui Testnet
              </h2>
              <p className="section-description">
                Được thiết kế để bạn luôn nắm rõ quyền kiểm soát ví và ranh giới giá trước khi bất kỳ
                giao dịch nào được ký.
              </p>
            </div>

            <div className="journey-grid">
              {journeySteps.map((step) => (
                <article key={step.step} className="journey-step">
                  <span className="step-number">{step.step}</span>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">Giải đáp thắc mắc</p>
              <h2 id="faq-title" className="section-title">
                Câu hỏi thường gặp
              </h2>
              <p className="section-description">
                Thông tin minh bạch về cơ chế hoạt động, phí giao dịch và tài sản trên môi trường thử nghiệm.
              </p>
            </div>

            <div className="faq-list">
              {faqs.map((faq, index) => (
                <details key={faq.question} className="faq-item" open={index === 0}>
                  <summary className="faq-summary">
                    <span>{faq.question}</span>
                    <span className="faq-icon" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="faq-content">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* App Footer */}
      <footer className="app-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="brand-group">
              <span className="brand-mark">
                <WaveMark />
              </span>
              <span className="brand-name">WhaleDEX</span>
            </div>
            <p className="footer-desc">
              Sàn giao dịch Spot phi tập trung trên Sui Testnet, xây dựng trên nền tảng sổ lệnh
              DeepBookV3. Khớp lệnh minh bạch, tốc độ cao và hoàn toàn không lưu ký.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <p className="footer-col-title">Sản phẩm</p>
              <a href="#modes">Đổi token (Swap)</a>
              <a href="#modes">Bàn giao dịch (Pro)</a>
              <a href="#markets">Thị trường</a>
            </div>

            <div className="footer-col">
              <p className="footer-col-title">Học tập & Tài liệu</p>
              <a href="#journey">Hướng dẫn Faucet</a>
              <a href="#faq">Câu hỏi thường gặp</a>
              <a href="https://docs.sui.io" target="_blank" rel="noopener noreferrer">
                Sui Documentation
              </a>
            </div>

            <div className="footer-col">
              <p className="footer-col-title">Giao thức</p>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                DeepBookV3 CLOB
              </span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Mạng: Sui Testnet
              </span>
            </div>
          </div>
        </div>

        <div className="container" style={{ marginTop: 'var(--space-6)' }}>
          <div className="footer-bottom">
            <span>© 2026 WhaleDEX Foundation. Bảo lưu mọi quyền.</span>
            <span>Môi trường thử nghiệm Sui Testnet · Không sử dụng tiền thật</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

