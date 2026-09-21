import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE_URL}`);
    console.log("connect DB success")
  } catch (err) {
    console.log(`can not connect to DB ${err}`);
  }
};


export { connectDB}
