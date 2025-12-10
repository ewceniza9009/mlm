import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Commission from '../models/Commission'; // Import Commission
import { Types } from 'mongoose';

// Get Tree
export const getTree = async (req: Request, res: Response) => {
  try {
    const { rootId } = req.query;
    let root: IUser | null;

    if (rootId) {
      root = await User.findById(rootId);
    } else {
      // Default to root user
      root = await User.findOne({ username: 'root' });
      if (!root) {
        root = await User.findOne({ level: 0 });
      }
    }

    if (!root) return res.status(404).json({ message: 'Root not found' });

    // Build tree with depth 4 for better visibility
    const tree = await buildTree(root, 4);
    res.json(tree);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

interface TreeNode {
  name: string;
  attributes: {
    id: Types.ObjectId;
    rank?: string;
    active: boolean;
    leftPV?: number;
    rightPV?: number;
    totalEarned?: number; // Added field
  };
  children: TreeNode[];
}

const buildTree = async (node: IUser, depth: number): Promise<TreeNode | null> => {
  if (depth < 0 || !node) return null;

  // Fetch Commission Data for this node
  const commission = await Commission.findOne({ userId: node._id });

  const nodeData: TreeNode = {
    name: node.username,
    attributes: {
      id: node._id as Types.ObjectId,
      rank: node.rank,
      active: node.isActive,
      leftPV: node.currentLeftPV || 0,
      rightPV: node.currentRightPV || 0,
      totalEarned: commission ? commission.totalEarned : 0 // Include total earnings
    },
    children: []
  };

  if (node.leftChildId) {
    const leftChild = await User.findById(node.leftChildId);
    if (leftChild) {
      const childNode = await buildTree(leftChild, depth - 1);
      if (childNode) nodeData.children.push(childNode);
    }
  }

  if (node.rightChildId) {
    const rightChild = await User.findById(node.rightChildId);
    if (rightChild) {
      const childNode = await buildTree(rightChild, depth - 1);
      if (childNode) nodeData.children.push(childNode);
    }
  }

  return nodeData;
};

export const getUpline = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const user = await User.findById(userId).populate('sponsorId', 'username email rank');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      sponsor: user.sponsorId // This will be null if they are Root
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving upline' });
  }
};

// Search Downline
export const searchDownline = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    // @ts-ignore
    const currentUserId = req.user._id;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query required' });
    }

    console.log(`[Search] User: ${currentUserId} Query: ${query}`);

    // Loose search for debugging
    const searchCondition = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    const results = await User.find(searchCondition)
      .select('username email rank kycStatus enrollmentDate path')
      .limit(20);

    console.log(`[Search] Found ${results.length} results`);

    res.json(results);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};