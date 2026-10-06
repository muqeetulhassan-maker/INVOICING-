import { Router } from 'express';
import { scanReceipt } from '../controllers/receiptController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/scan', authenticate, scanReceipt);

export default router;

