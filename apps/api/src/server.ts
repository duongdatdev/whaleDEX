import { config } from 'dotenv';
import { buildApp } from './app.js';
import { parseEnv } from './env.js';

config({ path: new URL('../.env', import.meta.url), quiet: true });
const env = parseEnv(process.env);
const app = buildApp({ logger: true });

async function shutdown(signal: string) {
  app.log.info({ signal }, 'Shutting down server');
  try {
    await app.close();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
