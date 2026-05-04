import mongoose from "mongoose";

async function connectDB(){
    try{
        await mongoose.connect(process.env.DATABASE);
        console.log('Kết nối MongoDB thành công!');
    }catch (err) {
        // console.log('Kết nối MongoDB thất bại!');
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDB