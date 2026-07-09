import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  RewardAdPluginEvents,
  type AdMobRewardItem,
} from "@capacitor-community/admob";

/** Rewarded ad unit for free gems (AdMob). */
const REWARDED_GEM_AD_ID = "ca-app-pub-5778254002496678/3894214791";
/** Rewarded ad unit for the energy boost (AdMob). */
const REWARDED_ENERGY_AD_ID = "ca-app-pub-5778254002496678/5322012388";

let initPromise: Promise<void> | null = null;

/** True only inside the native Android/iOS shell — AdMob does not run on the web. */
export function nativeAdsAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = AdMob.initialize({ initializeForTesting: false }).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

/**
 * Show an AdMob rewarded video.
 * Resolves true only if the user watched long enough to earn the reward.
 * Returns false on the web or if the ad fails to load/show.
 */
async function showRewardedAd(adId: string): Promise<boolean> {
  if (!nativeAdsAvailable()) return false;

  try {
    await ensureInitialized();
  } catch {
    return false;
  }

  let earned = false;
  const rewardListener = await AdMob.addListener(
    RewardAdPluginEvents.Rewarded,
    (_reward: AdMobRewardItem) => {
      earned = true;
    }
  );

  try {
    await AdMob.prepareRewardVideoAd({ adId });
    await AdMob.showRewardVideoAd();
  } catch {
    earned = false;
  } finally {
    await rewardListener.remove();
  }

  return earned;
}

export function showRewardedGemAd(): Promise<boolean> {
  return showRewardedAd(REWARDED_GEM_AD_ID);
}

export function showRewardedEnergyAd(): Promise<boolean> {
  return showRewardedAd(REWARDED_ENERGY_AD_ID);
}
