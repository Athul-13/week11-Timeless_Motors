import { useState, useEffect } from "react"
import { Upload, FileText } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import toast, { Toaster } from "react-hot-toast"
import { updateProfile, updateAddress, updateFormData, resetForm, updateProfilePicture } from "../../redux/profileSlice"
import AddressManager from "./AddressManager"
import KYCUpload from "../../components/KYCUpload"

const ProfileDetails = () => {
  const dispatch = useDispatch()
  const userData = useSelector((state) => state.auth.user)
  const { formData, isFormChanged, loading, error } = useSelector((state) => state.profile)
  const [uploading, setUploading] = useState(false)

  const CLOUD_NAME = "dncoxucat"
  const UPLOAD_PRESET = "profile_pictures"

  useEffect(() => {
    dispatch(
      resetForm({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone_no: userData.phone_no || "",
        profile_picture: userData.profilePicture || "",
        address: {
          street: "",
          town: "",
          state: "",
          postal_code: "",
          country: "",
        },
      }),
    )
  }, [userData, dispatch])

  console.log('form',formData);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", UPLOAD_PRESET)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.secure_url) {
        const result = await dispatch(updateProfilePicture(data.secure_url)).unwrap()
        if (result) {
          dispatch(updateFormData({ path: "profile_picture", value: data.secure_url }))
          toast.success("Profile picture updated successfully")
        }
      }
    } catch (err) {
      toast.error("Failed to upload image")
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        toast.error("Please enter a valid email address")
        return
      }
    }

    if (name === "phone_no" && value) {
      const phoneRegex = /^\+?[\d\s-()]{8,}$/
      if (!phoneRegex.test(value)) {
        toast.error("Please enter a valid phone number")
        return
      }
    }

    dispatch(updateFormData({ path: name, value }))
  }

  const handleSubmit = async () => {
    try {
      await dispatch(
        updateProfile({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_no: formData.phone_no,
          profile_picture: formData.profile_picture,
        }),
      ).unwrap()

      const addressChanged = Object.values(formData.address).some((value) => value !== "")
      if (addressChanged) {
        const allAddressFieldsFilled = Object.values(formData.address).every((value) => value !== "")
        if (!allAddressFieldsFilled) {
          toast.error("Please fill all address fields")
          return
        }
        await dispatch(updateAddress(formData.address)).unwrap()
      }

      toast.success("Profile updated successfully")
    } catch (err) {
      toast.error(err.message || "Failed to update profile")
    }
  }

  return (
    <>
      <div className="max-w-3xl mx-auto p-4 rounded-xl bg-gray-200 ">
        <Toaster position="top-center" />

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {formData.profile_picture ? (
                  <img
                    src={formData.profile_picture || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-gray-500" />
                )}
              </label>
            </div>
            <p className="text-sm text-gray-500">
              {uploading ? "Uploading..." : "Click to upload new profile picture"}
            </p>
          </div>

          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First Name*"
                    className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  />
                </div>
                <div className="flex-1 mt-4 md:mt-0">
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last Name*"
                    className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-medium mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  name="phone_no"
                  value={formData.phone_no}
                  onChange={handleInputChange}
                  placeholder="Phone number*"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                />
              </div>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address*"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-300">
            <button
              onClick={() => {
                dispatch(
                  resetForm({
                    first_name: userData.first_name || "",
                    last_name: userData.last_name || "",
                    email: userData.email || "",
                    phone_no: userData.phone_no || "",
                    profile_picture: userData.profilePicture || "",
                    address: {
                      street: "",
                      town: "",
                      state: "",
                      postal_code: "",
                      country: "",
                    },
                  }),
                )
              }}
              className="px-6 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Discard changes
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormChanged || loading}
              className={`px-6 py-2 text-white text-sm rounded-md transition-colors duration-200 ${
                isFormChanged && !loading ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
      <AddressManager />
      < KYCUpload userId={userData.id}/>
    </>
  )
}

export default ProfileDetails

