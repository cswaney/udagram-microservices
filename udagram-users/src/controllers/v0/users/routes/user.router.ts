import {v4 as uuidv4} from 'uuid';
import {Router, Request, Response} from 'express';
import {User} from '../models/User';
import {AuthRouter} from './auth.router';

const router: Router = Router();

router.use('/auth', AuthRouter);

router.get('/');

router.get('/:id', async (req: Request, res: Response) => {
  const {id} = req.params;
  let pid = uuidv4();
  console.log(new Date().toLocaleString() + `: ${pid} request GET /api/v0/users/${id}`);      
  const item = await User.findByPk(id);
  console.log(new Date().toLocaleString() + `: ${pid} finished processing`);
  res.send(item);
});

export const UserRouter: Router = router;
