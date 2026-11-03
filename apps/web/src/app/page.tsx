import Link from 'next/link';
import { WalletLoader } from '../components/wallet-loader';

const productFacts = [
  ['Mạng', 'Sui Testnet'],
  ['Thanh khoản', 'DeepBookV3'],
  ['Loại giao dịch', 'Spot'],
  ['Lưu ký', 'Không lưu ký'],
] as const;

const marketRows = [
  { pair: 'SUI / DBUSDC', source: 'DeepBookV3', status: 'Xem sổ lệnh Testnet' },
] as const;

const journeySteps = [
  {
    title: 'Kết nối ví Sui',
    description: 'WhaleDEX sẽ kiểm tra đúng mạng Sui Testnet trước khi cho phép tạo giao dịch.',
  },
  {
    title: 'Nhận token thử nghiệm',
    description:
      'Dùng faucet chính thức để nhận SUI Testnet trả phí gas. Token thử nghiệm không có giá trị thật.',
  },
  {
    title: 'Xem lại và ký',
    description: 'Kiểm tra tỷ giá, tác động giá, phí mạng và lượng nhận tối thiểu trước khi mở ví.',
  },
] as const;

const faqs = [
  {
    question: 'Token trên WhaleDEX có giá trị tiền thật không?',
    answer:
      'Không. Phiên bản hiện tại nhắm tới Sui Testnet. SUI, USDC, DEEP và các tài sản hiển thị trong giao diện đều là dữ liệu hoặc token thử nghiệm.',
  },
  {
    question: 'Giao diện này đã giao dịch được chưa?',
    answer:
      'Đã có kết nối ví, sổ lệnh, báo giá, mô phỏng và yêu cầu ký swap SUI/DBUSDC trên Testnet. Luồng ký và xác nhận vẫn cần nghiệm thu end-to-end bằng ví thật; Limit order chưa khả dụng.',
  },
  {
    question: 'WhaleDEX có còn là DEX khi dùng DeepBookV3 không?',
    answer:
      'Có. Lệnh được xử lý qua hạ tầng sổ lệnh on-chain của DeepBookV3 trên Sui. Người dùng kiểm soát ví và chỉ ký khi đã xem lại giao dịch.',
  },
  {
    question: 'Phí giao dịch được hiển thị như thế nào?',
    answer:
      'Màn hình xem lại tách phí gas Sui được mô phỏng và lượng DEEP cấp cho phí DeepBookV3. Dữ liệu được đọc trực tiếp từ Sui; phần dư được trả về ví.',
  },
] as const;

function PreviewStatus() {
  return (
    <span className="preview-status">
      <span aria-hidden="true" className="status-square" />
      Dữ liệu chưa kết nối
    </span>
  );
}

function SwapPreview() {
  return (
    <article id="swap-preview" className="product-panel swap-panel" aria-labelledby="swap-title">
      <h3 id="swap-title">Đổi token Testnet</h3>
      <p className="panel-note">
        Swap SUI/DBUSDC với báo giá, mô phỏng, giới hạn lượng nhận tối thiểu và chữ ký từ ví của
        bạn.
      </p>
      <a className="btn btn-primary" href="#trade">
        Mở swap SUI / DBUSDC
      </a>
    </article>
  );
}

function ProPreview() {
  return (
    <article id="pro-preview" className="product-panel pro-panel" aria-labelledby="pro-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Bản xem trước giao diện</p>
          <h3 id="pro-title">Pro Terminal</h3>
        </div>
        <PreviewStatus />
      </div>

      <div className="terminal-tabs" aria-label="Cặp giao dịch minh họa">
        <span className="terminal-tab active">SUI / USDC</span>
        <span className="terminal-tab">DEEP / SUI</span>
      </div>

      <div className="orderbook" aria-label="Sổ lệnh chưa có dữ liệu">
        <div className="orderbook-head">
          <span>Giá</span>
          <span>Khối lượng</span>
          <span>Tổng</span>
        </div>
        <div className="empty-orderbook">
          <p>Sổ lệnh chưa được kết nối</p>
          <span>Bid và Ask sẽ xuất hiện từ DeepBookV3.</span>
        </div>
      </div>

      <div className="terminal-order-row">
        <div>
          <span className="field-caption">Loại lệnh</span>
          <strong>Limit</strong>
        </div>
        <div>
          <span className="field-caption">Giá</span>
          <strong className="tabular-nums">--</strong>
        </div>
        <div>
          <span className="field-caption">Số lượng</span>
          <strong className="tabular-nums">--</strong>
        </div>
      </div>

      <button className="btn btn-disabled btn-block" type="button" disabled>
        Đặt lệnh chưa khả dụng
      </button>
    </article>
  );
}

