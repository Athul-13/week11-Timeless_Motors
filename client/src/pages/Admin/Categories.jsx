import {
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Pencil, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteCategory, deleteSubcategory, fetchCategories, updateCategoryStatus, updateSubcategoryStatus } from '../../redux/categorySlice';
import toast, { Toaster } from 'react-hot-toast';

const Categories = () => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const categories = useSelector((state)=> state.categories.categories);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(()=> {
    setTimeout(() => {
      setLoading(false); // Hide loader after 2 seconds
    }, 500);

    dispatch(fetchCategories())
  },[dispatch])

  const columns = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        return row.original.subCategories?.length > 0 ? (
          <button
            onClick={() => {
              row.toggleExpanded();
            }}
            className="p-2"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : null;
      },
    },
    {
      header: 'ID',
      accessorKey: '_id',
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Status',
      accessorKey: 'isDeleted',
      cell: ({ row }) => (
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!row.original.isDeleted}
              onChange={() => {
                if (row.original.parentId) {
                  // This is a subcategory
                  handleSubcategoryStatusChange(row.original);
                } else {
                  // This is a main category
                  handleStatusChange(row.original);
                }
              }}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
          </label>
        </div>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 text-blue-600 hover:text-blue-800"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-2 text-red-600 hover:text-red-800"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: categories || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subCategories,
  });

  const handleStatusChange = (category) => {
    setSelectedCategory(category);
    setShowStatusDialog(true);
  };

  const handleSubcategoryStatusChange = (subcategory) => {
    setSelectedCategory(subcategory);
    setShowStatusDialog(true);
  };

  const handleEdit = (category) => {
    navigate(`/admin/categories/edit/${category._id}`)
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const loadingToast = toast.loading(
      selectedCategory.parentId 
        ? 'Deleting subcategory...' 
        : 'Deleting category...'
    );

    try {
      if (selectedCategory.parentId) {
        // Delete subcategory
        await dispatch(deleteSubcategory({
          categoryId: selectedCategory.parentId,
          subcategoryId: selectedCategory._id
        })).unwrap();
        
        toast.dismiss(loadingToast);
        toast.success('Subcategory deleted successfully');
      } else {
        // Delete main category
        await dispatch(deleteCategory(selectedCategory._id)).unwrap();
        
        toast.dismiss(loadingToast);
        toast.success('Category deleted successfully');
      }
      
      setShowDeleteDialog(false);
      dispatch(fetchCategories());
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const confirmStatusChange = async () => {
    const loadingToast = toast.loading('Updating status...');

    try {
      const newStatus = !selectedCategory.isDeleted;
      
      if (selectedCategory.parentId) {
        await dispatch(updateSubcategoryStatus({
          categoryId: selectedCategory.parentId,
          subcategoryId: selectedCategory._id,
          isDeleted: newStatus 
        })).unwrap();
      } else {
        await dispatch(updateCategoryStatus({
          id: selectedCategory._id,
          categoryData: { isDeleted: newStatus }
        })).unwrap();
      }
      
      toast.dismiss(loadingToast);
      toast.success('Status updated successfully');
      setShowStatusDialog(false);
      dispatch(fetchCategories());
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleAddSubCategory = () => {
    navigate('/admin/categories/new-SubCategory')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="relative m-10">
      <Toaster position='top-center'/>
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
      <h2 className="text-2xl font-bold text-gray-800 border-gray-300 pb-2">
        Categories Management
      </h2>
      <button
          onClick={handleAddSubCategory}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Add New Category
        </button>
      </div>
        <div className="rounded-md border border-gray-300">
            <table className="w-full table-auto">
            <thead className="bg-gray-300">
                {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                    <th
                        key={header.id}
                        className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300"
                    >
                        {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                        )}
                    </th>
                    ))}
                </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => (
                <tr
                    key={row.id}
                    className={`border-b ${
                    row.depth > 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-gray-100`}
                >
                    {row.getVisibleCells().map((cell) => (
                    <td
                        key={cell.id}
                        className="px-6 py-4 text-sm text-gray-600"
                        style={{
                        paddingLeft: `${row.depth * 2 + 1.5}rem`,
                        }}
                    >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                    ))}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
    


           {/* Status Change Dialog */}
           {showStatusDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Status Change</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to change the status of this {selectedCategory.parentId ? 'subcategory' : 'category'}?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowStatusDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                onClick={confirmStatusChange}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this {selectedCategory.parentId ? 'subcategory' : 'category'}? 
              {!selectedCategory.parentId && selectedCategory.subCategories?.length > 0 && 
                " All associated subcategories will also be deleted."}
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;