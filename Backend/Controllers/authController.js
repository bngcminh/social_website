import bcrypt from 'bcryptjs';
import User from '../Models/User.js';

export const register = async function(req, rep){
    const { username, email, password } = req.body;
    if(!username || !email || !password){
        rep.send('Vui lòng nhập đầy đủ thông tin');
    }
}