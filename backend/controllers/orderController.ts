import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import Wallet from '../models/Wallet';
import User from '../models/User';
import SystemSetting from '../models/SystemSetting';
import { CommissionEngine } from '../services/CommissionEngine';
import { activateUser } from '../services/userActivationService';
import { getPaginationParams, buildSort } from '../utils/queryHelpers';

// Helper to get setting (Duplicated from productController - potentially extract to service later)
const getSetting = async (key: string): Promise<boolean> => {
    const setting = await SystemSetting.findOne({ key });
    return setting ? setting.value === true : false;
};

// Create Order (Members & Guests)
export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id; // Authed User
        const { items, guestDetails, referrerId, paymentMethod = 'WALLET' } = req.body;

        const isGuest = !userId;

        // 1. Get System Settings
        const enableShop = await getSetting('enableShop');
        const enablePublicShop = await getSetting('enablePublicShop');

        // Gatekeeping
        if (isGuest && !enablePublicShop) {
            return res.status(403).json({ message: 'Public Shop is disabled' });
        }
        if (!isGuest && !enableShop) {
            return res.status(403).json({ message: 'Member Shop is disabled' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        // 2. Process Items
        let totalAmount = 0;
        let totalPV = 0;
        let totalRetailProfit = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || !product.isActive) {
                return res.status(400).json({ message: `Unavailable: ${item.productId}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Out of stock: ${product.name}` });
            }

            // Pricing Logic
            const unitPrice = isGuest ? (product.retailPrice || product.price) : product.price;
            const linePrice = unitPrice * item.quantity;
            const linePV = product.pv * item.quantity;

            // Calculate Profit per item for Guests
            if (isGuest) {
                const memberCost = product.price * item.quantity;
                totalRetailProfit += (linePrice - memberCost);
            }

            totalAmount += linePrice;
            totalPV += linePV;

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: unitPrice, // Charged Price
                retailPrice: product.retailPrice, // Reference
                pv: product.pv,
                quantity: item.quantity,
                totalPrice: linePrice,
                totalPV: linePV
            });
        }

        // 3. Payment Processing
        let orderStatus = 'PAID';

        // MEMBER: Wallet Deduction (Only if paymentMethod is WALLET)
        if (!isGuest && paymentMethod === 'WALLET') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet || wallet.balance < totalAmount) {
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }

            wallet.balance -= totalAmount;
            wallet.transactions.push({
                type: 'PURCHASE',
                amount: totalAmount,
                description: `Order Payment - ${orderItems.length} items`,
                date: new Date(),
                status: 'COMPLETED'
            } as any);
            await wallet.save();
        }
        else if (paymentMethod === 'CASH') {
            orderStatus = 'PENDING';
        }
        // GUEST or MEMBER via CREDIT_CARD: Assume Payment Gateway Success
        else {
            // For future PayPal here.
        }

        // 4. Create Order Record
        const order = await Order.create({
            userId: userId || undefined,
            referrerId: isGuest ? referrerId : undefined,
            isGuest,
            guestDetails: isGuest ? guestDetails : undefined,
            items: orderItems,
            totalAmount,
            totalPV,
            status: orderStatus,
            paymentMethod: isGuest ? 'CREDIT_CARD' : paymentMethod
        });

        // 5. Inventory Update
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        // --- SKIP ACTIVATION IF PENDING ---
        if (orderStatus === 'PAID') {
            // 5b. Activate User
            if (userId) {
                await activateUser(userId, totalAmount);
            }

            // 6. Commission & Profit Distribution
            const beneficiaryId = isGuest ? referrerId : userId;

            if (beneficiaryId) {
                // A. Distribute Retail Profit (Guests Only)
                if (isGuest && totalRetailProfit > 0) {
                    const refWallet = await Wallet.findOne({ userId: referrerId });
                    if (refWallet) {
                        refWallet.balance += totalRetailProfit;
                        refWallet.transactions.push({
                            type: 'BONUS', // Generic bonus type or new RETAIL_PROFIT
                            amount: totalRetailProfit,
                            description: `Retail Profit from Guest Order #${order._id}`,
                            date: new Date(),
                            status: 'COMPLETED'
                        } as any);
                        await refWallet.save();
                    }
                }

                // B. Propagate PV
                await CommissionEngine.updateUplinePV(beneficiaryId, totalPV);
            }
        }

        res.status(201).json(order);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing order' });
    }
};

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// Admin: Get All Orders
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const sort = buildSort(req, 'createdAt', -1);
        const { status } = req.query;

        // Base Query
        const query: any = {};
        if (status) query.status = status;

        // Search Logic (Complex because of population)
        const search = req.query.search as string;
        if (search) {
            // If searching by Order ID, it's direct
            // If searching by User Name/Email, we need aggregate or 2-step find. 
            // For simplicity in Mongoose without massive aggregation:
            // 1. Find users matching search
            // 2. Find orders by those users OR matching order ID
            const users = await User.find({
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const userIds = users.map(u => u._id);

            query.$or = [
                { _id: isValidObjectId(search) ? search : null }, // Exact ID match if valid
                { userId: { $in: userIds } }, // Search by User
                { paymentMethod: { $regex: search, $options: 'i' } }
            ].filter(c => c._id !== null); // Filter out null ID checks
        }

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('userId', 'firstName lastName email')
            .sort(sort as any)
            .skip(skip)
            .limit(limit);

        res.json({
            data: orders,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// Helper for ID validation
const isValidObjectId = (id: string) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

// Admin: Update Order Status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const oldStatus = order.status;
        order.status = status;
        await order.save();

        // Trigger Activation if PENDING -> PAID
        if (oldStatus === 'PENDING' && status === 'PAID') {
            if (order.userId) {
                const userId = order.userId.toString();
                // 1. Activate User
                await activateUser(userId, order.totalAmount);

                // 2. Propagate PV
                await CommissionEngine.updateUplinePV(userId, order.totalPV);
            }
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating order' });
    }
};
