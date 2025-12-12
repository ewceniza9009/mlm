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
    const { userId, levels } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Parse path to find ancestors
    // Path format: ,rootId,ancestorId,parentId,userId,
    // We split by ',' and filter empty strings
    const pathIds = (targetUser.path || '').split(',').filter(id => id && id.trim().length > 0);

    // Determine how many levels to go up
    const depth = parseInt(levels as string) || 5;

    let selectedAncestorIds: string[] = [];

    // STRATEGY 1: Use Path if available
    // Check if we have enough ancestors in path (more than just self)
    if (pathIds.length > 1) {
      // Path includes self at end usually
      const ancestorIds = pathIds.slice(0, -1);
      selectedAncestorIds = ancestorIds.slice(-depth);
    }

    // STRATEGY 2: Fallback to manual crawl if path is empty/broken but parent exists
    // (Only if we didn't find enough ancestors via path and parentId is present)
    if (selectedAncestorIds.length === 0 && targetUser.parentId) {
      console.log('[getUpline] Fallback Strategy Triggered');
      let current: IUser | null = targetUser;
      const foundAncestors: string[] = [];

      // Crawl up manually
      for (let i = 0; i < depth; i++) {
        // console.log(`[getUpline] Crawl step ${i}, current: ${current?._id}, parentId: ${current?.parentId}`);
        if (!current || !current.parentId) break;

        try {
          const parent: IUser | null = await User.findById(current.parentId);
          if (parent) {
            console.log(`[getUpline] Found parent: ${parent.username} (${parent._id})`);
            foundAncestors.unshift(parent._id.toString());
            current = parent;
          } else {
            console.log('[getUpline] Parent ID exists but user not found');
            break;
          }
        } catch (e) {
          console.error('[getUpline] Error finding parent:', e);
          break;
        }
      }
      selectedAncestorIds = foundAncestors;
      console.log(`[getUpline] Final Manual Ancestors: ${selectedAncestorIds.join(', ')}`);
    }

    // If still no ancestors (e.g. root), just return the user themselves
    if (selectedAncestorIds.length === 0) {
      const tree = await buildUplineNode(targetUser, null);
      return res.json(tree);
    }

    // Fetch all involved users (ancestors + target)
    const allIds = [...selectedAncestorIds, targetUser._id];
    const users = await User.find({ _id: { $in: allIds } });
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Construct the linear chain
    // The first one in selectedAncestorIds is the top-most visible ancestor
    const rootAncestorId = selectedAncestorIds[0];
    const rootAncestor = userMap.get(rootAncestorId.toString());

    if (!rootAncestor) {
      // Fallback
      return res.json(await buildUplineNode(targetUser, null));
    }

    // Build the chain
    const buildChain = async (index: number): Promise<TreeNode> => {
      const currentId = selectedAncestorIds[index];
      const currentUser = userMap.get(currentId.toString());

      if (!currentUser) return null as any;

      const node = await buildUplineNode(currentUser);

      // If there is a next ancestor
      if (index + 1 < selectedAncestorIds.length) {
        const childNode = await buildChain(index + 1);
        if (childNode) node.children.push(childNode);
      } else {
        // The next one is the target user
        const targetNode = await buildUplineNode(targetUser);
        node.children.push(targetNode);
      }

      return node;
    };

    const tree = await buildChain(0);
    res.json(tree);

  } catch (err) {
    console.error('Upline Error:', err);
    res.status(500).json({ message: 'Server error retrieving upline' });
  }
};

// Helper for Upline Nodes (similar to buildTree but non-recursive fetching)
const buildUplineNode = async (user: IUser, childNode?: TreeNode | null): Promise<TreeNode> => {
  // Fetch Commission Data
  const commission = await Commission.findOne({ userId: user._id });

  const node: TreeNode = {
    name: user.username,
    attributes: {
      id: user._id as Types.ObjectId,
      rank: user.rank,
      active: user.isActive,
      leftPV: user.currentLeftPV || 0,
      rightPV: user.currentRightPV || 0,
      totalEarned: commission ? commission.totalEarned : 0
    },
    children: childNode ? [childNode] : []
  };
  return node;
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

// Get Member Details
export const getMemberDetails = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    // @ts-ignore
    const currentUserId = req.user._id;

    if (!memberId) {
      return res.status(400).json({ message: 'Member ID required' });
    }

    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Security check: Ensure member is in downline (or is self)
    // We can check if member.path contains currentUserId or if member._id === currentUserId
    // Also allow admin to view anyone
    // @ts-ignore
    const requestor = await User.findById(currentUserId);

    const isSelf = memberId === currentUserId.toString();
    const isDownline = member.path && member.path.includes(currentUserId.toString());
    const isAdmin = requestor && requestor.role === 'admin';

    if (!isSelf && !isDownline && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized access to member details' });
    }

    // Fetch stats
    const commission = await Commission.findOne({ userId: memberId });
    const directRecruitsCount = await User.countDocuments({ sponsorId: memberId });
    const totalTeamSize = await User.countDocuments({ path: { $regex: `,${memberId},` } });

    res.json({
      profile: {
        username: member.username,
        email: member.email,
        rank: member.rank,
        firstName: member.firstName,
        lastName: member.lastName,
        occupation: member.occupation,
        phone: member.phone,
        address: member.address,
        country: member.address?.country,
        enrollmentDate: member.enrollmentDate,
        profileImage: member.profileImage,
        active: member.isActive
      },
      stats: {
        currentLeftPV: member.currentLeftPV,
        currentRightPV: member.currentRightPV,
        totalEarned: commission ? commission.totalEarned : 0,
        directRecruits: directRecruitsCount,
        teamSize: totalTeamSize
      }
    });

  } catch (err) {
    console.error('Get Member Details Error:', err);
    res.status(500).json({ message: 'Server error retrieving member details' });
  }
};