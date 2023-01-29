// Load .env file
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import express, {Application, Request, Response} from 'express';
import * as path from 'path';
import apiRouter from './api/api.js';
import {initialiseLogging} from './api/logging.js';
import {initialise} from './google-sheets/sheets.js';

import dotenv from 'dotenv';
dotenv.config();

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

Sentry.init({
  dsn: 'https://fb5c9266745c450e93696aaf15378c73@sentry.io/1836276',
});

const app: Application = express();

// Production port or port 5000
const port = process.env.PORT || 5000;

// Sentry request handler
app.use(Sentry.Handlers.requestHandler());
// Set up to serve static files
app.use(express.static('client/build'));
// Parse application/json
app.use(bodyParser.json());
// Initialise Google Sheets API (to access sponsor list)
initialise();

// Serves the React build
app.get('/', (_req: Request, res: Response) =>
  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
);

// Set up logging
initialiseLogging(app);

// Routes requests to /api/
app.use('/api/', apiRouter);

// Set up sentry error monitoring
app.use(Sentry.Handlers.errorHandler());

// Listen on port
app.listen(port, () => {
  console.log(`Express server initialised on port ${port}`);
});