export default function Home() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Chuyển đến nội dung chính
      </a>

      <div className="testnet-banner" role="region" aria-label="Môi trường thử nghiệm">
        <strong>Sui Testnet:</strong> token thử nghiệm không có giá trị thật. Không dùng tiền thật.
      </div>

      <header className="app-header">
        <div className="container header-inner">
          <Link className="brand-group" href="/" aria-label="Trang chủ WhaleDEX">
            <span className="brand-monogram" aria-hidden="true">
              W
            </span>
            <span className="brand-name">WhaleDEX</span>
            <span className="network-label">Sui Testnet</span>
          </Link>

          <nav className="primary-nav" aria-label="Điều hướng chính">
            <a className="nav-link" href="#trade">
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

          <a className="btn btn-header" href="#trade">
            Kết nối ví Sui
          </a>
        </div>
      </header>

      <main id="main-content">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="container hero-grid">
            <div className="hero-content">
              <p className="hero-kicker">Spot DEX trên Sui Testnet</p>
              <h1 id="hero-title">
                <span>Giao dịch on-chain.</span>
                <span>Tự giữ tài sản.</span>
              </h1>
              <p className="hero-subtitle">
                Trải nghiệm Swap và sổ lệnh DeepBookV3 trong môi trường thử nghiệm không dùng tiền
                thật.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#trade">
                  Mở giao dịch Testnet
                </a>
                <a className="btn btn-secondary" href="#journey">
                  Cách thử Testnet
                </a>
              </div>
            </div>

            <aside className="protocol-card" aria-label="Thông tin sản phẩm">
              <div className="protocol-card-head">
                <span>Kiến trúc đã chọn</span>
                <span className="ui-only-label">Swap Testnet</span>
              </div>
              <dl className="protocol-facts">
                {productFacts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p>Không hiển thị giá, số dư hay phí giả khi nguồn dữ liệu chưa được kết nối.</p>
            </aside>
          </div>
        </section>

        <section id="trade" className="section" aria-labelledby="trade-title">
          <div className="container">
            <div className="section-heading">
              <h2 id="trade-title">Giao dịch SUI / DBUSDC trên Testnet</h2>
              <p>
                Kết nối ví, kiểm tra báo giá và xem lại trước khi ký. Luồng giao dịch đang chờ
                nghiệm thu end-to-end bằng ví thật.
              </p>
            </div>
            <div className="trading-workspace">
              <WalletLoader />
            </div>
          </div>
        </section>

        <section id="modes" className="section product-section" aria-labelledby="modes-title">
          <div className="container">
            <div className="section-heading">
              <h2 id="modes-title">Swap Testnet và bản xem trước Pro Terminal</h2>
              <p>
                Swap dùng sổ lệnh DeepBookV3. Pro Terminal là bản xem trước cho luồng Limit order
                sắp tới.
              </p>
            </div>
            <div className="product-grid">
              <SwapPreview />
              <ProPreview />
            </div>
          </div>
        </section>

        <section id="markets" className="section markets-section" aria-labelledby="markets-title">
          <div className="container markets-layout">
            <div className="markets-copy">
              <p className="section-kicker">Thị trường</p>
              <h2 id="markets-title">Chỉ hiện số liệu khi có nguồn xác thực</h2>
              <p>
                Market hiện được hỗ trợ là SUI/DBUSDC Testnet. Mở phần giao dịch để đọc sổ lệnh,
                nguồn pool và thời điểm cập nhật trực tiếp từ Sui.
              </p>
            </div>

            <div
              className="market-table-wrap"
              role="region"
              aria-label="Market Testnet được hỗ trợ"
              tabIndex={0}
            >
              <table className="market-table">
                <thead>
                  <tr>
                    <th scope="col">Cặp giao dịch</th>
                    <th scope="col">Nguồn</th>
                    <th scope="col">Giá gần nhất</th>
                    <th scope="col">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {marketRows.map((market) => (
                    <tr key={market.pair}>
                      <th scope="row">{market.pair}</th>
                      <td>{market.source}</td>
                      <td className="tabular-nums">--</td>
                      <td>
                        <a className="table-status" href="#trade">
                          {market.status}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="journey" className="section journey-section" aria-labelledby="journey-title">
          <div className="container journey-layout">
            <div className="section-heading journey-heading">
              <h2 id="journey-title">Luồng thử nghiệm rõ ràng trước khi ký</h2>
              <p>Mỗi bước đều cho biết mạng, dữ liệu và hành động nào đang được sử dụng.</p>
            </div>
            <ol className="journey-list">
              {journeySteps.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="section faq-section" aria-labelledby="faq-title">
          <div className="container faq-layout">
            <div>
              <h2 id="faq-title">Cần biết trước khi thử</h2>
              <p className="faq-intro">
                WhaleDEX chỉ hỗ trợ token Testnet. Limit order và nghiệm thu giao dịch bằng ví thật
                còn đang hoàn thiện.
              </p>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <details key={faq.question} className="faq-item" open={index === 0}>
                  <summary>
                    <span>{faq.question}</span>
                    <span className="faq-symbol" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <div>
            <div className="footer-brand">WhaleDEX</div>
            <p>Spot DEX không lưu ký trên Sui Testnet, sử dụng DeepBookV3.</p>
          </div>
          <div className="footer-links">
            <a href="#modes">Giao dịch</a>
            <a href="#markets">Thị trường</a>
            <a href="#faq">Hỏi đáp</a>
            <a href="https://docs.sui.io" target="_blank" rel="noopener noreferrer">
              Tài liệu Sui
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 WhaleDEX</span>
          <span>UI thử nghiệm / Không dùng tiền thật</span>
        </div>
      </footer>
    </div>
  );
}
