const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
    try {
        const {name, status} = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(409).json({ message: "Category with this name already exists" });
        }

        const category = await Category.create({
            name,
            status: status ?? true, // default to true if not provided
            subCategories: []
        });

        return res.status(201).json({
            status: 201,
            data: category,
            message: "Category created successfully"
        });
    } catch (err) {
        res.status(500).json({message: err.message})
    }
}

exports.addSubcategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, status } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Subcategory name is required" });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Parent category not found" });
        }

        const subcategoryExists = category.subCategories.some(sub =>
            sub.name.toLowerCase() === name.toLowerCase()
        );

        if (subcategoryExists) {
            return res.status(409).json({ message: "Subcategory with this name already exists in this category" });
        }

        const subcategory = {
            name,
            status: status ?? true
        };

        category.subCategories.push(subcategory);
        await category.save();

        return res.status(201).json({
            status: 201,
            data: category,
            message: "Subcategory added successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try{
        const categories = await Category.find();
        
        return res.status(200).json({
            status: 200,
            data: categories,
            message: "Categories retreived successfully"
        });
    } catch (err) {
        res.status(500).json({message: err.message})
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, isDeleted } = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        if (name) {
            const existingCategory = await Category.findOne({
                _id: { $ne: categoryId },
                name
            });

            if (existingCategory) {
                return res.status(409).json({ message: "Category with this name already exists" });
            }

            category.name = name;
        }

        if (typeof isDeleted !== 'undefined') {
            category.isDeleted = isDeleted;
        }

        await category.save();

        return res.status(200).json({
            status: 200,
            data: category,
            message: "Category updated successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.updateSubcategory = async (req, res) => {
    try {
        const { categoryId, subcategoryId } = req.params;
        const { name, isDeleted } = req.body;

        console.log('back:', req.params)

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const subcategory = category.subCategories.id(subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ message: "Subcategory not found" });
        }

        if (name) {
            const nameExists = category.subCategories.some(sub =>
                sub._id.toString() !== subcategoryId &&
                sub.name.toLowerCase() === name.toLowerCase()
            );

            if (nameExists) {
                return res.status(409).json({ message: "Subcategory with this name already exists in this category" });
            }

            subcategory.name = name;
        }

        if (typeof isDeleted !== 'undefined') {
            subcategory.isDeleted = isDeleted;
        }

        await category.save();

        return res.status(200).json({
            status: 200,
            data: category,
            message: "Subcategory updated successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await Category.deleteOne({ _id: id });

        return res.status(200).json({
            status: 200,
            data: {},
            message: "Category deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.deleteSubcategory = async (req, res) => {
    try {
        const { categoryId, subcategoryId } = req.params;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        category.subCategories = category.subCategories.filter(
            sub => sub._id.toString() !== subcategoryId
        );

        await category.save();

        return res.status(200).json({
            status: 200,
            data: category,
            message: "Subcategory deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
