import User, { IUser } from '../models/User';
import Wallet from '../models/Wallet';
import Commission from '../models/Commission';

export class CommissionEngine {
  
  // 1. Referral Bonus: 10% of Package Price (Fixed $10 for demo)
  static async distributeReferralBonus(sponsorId: string, newUserId: string) {
    const sponsor = await User.findById(sponsorId);
    if (!sponsor) return;

    const bonusAmount = 10.00;

    // Credit Wallet
    let wallet = await Wallet.findOne({ userId: sponsor._id });
    if (!wallet) {
      wallet = new Wallet({ userId: sponsor._id, balance: 0 });
    }
    wallet.balance += bonusAmount;
    wallet.transactions.push({
      amount: bonusAmount,
      type: 'COMMISSION',
      description: `Referral Bonus for new user ${newUserId}`,
      date: new Date(),
      status: 'COMPLETED'
    });
    await wallet.save();

    // Update Commission Record
    let commission = await Commission.findOne({ userId: sponsor._id });
    if (!commission) {
      commission = new Commission({ userId: sponsor._id, totalEarned: 0 });
    }
    commission.totalEarned += bonusAmount;
    commission.history.push({
        amount: bonusAmount,
        type: 'DIRECT_REFERRAL',
        relatedUserId: newUserId as any,
        date: new Date(),
        details: 'Direct Referral Signup'
    });
    await commission.save();
    
    console.log(`[CommissionEngine] Referral Bonus: $${bonusAmount} to ${sponsor.username}`);
  }

  // 2. Binary Pairing Logic (Enhanced with Capping/Flushing)
  static async runBinaryPairing(userId: string) {
    const user = await User.findById(userId);
    if (!user) return;

    // CONFIGURATION
    const PAIR_UNIT = 100; // 100 PV : 100 PV
    const COMMISSION_PER_PAIR = 10; // $10 per pair
    const DAILY_CAP_AMOUNT = 500; // Max $500 per day (Flashout)

    const left = user.currentLeftPV;
    const right = user.currentRightPV;
    
    // Calculate Pairs
    const possibleLeftPairs = Math.floor(left / PAIR_UNIT);
    const possibleRightPairs = Math.floor(right / PAIR_UNIT);
    let pairs = Math.min(possibleLeftPairs, possibleRightPairs);
    
    if (pairs > 0) {
      let payout = pairs * COMMISSION_PER_PAIR;
      const usedPV = pairs * PAIR_UNIT;

      // --- CAPPING LOGIC (FLASHOUT) ---
      let isCapped = false;
      if (payout > DAILY_CAP_AMOUNT) {
        payout = DAILY_CAP_AMOUNT;
        isCapped = true;
      }

      // Update User PV (Flush used PV)
      user.currentLeftPV -= usedPV;
      user.currentRightPV -= usedPV;
      await user.save();

      // Credit Wallet
      await this.creditWallet(user._id.toString(), payout, 'BINARY_BONUS', `Matched ${pairs} pairs.${isCapped ? ' (Capped)' : ''}`);

      // Update Commission Stats
      await this.updateCommissionStats(user._id.toString(), payout, 'BINARY_BONUS');

      // --- TRIGGER MATCHING BONUS ---
      if (payout > 0) {
        await this.distributeMatchingBonus(user._id.toString(), payout);
      }

      // --- CHECK RANK ADVANCEMENT ---
      await this.checkRankAdvancement(user);
      
      console.log(`[CommissionEngine] User ${user.username}: Matched ${pairs} pairs. Payout $${payout}.`);
    }
  }

  // 3. Matching Bonus (Unilevel logic on top of Binary)
  static async distributeMatchingBonus(earnerId: string, binaryIncome: number) {
    const generations = [0.10, 0.05, 0.02]; // L1: 10%, L2: 5%, L3: 2%
    
    let currentUser = await User.findById(earnerId);
    let currentLevel = 0;

    // Traverse up the SPONSOR tree
    while (currentUser && currentUser.sponsorId && currentLevel < generations.length) {
      const sponsor = await User.findById(currentUser.sponsorId);
      if (!sponsor) break;

      const bonusAmount = binaryIncome * generations[currentLevel];
      
      if (bonusAmount > 0) {
        await this.creditWallet(
          sponsor._id.toString(), 
          bonusAmount, 
          'MATCHING_BONUS', 
          `Matching bonus (${(generations[currentLevel]*100)}%) from ${currentUser.username}'s binary income`
        );
        await this.updateCommissionStats(sponsor._id.toString(), bonusAmount, 'MATCHING_BONUS');
      }

      currentUser = sponsor;
      currentLevel++;
    }
  }

  // 4. Rank Advancement
  static async checkRankAdvancement(user: IUser) {
    const commission = await Commission.findOne({ userId: user._id });
    if (!commission) return;

    const total = commission.totalEarned;
    let newRank = user.rank;

    // Simple Total Earnings based Rank logic
    if (total >= 1000 && user.rank === 'Bronze') newRank = 'Silver';
    else if (total >= 5000 && (user.rank === 'Silver' || user.rank === 'Bronze')) newRank = 'Gold';
    else if (total >= 20000 && user.rank !== 'Diamond') newRank = 'Diamond';

    if (newRank !== user.rank) {
      user.rank = newRank;
      await user.save();
      
      // One-time Rank Bonus
      const rankBonus = newRank === 'Silver' ? 50 : newRank === 'Gold' ? 200 : 1000;
      await this.creditWallet(user._id.toString(), rankBonus, 'RANK_ACHIEVEMENT', `Promoted to ${newRank}`);
      await this.updateCommissionStats(user._id.toString(), rankBonus, 'RANK_ACHIEVEMENT');
    }
  }

  // 5. Update Upline PV
  static async updateUplinePV(userId: string, pvAmount: number) {
    let currentUser = await User.findById(userId);
    
    while (currentUser && currentUser.parentId) {
      const parent = await User.findById(currentUser.parentId);
      if (!parent) break;

      if (parent.leftChildId && parent.leftChildId.toString() === currentUser._id.toString()) {
        parent.currentLeftPV += pvAmount;
      } else if (parent.rightChildId && parent.rightChildId.toString() === currentUser._id.toString()) {
        parent.currentRightPV += pvAmount;
      }
      
      await parent.save();
      
      // Trigger binary check for parent immediately
      await this.runBinaryPairing(parent._id.toString());

      currentUser = parent;
    }
    console.log(`[CommissionEngine] PV Propagated: ${pvAmount} PV up the tree line.`);
  }

  // Helper: Credit Wallet
  private static async creditWallet(userId: string, amount: number, type: string, description: string) {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = new Wallet({ userId, balance: 0 });
    
    wallet.balance += amount;
    wallet.transactions.push({
      type: 'COMMISSION',
      amount,
      date: new Date(),
      description,
      status: 'COMPLETED'
    } as any);
    await wallet.save();
  }

  // Helper: Update Commission Doc
  private static async updateCommissionStats(userId: string, amount: number, type: string) {
    let commission = await Commission.findOne({ userId });
    if (!commission) commission = new Commission({ userId, totalEarned: 0 });
    commission.totalEarned += amount;
    commission.history.push({
      type: type as any,
      amount,
      date: new Date(),
      details: 'Auto-calculated'
    });
    await commission.save();
  }
}