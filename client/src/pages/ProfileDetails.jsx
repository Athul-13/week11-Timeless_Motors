import { ChevronDown, Upload, Check, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';

const ProfileDetails = () => {
    const userData = useSelector((state)=> state.auth.user);
    console.log('userData:',userData)

  return (
    <div className="max-w-3xl mx-auto p-4 bg-gray-200 min-h-screen">
      <div className="space-y-6">
        {/* Previous sections remain the same */}
        <div className="border-b border-gray-300 pb-2">
          <h1 className="text-lg font-medium">Edit Profile</h1>
        </div>

        {/* Image Upload */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
            <Upload className="text-neutral-400" size={24} />
          </div>
          <button className="px-4 py-2 bg-white text-sm hover:bg-neutral-100 transition-colors">
            Upload Image
          </button>
        </div>

        {/* Basic Information */}
        <div>
          <h2 className="text-base font-medium mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  id='first_name'
                  name='first_name'
                  value={userData.first_name}
                  placeholder="First Name*"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                />
              </div>
              <div className="flex-1 mt-4 md:mt-0">
                <div className="relative">
                  <input
                    type="text"
                    id='last_name'
                    name='last_name'
                    value={userData.last_name}
                    placeholder="Last Name*"
                    className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  />
                  <div className="absolute right-3 top-3 bg-neutral-100 rounded-full p-1">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-base font-medium mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <input
                type="number"
                value={userData.phone_no}
                placeholder="Phone number*"
                className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
              />
            </div>
            <div className="relative">
              <input
                type="email"
                value={userData.email}
                placeholder="Email Address*"
                className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white rounded text-sm">
                Verify
              </button>
              <p className="text-xs text-neutral-600 mt-1">
                Your email is never shared with external parties nor do we use it to spam you in any way
              </p>
            </div>
          </div>
        </div>

        {/* Current Address */}
        <div>
          <h2 className="text-base font-medium mb-4">Current Address</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="eg. Unit 1, 123 Main street"
              className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Town/suburb*"
                className="p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
              />
              <div className="relative">
                <select className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none appearance-none">
                  <option value="">State/Territory*</option>
                  <option value="kerala">Kerala</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Postal Code*"
                className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
              />
            </div>
            <div className="relative">
              <select className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none appearance-none">
                <option value="">Country*</option>
                <option value="india">India</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            </div>
          </div>
        </div>

        {/* New KYC Section */}
        <div>
          <h2 className="text-base font-medium mb-4">KYC Verification</h2>
          <p className="text-sm text-neutral-600 mb-4">Verify yourself to start selling.</p>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 bg-white">
              <div className="flex flex-col items-center justify-center text-center">
                <FileText className="text-neutral-400 mb-2" size={32} />
                <p className="text-sm text-neutral-600 mb-4">Upload your KYC documents here</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="px-4 py-2 bg-white border border-neutral-300 cursor-pointer hover:bg-neutral-50 transition-colors">
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                    <span className="text-sm">Choose File</span>
                  </label>
                  <span className="text-sm text-neutral-500 my-auto">No file chosen</span>
                </div>
              </div>
            </div>
            <button className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white text-sm hover:bg-green-700 transition-colors rounded">
              Submit KYC Documents
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-neutral-300">
          <button className="px-4 py-2 text-sm hover:bg-neutral-300 transition-colors">
            Discard changes
          </button>
          <button className="px-4 py-2 bg-gray-800 text-white text-sm hover:bg-gray-700 transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;