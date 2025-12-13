import { Request, Response } from 'express';
import { getPaginationParams, buildSort, buildSearch } from '../utils/queryHelpers';
import Product from '../models/Product';
import User from '../models/User';
// import SystemConfig from '../models/SystemConfig'; // Deprecated for shop settings
import SystemSetting from '../models/SystemSetting';

// Helper to get setting
const getSetting = async (key: string): Promise<boolean> => {
    const setting = await SystemSetting.findOne({ key });
    return setting ? setting.value === true : false;
};

// Check if Shop is Enabled
export const getShopStatus = async (req: Request, res: Response) => {
    try {
        const enableShop = await getSetting('enableShop');
        res.json({ enableShop });
    } catch (error) {
        res.status(500).json({ message: 'Error checking shop status' });
    }
};

// Get Active Products
export const getShopProducts = async (req: Request, res: Response) => {
    try {
        // Validation: Check if Shop is Enabled
        const enableShop = await getSetting('enableShop');
        if (!enableShop) {
            return res.status(403).json({ message: 'Shop is strictly disabled' });
        }

        const products = await Product.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// Public: Open Shop (No Login Required)
export const getPublicProducts = async (req: Request, res: Response) => {
    try {
        const enablePublicShop = await getSetting('enablePublicShop');
        if (!enablePublicShop) {
            return res.status(403).json({ message: 'Public Shop is currently disabled' });
        }

        const products = await Product.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// Admin: Get All Products
export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const sort = buildSort(req, 'createdAt', -1);
        const search = buildSearch(req, ['name', 'sku', 'description']);

        const query: any = { ...search };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sort as any)
            .skip(skip)
            .limit(limit);

        res.json({
            data: products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// Admin: Create Product
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, sku, price, pv, description, stock, image, category } = req.body;

        const existing = await Product.findOne({ sku });
        if (existing) return res.status(400).json({ message: 'SKU already exists' });

        const product = await Product.create({
            name, sku, price, pv, description, stock, image, category, isActive: true
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product' });
    }
};

// Admin: Update Product
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product' });
    }
};

// Admin: Delete/Archive
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
};

// Admin: Restock Product
export const restockProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $inc: { stock: quantity } },
            { new: true }
        );

        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error restocking product' });
    }
};

// Wishlist Logic
export const getWishlist = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await User.findById(userId).populate('wishlist');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Filter out nulls if product was deleted
        const wishlist = (user.wishlist || []).filter(item => item !== null);
        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wishlist' });
    }
};

export const addToWishlist = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params; // Product ID

        await User.findByIdAndUpdate(userId, {
            $addToSet: { wishlist: id }
        });

        res.json({ message: 'Added to wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding to wishlist' });
    }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        await User.findByIdAndUpdate(userId, {
            $pull: { wishlist: id }
        });

        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing from wishlist' });
    }
};
