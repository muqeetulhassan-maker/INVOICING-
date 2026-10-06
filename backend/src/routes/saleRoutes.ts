import { Router } from 'express';
import { getSales, getSaleById, createSale } from '../controllers/saleController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);

export default router;

