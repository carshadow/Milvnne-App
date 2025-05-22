import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from "dotenv";

dotenv.config(); // ✅ Esto es clave para leer .env

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'milvnne-products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'heic'],
        transformation: [
            {
                quality: "auto:best",  // 👈 compresión inteligente
                fetch_format: "auto",
                crop: "limit",
                width: 2000
            }
        ]
    }
});

export { cloudinary, storage };
