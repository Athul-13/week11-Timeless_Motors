const KYC = require('../models/KYC');
const User = require('../models/User');

exports.getAllKYCDocuments = async (req, res) => {
    try {
        const kycDocuments = await KYC.aggregate([
            {
                $lookup: {
                    from: 'users',  // Verify this matches your collection name
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    documentType: 1,
                    documentUrl: 1,
                    createdAt: 1,
                    status: 1,
                    user: {
                        first_name: '$userDetails.first_name',
                        last_name: '$userDetails.last_name',
                        email: '$userDetails.email'
                    }
                }
            }
        ]);

        res.json({ documents: kycDocuments });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.searchKYCDocument = async (req, res) => {
    const { q } = req.query;
  
    try {
      const users = await User.find({
        $or: [
          { first_name: { $regex: q, $options: 'i' } },
          { last_name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      });
  
      // Get KYC documents for those users
      const kycDocuments = await KYC.find({
        user: { $in: users.map(user => user._id) }
      }).populate({
        path: 'user',
        select: 'first_name last_name email'
      });
      
      res.json(kycDocuments);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
}