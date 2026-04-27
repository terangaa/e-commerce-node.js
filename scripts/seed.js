require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, User, Product, Category } = require('../models');

async function seed() {
    try {
        console.log("🚀 Connexion à la base...");
        await sequelize.authenticate();
        console.log("✅ Base connectée");

        await sequelize.sync({ alter: true });

        /* =========================
    👤 ADMIN
        ========================= */
        const adminExists = await User.findOne({
            where: { email: "admin@ecommercejim.com" }
        });

        if (!adminExists) {
            const passwordHash = await bcrypt.hash('admin123456', 10);

            await User.create({
                name: "Admin",
                email: "admin@ecommercejim.com",
                passwordHash,
                role: "admin"
            });

            console.log("👤 Admin créé");
        } else {
            console.log("⚠️ Admin déjà existant (skip)");
        }

        /* =========================
           📂 CATEGORIES
        ========================= */
        const existingCategories = await Category.count();

        let categories;

        if (existingCategories === 0) {
            categories = await Category.bulkCreate([
                { name: "Téléphones" },
                { name: "Ordinateurs" },
                { name: "Accessoires" }
            ], { returning: true });

            console.log("📂 Catégories créées");
        } else {
            categories = await Category.findAll();
            console.log("📂 Catégories déjà existantes (skip)");
        }

        const phoneCat = categories.find(c => c.name === "Téléphones");
        const laptopCat = categories.find(c => c.name === "Ordinateurs");
        const accessoryCat = categories.find(c => c.name === "Accessoires");

        /* =========================
           📦 PRODUCTS
        ========================= */
        const productCount = await Product.count();

        if (productCount === 0) {
            await Product.bulkCreate([
                {
                    name: "iPhone 15 Pro",
                    description: "Smartphone Apple dernière génération",
                    price: 950000,
                    stock: 10,
                    categoryId: phoneCat.id
                },
                {
                    name: "Samsung Galaxy S24",
                    description: "Smartphone Android haut de gamme",
                    price: 850000,
                    stock: 15,
                    categoryId: phoneCat.id
                },
                {
                    name: "MacBook Pro M2",
                    description: "Ordinateur puissant pour pro",
                    price: 1500000,
                    stock: 5,
                    categoryId: laptopCat.id
                },
                {
                    name: "Chargeur rapide USB-C",
                    description: "Accessoire universel rapide",
                    price: 15000,
                    stock: 50,
                    categoryId: accessoryCat.id
                }
            ]);

            console.log("📦 Produits créés");
        } else {
            console.log("📦 Produits déjà existants (skip)");
        }

        console.log("🎉 Seed terminé avec succès !");
        process.exit(0);

    } catch (error) {
        console.error("❌ Erreur seed:", error.message);
        process.exit(1);
    }
}

seed();