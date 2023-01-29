import express from 'express';
const router = express.Router();
import logRouter from './routes/logRouter.js';
import reportRouter from './routes/reportRouter.js';
import sponsorListRouter from './routes/sponsorListRouter.js';
import subjectListRouter from './routes/subjectListRouter.js';
import subjectRouter from './routes/subjectRouter.js';

/** SETUP ROUTES */
router.use('/subjectlist', subjectListRouter);
router.use('/subject', subjectRouter);
router.use('/sponsorlist', sponsorListRouter);
router.use('/report', reportRouter);
router.use('/log', logRouter);

export default router;
