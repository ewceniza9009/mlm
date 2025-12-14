import { Request, Response } from 'express';
import Wallet from '../models/Wallet';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { createNotification } from './notificationController';
import { getSettingValue } from './settingsController';
import { getPaginationParams } from '../utils/queryHelpers';

export const getMyWallet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const format = req.query.format as string;
    const sortBy = (req.query.sortBy as string) || 'date';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    let wallet = await Wallet.findOne({ userId });

    // Auto-create wallet if missing (Self-healing for seeded/legacy users)
    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        transactions: []
      });
    }

    // If CSV, export all matching without pagination
    if (format === 'csv') {
      let txs = wallet.transactions;

      // Filter in memory since it's an embedded array and we have the doc
      if (search) {
        const lowerSearch = search.toLowerCase();
        txs = txs.filter((t: any) =>
          t.description.toLowerCase().includes(lowerSearch) ||
          t.type.toLowerCase().includes(lowerSearch) ||
          t.amount.toString().includes(lowerSearch)
        );
      }

      // Sort
      txs.sort((a: any, b: any) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (valA < valB) return -1 * sortOrder;
        if (valA > valB) return 1 * sortOrder;
        return 0;
      });

      const csv = [
        'Date,Type,Amount,Description,Status',
        ...txs.map((t: any) => `"${new Date(t.date).toISOString()}","${t.type}","${t.amount}","${t.description.replace(/"/g, '""')}","${t.status}"`)
      ].join('\n');

      res.header('Content-Type', 'text/csv');
      res.attachment('wallet_transactions.csv');
      return res.send(csv);
    }

    // For normal paginated response, we can also filter in memory for simplicity
    // (unless array is massive, but for 1 document it's usually fine.
    // If it was massive, we'd use aggregation, but let's stick to aggregation for consistency with server-side request pattern if we want strictly server side)

    // Actually, let's do in-memory filtering/slicing on the found subdoc for simplicity
    // because `unwind` on a single document is overkill unless we expect thousands of transactions.
    // BUT user asked for "Serverside" which usually implies we don't send everything.
    // So let's filter the array in memory on the server before sending to client.

    let filteredTxs = wallet.transactions;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredTxs = filteredTxs.filter((t: any) =>
        t.description.toLowerCase().includes(lowerSearch) ||
        t.type.toLowerCase().includes(lowerSearch)
      );
    }

    const total = filteredTxs.length;

    // Sort
    filteredTxs.sort((a: any, b: any) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA < valB) return -1 * sortOrder;
      if (valA > valB) return 1 * sortOrder;
      return 0;
    });

    // Paginate
    const paginatedTxs = filteredTxs.slice((page - 1) * limit, page * limit);

    // Enrich Transactions: Replace User IDs in description with Usernames
    const referralRegex = /Referral Bonus for new user ([a-f0-9]{24})/;
    const userIdsToFetch = new Set<string>();

    // Identify IDs to fetch
    paginatedTxs.forEach((tx: any) => {
      const match = tx.description.match(referralRegex);
      if (match && match[1]) {
        userIdsToFetch.add(match[1]);
      }
    });

    let finalTxs = paginatedTxs;

    if (userIdsToFetch.size > 0) {
      const users = await User.find({ _id: { $in: Array.from(userIdsToFetch) } }).select('username');
      const userMap = new Map(users.map(u => [u._id.toString(), u.username]));

      finalTxs = paginatedTxs.map((tx: any) => {
        // Convert to object if it's a mongoose doc to avoid mutation issues or stricter types
        const simpleTx = tx.toObject ? tx.toObject() : { ...tx };
        const match = simpleTx.description.match(referralRegex);

        // Always replace "new user" with "recruit" if present, for consistency
        simpleTx.description = simpleTx.description.replace('new user', 'recruit');

        if (match && match[1]) {
          const username = userMap.get(match[1]);
          if (username) {
            simpleTx.description = simpleTx.description.replace(match[1], username);
          }
        }
        return simpleTx;
      });
    }

    res.json({
      _id: wallet._id,
      balance: wallet.balance,
      transactions: {
        data: finalTxs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { amount, method, details } = req.body;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check System Setting for KYC
    const requireKYC = await getSettingValue('withdrawals_require_kyc', false);
    if (requireKYC) {
      if (req.user.kycStatus !== 'approved') {
        return res.status(403).json({
          message: 'KYC Verification Required',
          error: 'kyc_required'
        });
      }
    }

    if (amount < 10) {
      return res.status(400).json({ message: 'Minimum withdrawal is $10' });
    }

    // Deduct balance immediately to prevent double spend
    wallet.balance -= amount;

    wallet.transactions.unshift({
      type: 'WITHDRAWAL',
      amount: -amount,
      date: new Date(),
      description: `Payout Request via ${method} (${details})`,
      status: 'PENDING'
    } as any);

    await wallet.save();
    res.json({ message: 'Withdrawal requested successfully', balance: wallet.balance });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all pending withdrawals (Paginated)
export const getPendingWithdrawals = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    // Sort logic handled in aggregation pipeline manually or via helpers if adapted
    // Default sort by date desc
    const sortParams = req.query.sortOrder === 'asc' ? 1 : -1;

    const pipeline: any[] = [
      // 1. Unwind transactions to treat them as individual documents
      { $unwind: '$transactions' },
      // 2. Match only pending withdrawals
      {
        $match: {
          'transactions.status': 'PENDING',
          'transactions.type': 'WITHDRAWAL'
        }
      },
      // 3. Lookup User Info
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      // 4. Project cleaner structure and support search
      {
        $project: {
          _id: '$transactions._id',
          walletId: '$_id',
          transaction: '$transactions',
          user: {
            _id: '$user._id',
            username: '$user.username',
            email: '$user.email'
          },
          // Hoisted fields for searching/sorting
          amount: '$transactions.amount',
          date: '$transactions.date',
          username: '$user.username'
        }
      }
    ];

    // 5. Search Filter
    const search = req.query.search as string;
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // 6. Pagination Facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { date: sortParams } },
          { $skip: skip },
          { $limit: limit }
        ]
      }
    });

    const result = await Wallet.aggregate(pipeline);
    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

    res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin only
export const processWithdrawal = async (req: Request, res: Response) => {
  try {
    const { userId, transactionId, action } = req.body; // action: 'APPROVE' | 'REJECT'

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    const tx = wallet.transactions.find((t: any) => t._id.toString() === transactionId);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    if (tx.status !== 'PENDING') return res.status(400).json({ message: 'Transaction already processed' });

    if (action === 'APPROVE') {
      tx.status = 'COMPLETED';
      // Here you would integrate with Stripe/PayPal Payouts API
    } else if (action === 'REJECT') {
      tx.status = 'FAILED';
      // Refund balance
      wallet.balance += Math.abs(tx.amount);
      wallet.transactions.unshift({
        type: 'DEPOSIT',
        amount: Math.abs(tx.amount),
        date: new Date(),
        description: `Refund: Withdrawal Rejected`,
        status: 'COMPLETED'
      } as any);
    }

    await wallet.save();

    // NOTIFY
    if (action === 'APPROVE') {
      await createNotification(
        userId,
        'success',
        'Withdrawal Approved',
        `Your withdrawal request for $${Math.abs(tx.amount).toFixed(2)} has been processed.`
      );
    } else {
      await createNotification(
        userId,
        'error',
        'Withdrawal Rejected',
        `Your withdrawal request for $${Math.abs(tx.amount).toFixed(2)} was rejected. Funds have been returned to your wallet.`
      );
    }

    res.json({ message: `Withdrawal ${action.toLowerCase()}d` });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};