const Address = require('../models/Address.js');

exports.getAddresses = async (req, res) => {
    try {
        const address = await Address.find({user: req.user._id});
        res.status(200).json(address);
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({error: 'failed to fetch address'})
    }
}

exports.addAddress = async (req, res) => {
    try {
        const user = req.user;

        if(!user) {
            return res.status(401).json({ message: 'Unauthorized user' });
        }

        const { 
            name, 
            phone_number, 
            pincode, 
            landmark, 
            address, 
            city, 
            state, 
            country 
        } = req.body;

        const baseRequiredFields = {
            name,
            phone_number,
            pincode,
            address,
            city,
            state,
            country
        }

        const missingBaseFields = Object.entries(baseRequiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

        if (missingBaseFields.length > 0) {
            return res.status(400).json({ 
                message: 'Missing required fields', 
                fields: missingBaseFields 
            });
        }

        const addressData = {
            ...baseRequiredFields,
            user: user._id,
            ...(landmark && { landmark }) 
        }                                                                                                   

        const newAddress = new Address(addressData);
        await newAddress.save();

        await logActivity(userId, "New Address Added", `User added a new address in ${city}, ${country}`, req);

        return res.status(200).json({message: 'New address created'});
    } catch (error) {
        console.error('Error adding address', error);
        res.status(500).json({message: 'failed to add address'});
    }
}

exports.editAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const updateData = req.body;

        const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, user: req.user._id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ message: 'Address updated successfully', address: updatedAddress });
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ error: 'Failed to update address' });
    }
}

exports.removeAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const deletedAddress = await Address.findOneAndDelete({ _id: addressId, user: req.user._id });

        if (!deletedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ message: 'Address removed successfully' });
    } catch (err) {
        console.error('Error removing address:', err);
        res.status(500).json({ error: 'Failed to remove address' });
    }
};