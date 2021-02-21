import {v4 as uuidv4} from 'uuid';
import {Router, Request, Response} from 'express';
import {UserRouter} from './users/routes/user.router';

const router: Router = Router();

router.use('/users', UserRouter);

router.get('/', async (req: Request, res: Response) => {
  let pid = uuidv4();
  console.log(new Date().toLocaleString() + `: ${pid} request GET /api/v0/`);
  res.send(`V0`);
});

export const IndexRouter: Router = router;
