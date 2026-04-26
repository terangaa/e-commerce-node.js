require('dotenv').config();

const { Product } = require('../models');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const uploadToCloudinary = (filePath) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'products',
                resource_type: 'image'
            },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );

        fs.createReadStream(filePath).pipe(stream);
    });
};

async function migrate() {
    try {
        console.log("🚀 Migration images Cloudinary...");

        const products = await Product.findAll();

        for (let product of products) {

            console.log("CHECK:", product.id, product.imageUrl);

            // 🔥 détecter images locales
            const isLocalImage =
                product.imageUrl &&
                (
                    product.imageUrl.startsWith('/uploads') ||
                    product.imageUrl.startsWith('uploads') ||
                    product.imageUrl.includes('uploads')
                );

            if (!isLocalImage) {
                console.log("⏭ déjà Cloudinary:", product.name);
                continue;
            }

            // 🔥 construire chemin correct (IMPORTANT)
            let filePath = path.join(__dirname, '..', 'public', product.imageUrl);

            // fallback si structure différente
            if (!fs.existsSync(filePath)) {
                filePath = path.join(__dirname, '..', product.imageUrl);
            }

            console.log("FILE:", filePath);

            if (!fs.existsSync(filePath)) {
                console.log("❌ introuvable:", product.imageUrl);
                continue;
            }

            console.log("⬆ Upload:", product.name);

            // 🔥 upload cloudinary
            const result = await uploadToCloudinary(filePath);

            console.log("☁ URL:", result.secure_url);

            // 🔥 update DB
            product.imageUrl = result.secure_url;
            await product.save();

            console.log("✔ Migré:", product.name);
        }

        console.log("✅ Migration terminée");

    } catch (err) {
        console.error("❌ ERREUR MIGRATION:", err);
    }
}

migrate();