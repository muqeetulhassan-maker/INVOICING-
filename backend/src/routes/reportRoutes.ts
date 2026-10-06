import { Router } from 'express';
import { getReports } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getReports);

export default router;

