require('dotenv').config({ path: '.env.local' });
const buildApp = require('./app');

const start = async () => {
  const app = buildApp({
    logger: true,
  });

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    app.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
