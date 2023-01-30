import {Router} from 'express';
import {getSubjectList} from '../controllers/subjectListController.js';

const subjectListRouter = Router();

/**
 * Route to serve subject lists
 */
subjectListRouter.get('/', getSubjectList);

export default subjectListRouter;
