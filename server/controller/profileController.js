const User = require('../models/User');
const Address = require('../models/Address');

exports.getProfile = async (req,res) => {
    const user = await User.findById(req.user.id).select('-password');
  
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
  
    res.status(200).json(user);
};

exports.updateProfile = async (req,res) => {
    const { first_name, last_name, email, phone_no, profile_image } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
  
    // Update only the fields that are provided
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (email) user.email = email;
    if (phone_no) user.phone_no = phone_no;
    if (profile_image) user.profile_image = profile_image;
  
    const updatedUser = await user.save();
  
    res.status(200).json({
      _id: updatedUser._id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      phone_no: updatedUser.phone_no,
      profile_image: updatedUser.profile_image
    });
};

exports.updateProfilePicture = async (req, res) => {
    const { imageUrl } = req.body;
    console.log('update:',req.body)

    if (!imageUrl) {
      res.status(400);
      throw new Error('Please provide an image URL');
    }
  
    const user = await User.findById(req.user.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
  
    user.profile_picture = imageUrl;
    const updatedUser = await user.save();
  
    res.status(200).json({
      _id: updatedUser._id,
      profile_picture: updatedUser.profile_picture
    });
};

exports.getAddress = async(req, res) => {
    const address = await Address.findOne({ user_id: req.user.id });
  
    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }
  
    res.status(200).json(address);
  
};

exports.updateAddress = async (req, res) => {
    const { street, town, state, postal_code, country } = req.body;
  
    // Validate required fields
    if (Object.keys(req.body).length > 0) {
        if (!street || !town || !state || !postal_code || !country) {
          res.status(400);
          throw new Error('Please provide all address fields');
        }
      }
    
  
    // Find existing address or create new one
    let address = await Address.findOne({ user_id: req.user.id });
  
    if (address) {
      // Update existing address
      address.street = street;
      address.town = town;
      address.state = state;
      address.postal_code = postal_code;
      address.country = country;
    } else {
      // Create new address
      address = new Address({
        user_id: req.user.id,
        street,
        town,
        state,
        postal_code,
        country
      });
    }
  
    const updatedAddress = await address.save();
    res.status(200).json(updatedAddress);
};