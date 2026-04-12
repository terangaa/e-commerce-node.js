const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/authMiddleware');

const {
    createCategory,
    listCategories,
    updateCategory,
    deleteCategory,
    createProduct,
    listProductsAdmin,
    updateProduct,
    deleteProduct,
    listOrdersAdmin,
    listUsers,
    addUser,
    deleteUser,
    makeAdmin
} = require('../controllers/adminController');

// Middleware admin pour toutes les routes
router.use(ensureAdmin);

/////////////////////
// Catégories
/////////////////////
router.post('/categories', createCategory);
router.get('/categories', listCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

/////////////////////
// Produits
/////////////////////
router.post('/products', createProduct);
router.get('/products', listProductsAdmin);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

/////////////////////
// Commandes
/////////////////////
router.get('/orders', listOrdersAdmin);
router.get('/orders/:id/edit', async (req, res) => {
    const { Order, OrderItem, Product } = require('../models');

    const order = await Order.findByPk(req.params.id, {
        include: [
            {
                model: OrderItem,
                include: [Product]
            }
        ]
    });

    if (!order) {
        return res.status(404).send("Commande introuvable");
    }

    res.render('admin/order-edit', { order });
});

router.post('/orders/:id/edit', async (req, res) => {
    const { Order } = require('../models');

    const { customerName, customerEmail, customerPhone, deliveryAddress, status } = req.body;

    await Order.update(
        {
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            status
        },
        { where: { id: req.params.id } }
    );

    res.redirect('/admin/orders/' + req.params.id);
});

/////////////////////
// Gestion utilisateurs
/////////////////////
router.get('/users', listUsers);                  // Voir tous les utilisateurs
router.post('/users', addUser);                   // Ajouter utilisateur
router.delete('/users/:id', deleteUser);         // Supprimer utilisateur
router.put('/users/:id/make-admin', makeAdmin);  // Promouvoir en admin

// ================= EMAIL FACTURE =================
router.get('/orders/:id/send-invoice', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, include: [Product] }]
        });

        if (!order) return res.send("Commande introuvable");

        const invoiceNumber = generateInvoiceNumber(order.id);

        await transporter.sendMail({
            from: 'tonemail@gmail.com',
            to: order.customerEmail,
            subject: `Facture ${invoiceNumber}`,
            html: `
        <h2>Bonjour ${order.customerName}</h2>
        <p>Voici votre facture.</p>
        <p>Total : ${order.totalAmount} FCFA</p>
        <p>Merci pour votre confiance 🙏</p>
      `
        });

        res.redirect('/admin/orders/' + order.id);

    } catch (err) {
        console.error(err);
        res.send("Erreur envoi email");
    }
});

module.exports = router;