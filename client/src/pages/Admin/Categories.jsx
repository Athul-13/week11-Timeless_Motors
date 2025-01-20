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
import { fetchCategories, updateCategory, updateSubcategory } from '../../redux/categorySlice';

const Categories = () => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const categories = useSelector((state)=> state.categories.categories);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(()=> {
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
    console.log('Edit category:', category);
    // Implement edit functionality
  };

  const handleDelete = (category) => {
    console.log('Delete category:', category);
    // Implement delete functionality
  };

  const confirmStatusChange = async () => {
    try {
      console.log('selectedCategory',selectedCategory); 
      console.log('Category ID:', selectedCategory.parentId);
      console.log('Subcategory ID:', selectedCategory._id);
      const newStatus = !selectedCategory.isDeleted;
      
      if (selectedCategory.parentId) {
        // Handle subcategory status update
        await dispatch(updateSubcategory({
          categoryId: selectedCategory.parentId,
          subcategoryId: selectedCategory._id,
          isDeleted: newStatus 
        })).unwrap();
      } else {
        // Handle main category status update
        await dispatch(updateCategory({
          id: selectedCategory._id,
          categoryData: { isDeleted: newStatus }
        })).unwrap();
      }
      
      setShowStatusDialog(false);
      dispatch(fetchCategories());
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAddSubCategory = () => {
    navigate('/admin/categories/new-SubCategory')
  }

  return (
    <div className="relative m-10">
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
    


      {/* Custom Modal for Status Change Confirmation */}
      {showStatusDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Status Change</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to change the status of this category?
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
    </div>
  );
};

export default Categories;