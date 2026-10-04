import { WalletLoader } from '../components/wallet-loader';

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
        <p className="eyebrow">Sui Testnet · Token thử nghiệm không có giá trị thật</p>
        <h1 id="page-title">Giao dịch trên Sui</h1>
        <p className="description">Ví của bạn. Chữ ký của bạn. Thanh khoản từ DeepBookV3.</p>
        <WalletLoader />
      </section>
      <footer>WhaleDEX · Sui Testnet · DeepBookV3</footer>
    </main>
  );
}
