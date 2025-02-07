import { useState, useEffect } from 'react';
import { Upload, FileText, X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { profileServices } from '../utils/api';

const KYCUpload = ({ userId, className = "" }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);

  const documentTypes = ['Passport', 'Aadhaar', 'Driver License', 'Voter ID', 'PAN Card'];

  useEffect(() => {
    const fetchKYC = async () => {
      try {
        const response = await profileServices.getKYC(userId);
        if (response.documents?.length > 0) {
          setDocuments(response.documents.map(doc => ({
            id: doc._id,
            name: doc.documentUrl.split('/').pop(),
            url: doc.documentUrl,
            documentType: doc.documentType,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt)
          })));
        }
      } catch (err) {
        toast.error('Error fetching KYC documents.');
      }
    };
    fetchKYC();
  }, [userId]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile?.type)) {
      toast.error('Please upload a valid document (PDF, JPG, or PNG)');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!documentType) {
      toast.error('Please select a document type');
      return;
    }

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('documentType', documentType);

    try {
      setUploading(true);
      const response = await api.post('/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newDocument = {
        id: response.data._id,
        name: response.data.fileName,
        url: response.data.fileUrl,
        documentType: documentType,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setDocuments(prev => [newDocument, ...prev]);
      toast.success('Document uploaded successfully!');
      setFile(null);
      setDocumentType('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

//   const handleDeleteDocument = async (documentId) => {
//     try {
//       await api.delete(`/kyc/${documentId}`);
//       setDocuments(prev => prev.filter(doc => doc.id !== documentId));
//       toast.success('Document deleted successfully!');
//     } catch (err) {
//       toast.error('Failed to delete document. Please try again.');
//     }
//   };

  const openFile = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className={`max-w-3xl mx-auto mt-5 p-4 rounded-xl bg-gray-200 ${className}`}>
      <div className="px-4 py-3">
        <h2 className="text-lg font-medium mb-4">KYC Documents</h2>

        {documents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3">Uploaded Documents</h3>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <button
                          onClick={() => openFile(doc.url)}
                          className="text-sm font-medium text-gray-900 hover:text-gray-700"
                        >
                          {doc.documentType}
                        </button>
                        <p className="text-xs text-gray-500">Uploaded {doc.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                    {/* <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="text-md font-medium mb-4">Upload New Document</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select document type</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="bg-white mb-4 rounded-lg">
            <label className="w-full block px-4 py-3 text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center justify-center h-32">
                <Upload className="w-8 h-8 text-gray-400 mb-2" strokeWidth={2} />
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
            </label>
          </div>
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full py-2 px-4 rounded-md text-white ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCUpload;
