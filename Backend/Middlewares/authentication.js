export async function authentication(req, rep){
    try{
        const token = req.cookies?.token;
        if(token){
            const user = req.server.jwt.verify(token);
            req.user = user;
        }else{
            return rep.code(401).send('Bạn cần đăng nhập');
        }
    }catch(err){
       return rep.code(401).send('Token không hợp lệ');
    }
}