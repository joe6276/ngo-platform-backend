import express from 'express';
import { Permission } from '../types/rbac.types';
import { activateUser, createUser, deactivateUser, getUser, getUsers, updateUser, updateUserRole } from '../controllers/user.controller';
import { requirePermission } from '../middlewares/auth.middleware';

const userRouter = express.Router();

userRouter.post('/',
    requirePermission(Permission.CREATE_USER),
    createUser
);

userRouter.get('/',
    requirePermission(Permission.READ_USER),
    getUsers
);

userRouter.get('/:userId',
    requirePermission(Permission.READ_USER),
    getUser
);

userRouter.put('/:userId',
    requirePermission(Permission.UPDATE_USER),
    updateUser
);

userRouter.put('/:userId/role',
    requirePermission(Permission.UPDATE_USER),
    updateUserRole
);

userRouter.delete('/:userId',
    requirePermission(Permission.DELETE_USER),
    deactivateUser
);
userRouter.patch('/:userId',
    requirePermission(Permission.UPDATE_USER),
    activateUser
);

export default userRouter;
