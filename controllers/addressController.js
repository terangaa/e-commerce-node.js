const { Address } = require('../models');

// Obtenir toutes les adresses d'un utilisateur
exports.getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json(addresses);
  } catch (error) {
    console.error('Erreur lors de la récupération des adresses:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des adresses' });
  }
};

// Obtenir une adresse par son ID
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const address = await Address.findOne({
      where: { id, userId },
    });
    
    if (!address) {
      return res.status(404).json({ error: 'Adresse non trouvée' });
    }
    
    res.json(address);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'adresse:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'adresse' });
  }
};

// Créer une nouvelle adresse
exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { label, firstName, lastName, address, city, postalCode, country, phone, isDefault } = req.body;
    
    // Validation des champs requis
    if (!firstName || !lastName || !address || !city || !phone) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }
    
    // Si cette adresse est définie par défaut, désactiver les autres
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId } }
      );
    }
    
    const newAddress = await Address.create({
      userId,
      label: label || 'Domicile',
      firstName,
      lastName,
      address,
      city,
      postalCode: postalCode || null,
      country: country || 'Sénégal',
      phone,
      isDefault: isDefault || false,
    });
    
    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Erreur lors de la création de l\'adresse:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'adresse' });
  }
};

// Mettre à jour une adresse
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { label, firstName, lastName, address, city, postalCode, country, phone, isDefault } = req.body;
    
    const existingAddress = await Address.findOne({
      where: { id, userId },
    });
    
    if (!existingAddress) {
      return res.status(404).json({ error: 'Adresse non trouvée' });
    }
    
    // Validation des champs requis
    if (!firstName || !lastName || !address || !city || !phone) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }
    
    // Si cette adresse est définie par défaut, désactiver les autres
    if (isDefault && !existingAddress.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId, id: { [require('sequelize').Op.ne]: id } } }
      );
    }
    
    await existingAddress.update({
      label: label || existingAddress.label,
      firstName,
      lastName,
      address,
      city,
      postalCode: postalCode || null,
      country: country || existingAddress.country,
      phone,
      isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
    });
    
    res.json(existingAddress);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'adresse:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'adresse' });
  }
};

// Supprimer une adresse
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const address = await Address.findOne({
      where: { id, userId },
    });
    
    if (!address) {
      return res.status(404).json({ error: 'Adresse non trouvée' });
    }
    
    await address.destroy();
    
    res.json({ message: 'Adresse supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'adresse:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'adresse' });
  }
};

// Définir une adresse comme adresse par défaut
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const address = await Address.findOne({
      where: { id, userId },
    });
    
    if (!address) {
      return res.status(404).json({ error: 'Adresse non trouvée' });
    }
    
    // Désactiver toutes les adresses par défaut de l'utilisateur
    await Address.update(
      { isDefault: false },
      { where: { userId } }
    );
    
    // Définir cette adresse comme par défaut
    await address.update({ isDefault: true });
    
    res.json({ message: 'Adresse par défaut mise à jour', address });
  } catch (error) {
    console.error('Erreur lors de la définition de l\'adresse par défaut:', error);
    res.status(500).json({ error: 'Erreur lors de la définition de l\'adresse par défaut' });
  }
};
