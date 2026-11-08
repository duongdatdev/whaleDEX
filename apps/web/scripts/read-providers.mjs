export class VerificationError extends Error {}

export function parseProviders(value = 'https://fullnode.testnet.sui.io:443') {
  const urls = value.split(',').map((value) => value.trim());
  if (
    urls.length > 3 ||
    urls.some((value) => {
      try {
        return new URL(value).protocol !== 'https:';
      } catch {
        return true;
      }
    })
  )
    throw new VerificationError('INVALID_PROVIDER_CONFIG');
  return [...new Set(urls)];
}

// Only pass read/simulation operations here. Never use this runner for signing or submission.
export async function readWithProviders(urls, read, { timeoutMs = 30000, delayMs = 1000 } = {}) {
  const attempts = [];
  for (let provider = 0; provider < urls.length; provider++) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const start = Date.now();
      let timer;
      try {
        const timeout = new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error('timeout'));
          }, timeoutMs);
        });
        const result = await Promise.race([read(urls[provider], controller.signal), timeout]);
        attempts.push({
          provider: provider + 1,
          attempt,
          status: 'ok',
          durationMs: Date.now() - start,
        });
        return { result, attempts };
      } catch (error) {
        if (error instanceof VerificationError) throw error;
        attempts.push({
          provider: provider + 1,
          attempt,
          status: 'unavailable',
          durationMs: Date.now() - start,
        });
      } finally {
        clearTimeout(timer);
        controller.abort();
      }
      if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return { result: null, attempts };
}
