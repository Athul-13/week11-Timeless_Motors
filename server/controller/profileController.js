const User = require('../models/User');
const Address = require('../models/Address');
const KYC = require('../models/KYC');

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

    await logActivity(userId, "Profile Update", "User updated their profile details", req);
  
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
    console.log('user', req.user);

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

exports.getKYC = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const kycDocuments = await KYC.find({ user: userId });

    res.status(200).json({ documents: kycDocuments });
  } catch (error) {
    console.error('Error fetching KYC:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};