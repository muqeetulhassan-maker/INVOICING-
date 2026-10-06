import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;

