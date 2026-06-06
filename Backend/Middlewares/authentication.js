export async function authentication(req, rep){
    try{
        const token = req.cookies?.token;
        if(token){
            const user = req.server.jwt.verify(token);
            req.user = user;
        }else{
            rep.redirect('/auth');
        }
    }catch(err){
       return rep.send(err)
    }
}