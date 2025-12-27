import User, { IUser } from '../models/User';
import Commission from '../models/Commission';
import mongoose, { Types } from 'mongoose';

/**
 * Spillover Service
 * Handles the placement of new users in the binary tree.
 */

interface PlacementResult {
  parentId: Types.ObjectId | string;
  position: 'left' | 'right';
}

const findPlacement = async (sponsorId: string | Types.ObjectId, preference: string = 'weaker_leg', session: mongoose.ClientSession | undefined = undefined): Promise<PlacementResult> => {
  const sponsor = await User.findById(sponsorId).session(session || null);
  if (!sponsor) throw new Error('Sponsor not found');

  // Extreme Left/Right
  if (preference === 'extreme_left' || preference === 'left') {
    if (!sponsor.leftChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'left' };
    return traverseExtreme(sponsor.leftChildId, 'left', session);
  }

  if (preference === 'extreme_right' || preference === 'right') {
    if (!sponsor.rightChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'right' };
    return traverseExtreme(sponsor.rightChildId, 'right', session);
  }

  // Multi-Center / Alternate (1 Left, 1 Right)
  // Balances tree density by filling the side with fewer members.
  if (preference === 'balanced' || preference === 'alternate') {
    if (!sponsor.leftChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'left' };
    if (!sponsor.rightChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'right' };

    // Get subtree counts synchronously (or approximation via PV)
    // For true 1:1 balance, we need descendant count.

    // Check Left Subtree Count (Regex count)
    const leftCount = await User.countDocuments({ path: { $regex: `,${sponsor.leftChildId.toString()},` } }).session(session || null);

    // Check Right Subtree Count
    const rightCount = await User.countDocuments({ path: { $regex: `,${sponsor.rightChildId.toString()},` } }).session(session || null);

    if (leftCount <= rightCount) {
      return traverseToFirstEmpty(sponsor.leftChildId, session);
    } else {
      return traverseToFirstEmpty(sponsor.rightChildId, session);
    }
  }

  // Weaker Leg Logic (Default)
  if (!sponsor.leftChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'left' };
  if (!sponsor.rightChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'right' };

  const commission = await Commission.findOne({ userId: sponsor._id }).session(session || null);
  const leftPV = commission ? commission.leftLegPV + commission.carriedLeftPV : 0;
  const rightPV = commission ? commission.rightLegPV + commission.carriedRightPV : 0;

  if (leftPV < rightPV) {
    if (!sponsor.leftChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'left' };
    return traverseToFirstEmpty(sponsor.leftChildId, session);
  } else if (rightPV < leftPV) {
    if (!sponsor.rightChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'right' };
    return traverseToFirstEmpty(sponsor.rightChildId, session);
  } else {
    // PV is EQUAL (Tie-Breaker needed)
    // Common in Shop First (0 vs 0)
    // Secondary Check: Member Count (Balance the tree structure)

    // Check immediate availability first (Optimization)
    if (!sponsor.leftChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'left' };
    if (!sponsor.rightChildId) return { parentId: sponsor._id as Types.ObjectId, position: 'right' };

    // We need to count members in each leg to decide
    // Regex count used for accurate structural balancing.
    const leftCount = await User.countDocuments({ path: { $regex: `,${sponsor.leftChildId.toString()},` } }).session(session || null);
    const rightCount = await User.countDocuments({ path: { $regex: `,${sponsor.rightChildId.toString()},` } }).session(session || null);

    if (leftCount <= rightCount) {
      return traverseToFirstEmpty(sponsor.leftChildId, session);
    } else {
      return traverseToFirstEmpty(sponsor.rightChildId, session);
    }
  }
};

const traverseExtreme = async (nodeId: Types.ObjectId, side: 'left' | 'right', session: mongoose.ClientSession | undefined = undefined): Promise<PlacementResult> => {
  let currentId = nodeId;
  while (true) {
    const node = await User.findById(currentId).session(session || null);
    if (!node) throw new Error('Node integrity error'); // Should not happen

    if (side === 'left') {
      if (!node.leftChildId) return { parentId: node._id as Types.ObjectId, position: 'left' };
      currentId = node.leftChildId;
    } else {
      if (!node.rightChildId) return { parentId: node._id as Types.ObjectId, position: 'right' };
      currentId = node.rightChildId;
    }
  }
};

const traverseToFirstEmpty = async (startNodeId: Types.ObjectId, session: mongoose.ClientSession | undefined = undefined): Promise<PlacementResult> => {
  const queue: Types.ObjectId[] = [startNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const node = await User.findById(currentId).session(session || null);
    if (!node) continue;

    if (!node.leftChildId) return { parentId: node._id as Types.ObjectId, position: 'left' };
    if (!node.rightChildId) return { parentId: node._id as Types.ObjectId, position: 'right' };

    queue.push(node.leftChildId);
    queue.push(node.rightChildId);
  }
  throw new Error('Tree full');
};

const placeUser = async (newUser: IUser, sponsorId: string, preferenceOverride?: string, session?: mongoose.ClientSession): Promise<IUser> => {
  const sponsor = await User.findById(sponsorId).session(session || null);
  if (!sponsor) throw new Error('Cannot find sponsor');

  const preference: string = preferenceOverride || sponsor.spilloverPreference || 'weaker_leg';

  console.log(`[Spillover] Placing User: ${newUser.username} for Sponsor: ${sponsor.username} (${sponsorId})`);
  console.log(`[Spillover] Preference: ${preference} (Override: ${preferenceOverride}, Sponsor: ${sponsor.spilloverPreference})`);

  const placement = await findPlacement(sponsorId, preference, session);

  console.log(`[Spillover] Placement Found: Parent=${placement.parentId}, Position=${placement.position}`);

  newUser.parentId = placement.parentId as any; // Cast if necessary, Types.ObjectId is compatible
  newUser.position = placement.position;
  newUser.sponsorId = new Types.ObjectId(sponsorId);

  const savedUser = await newUser.save({ session });

  const parent = await User.findById(placement.parentId).session(session || null);
  if (parent) {
    if (placement.position === 'left') {
      parent.leftChildId = savedUser._id as Types.ObjectId;
    } else {
      parent.rightChildId = savedUser._id as Types.ObjectId;
    }
    await parent.save({ session });
  }

  return savedUser;
};

export default { placeUser };
