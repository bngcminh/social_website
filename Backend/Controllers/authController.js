import bcrypt from 'bcryptjs';
import validator from 'validator';
import User from '../Models/User.js';
import fastify from 'fastify';

export const register = async function(req, rep){
    try{
        const { username, email, password } = req.body;
    
        if(!username || !email || !password){
            return rep.code(400).send('Vui lòng nhập đầy đủ thông tin');
        }
        
        const existUsername = await User.findOne({ username });
        if(existUsername){
            return rep.code(400).send('Tên người dùng đã tồn tại, vui lòng nhập tên khác');
        }

        const existEmail = await User.findOne({ email });
        if(!validator.isEmail(email)){
            return rep.code(400).send('Email không hợp lệ');
        }
        if(existEmail){
            return rep.code(400).send('Email đã tồn tại, vui lòng nhập email khác');
        }
        
        if(username.length < 6 || password.length < 6){
            return rep.code(400).send('Tên người dùng và mật khẩu phải trên 6 kí tự');
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        await User.create({
            username: username,
            email: email,
            password: hashPassword
        })

        return rep.code(200).send('Đăng ký thành công');

    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình đăng kí');
    }
}

export const login = async function(req, rep){
    try{
        const { identifier, password } = req.body;

        if(!identifier || !password){
            return rep.code(400).send('Vui lòng nhập đầy đủ thông tin');
        }

        let user
        if(validator.isEmail(identifier)){
            user = await User.findOne({ email: identifier });
        }else{
            user = await User.findOne({ username: identifier })
        }

        if(!user){
            return rep.code(400).send('Tài khoản hoặc mật khẩu không đúng');
        }

        const comparePassword = await bcrypt.compare(password, user.password)
        if(!comparePassword){
            return rep.code(400).send('Tài khoản hoặc mật khẩu không đúng')
        }

        const token = await rep.jwtSign({
            id: user._id,
            role: user.role
        })

        rep.setCookie('token', token);
        return rep.code(200).send('Đăng nhập thành công');

    }catch(err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình đăng nhập');
    }
}

export const logout = async function(req, rep){
    rep.clearCookie('token');
    return rep.code(200).send('Đăng xuất thành công');
}