import {Router} from 'express';
import {getSubject} from '../controllers/subjectController.js';

const subjectRouter = Router();

/**
 * Route to serve subjects
 */
subjectRouter.get('/', getSubject);

export default subjectRouter;
