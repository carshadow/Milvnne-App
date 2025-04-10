// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Product from "./models/product.js";

// dotenv.config();

// const sampleProducts = [
//     { name: "Hoodie", price: 59.99, image: "/images/Milanhoodie.png", category: "comfy", stock: 10 },
//     { name: "T-Shirt", price: 29.99, image: "/images/oriela.png", category: "comfy", stock: 15 },
//     { name: "Hoodie", price: 59.99, image: "/images/Milanhoodie.png", category: "comfy", stock: 10 },
//     { name: "T-Shirt", price: 29.99, image: "/images/oriela.png", category: "comfy", stock: 15 },
//     { name: "Hoodie", price: 59.99, image: "/images/Milanhoodie.png", category: "comfy", stock: 10 },
//     { name: "T-Shirt", price: 29.99, image: "/images/oriela.png", category: "comfy", stock: 15 },
// ];

// mongoose
//     .connect(process.env.MONGO_URI)
//     .then(async () => {
//         await Product.deleteMany();
//         await Product.insertMany(sampleProducts);
//         console.log("Database Seeded ✅");
//         process.exit();
//     })
//     .catch((err) => console.error(err));
