export function authorization(role){
    return async function(req, rep){
        try{
            if (req.user.role !== role) {
                return rep.redirect('/');
            }
        }catch(err){
            console.log(err);
        }
    }
}