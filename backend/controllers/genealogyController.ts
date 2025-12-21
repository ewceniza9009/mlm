import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Commission from '../models/Commission';
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
    personalPV?: number;
    groupVolume?: number;
    totalEarned?: number;
    heat: number; // 0-100 score for Heatmap
  };
  children: TreeNode[];
}

const calculateHeat = async (node: IUser): Promise<number> => {
  if (!node.isActive) return 0;

  let score = 0;

  // 1. Recency (Momentum) - Max 30 pts
  // New members within 7 days get full points, degrading over 30 days
  const daysSinceJoined = Math.floor((Date.now() - new Date(node.enrollmentDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceJoined <= 7) score += 30;
  else if (daysSinceJoined <= 30) score += 15;

  // 2. Personal Production (Sales) - Max 40 pts
  const pv = node.personalPV || 0;
  if (pv >= 500) score += 40;       // Super Seller
  else if (pv >= 200) score += 30;  // High Performer
  else if (pv >= 100) score += 20;  // Standard Active
  else if (pv > 0) score += 10;     // Minimum Activity

  // 3. Recruitment Activity (Growth) - Max 30 pts
  // Check for recent recruits in the last 30 days
  // Note: This requires a DB lookup, so we make this function async
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRecruits = await User.countDocuments({
    sponsorId: node._id,
    enrollmentDate: { $gte: thirtyDaysAgo }
  });

  if (recentRecruits >= 5) score += 30;      // Massive growth
  else if (recentRecruits >= 3) score += 20; // Strong growth
  else if (recentRecruits >= 1) score += 10; // Active builder

  return Math.min(100, score);
};

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
      personalPV: node.personalPV || 0,
      groupVolume: (node.currentLeftPV || 0) + (node.currentRightPV || 0), // Added Group Volume
      totalEarned: commission ? commission.totalEarned : 0, // Include total earnings
      heat: await calculateHeat(node)
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
      groupVolume: (user.currentLeftPV || 0) + (user.currentRightPV || 0),
      totalEarned: commission ? commission.totalEarned : 0,
      heat: await calculateHeat(user)
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

// Helper for getting settings (imported or defined locally if simpler to avoid circular deps)
import SystemSetting from '../models/SystemSetting';

// ... (other imports remain at top)

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

    // Fetch Rank Requirements
    const settings = await SystemSetting.findOne({ key: 'rankRequirements' });
    const rankReqs = settings ? settings.value : {
      "Bronze": { "earnings": 0, "recruits": 0 },
      "Silver": { "earnings": 1000, "recruits": 2 },
      "Gold": { "earnings": 5000, "recruits": 5 },
      "Diamond": { "earnings": 20000, "recruits": 10 }
    };

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
        active: member.isActive,
        sponsor: member.sponsorId ? await User.findById(member.sponsorId).select('username _id') : null
      },
      stats: {
        currentLeftPV: member.currentLeftPV,
        currentRightPV: member.currentRightPV,
        personalPV: member.personalPV || 0,
        groupVolume: (member.currentLeftPV || 0) + (member.currentRightPV || 0),
        totalEarned: commission ? commission.totalEarned : 0,
        directRecruits: directRecruitsCount,
        teamSize: totalTeamSize,
        rankProgress: calculateRankProgress(member.rank, commission ? commission.totalEarned : 0, directRecruitsCount, rankReqs)
      }
    });

  } catch (err) {
    console.error('Get Member Details Error:', err);
    res.status(500).json({ message: 'Server error retrieving member details' });
  }
};

// Helper: Calculate Rank Progress
const calculateRankProgress = (currentRank: string, totalEarned: number, recruits: number, rules: any) => {
  const ranks = ['Bronze', 'Silver', 'Gold', 'Diamond'];
  let currentIndex = ranks.indexOf(currentRank);

  // Handle unknown/Member ranks as Bronze (Start of journey)
  if (currentIndex === -1) {
    currentIndex = 0;
  }

  // If max rank
  if (currentIndex === ranks.length - 1) {
    return {
      nextRank: 'Max Rank',
      current: { earnings: totalEarned, recruits },
      target: { earnings: 0, recruits: 0 },
      percent: 100,
      isCompleted: true
    };
  }

  const nextRank = ranks[currentIndex + 1];
  const nextReq = rules[nextRank] || { earnings: 999999, recruits: 999 };

  // Calculate Progress Logic
  // We can treat progress as an average of requirements or the lowest bottleneck.
  // "Road to Legend" usually shows the *lowest* filled bucket (the bottleneck).

  const earningsPct = Math.min(100, (totalEarned / nextReq.earnings) * 100);
  const recruitsPct = Math.min(100, (recruits / nextReq.recruits) * 100);

  // Overall percent is the average or minimum? Minimum is stricter/better for "what's missing".
  // But for a visual bar, average feels more rewarding. 
  // Let's us Minimum for "Completion" logic, but Average for "Progress Bar"? 
  // Actually, visual bars for composite goals usually show the *lowest* % to indicate how far away the *next* milestone is.
  const overallPercent = Math.min(earningsPct, recruitsPct);

  return {
    nextRank,
    target: {
      earnings: nextReq.earnings,
      recruits: nextReq.recruits
    },
    current: {
      earnings: totalEarned,
      recruits
    },
    percent: parseFloat(overallPercent.toFixed(1)),
    requirements: nextReq
  };
};

// Get Downline (List View)
export const getDownline = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    // @ts-ignore
    const currentUserId = req.user._id;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Base query: All users who have currentUserId in their path
    // Path format: ,rootId,ancestorId,parentId,
    const userIdStr = String(currentUserId);
    console.log(`[getDownline] User: ${userIdStr} (stringified)`);
    console.log(`[getDownline] Path Regex: ,${userIdStr},`);

    const queryConditions: any = {
      path: { $regex: `,${userIdStr},` }
    };

    if (search) {
      queryConditions.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(queryConditions);

    const users = await User.find(queryConditions)
      .select('username email rank isActive enrollmentDate currentLeftPV currentRightPV personalPV sponsorId')
      .populate('sponsorId', 'username')
      .sort({ enrollmentDate: -1 }) // Newest first
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: users,
      meta: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (err) {
    console.error('Get Downline Error:', err);
    res.status(500).json({ message: 'Server error retrieving downline' });
  }
};