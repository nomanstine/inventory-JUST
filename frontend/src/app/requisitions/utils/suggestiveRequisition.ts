import { Item } from "@/services/itemService";
import { Purchase } from "@/services/purchaseService";

export interface SuggestedRequisitionItem {
  itemId: number;
  itemName: string;
  quantity: number;
  purchaseCount: number;
  totalQuantity: number;
  lastPurchasedAt?: string;
  score: number;
  rationale: string;
}

interface ItemStats {
  itemId: number;
  itemName: string;
  purchaseCount: number;
  totalQuantity: number;
  weightedQuantity: number;
  lastPurchasedAt?: string;
  lastRecencyWeight: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getRecencyWeight = (purchasedDate: string) => {
  const ageDays = Math.max(0, (Date.now() - new Date(purchasedDate).getTime()) / DAY_IN_MS);
  return Math.max(0.35, 1 - ageDays / 180);
};

export function buildSuggestiveRequisition(
  purchases: Purchase[],
  items: Item[] = [],
  limit: number = 6
): SuggestedRequisitionItem[] {
  const knownItemNames = new Map(items.map((item) => [item.id, item.name]));
  const statsByItem = new Map<number, ItemStats>();

  purchases.forEach((purchase) => {
    const recencyWeight = getRecencyWeight(purchase.purchasedDate);

    purchase.items.forEach((line) => {
      const itemId = line.item.id;
      const itemName = knownItemNames.get(itemId) || line.item.name;
      const current = statsByItem.get(itemId) || {
        itemId,
        itemName,
        purchaseCount: 0,
        totalQuantity: 0,
        weightedQuantity: 0,
        lastPurchasedAt: undefined,
        lastRecencyWeight: 0,
      };

      current.itemName = itemName;
      current.purchaseCount += 1;
      current.totalQuantity += line.quantity;
      current.weightedQuantity += line.quantity * recencyWeight;
      current.lastRecencyWeight = Math.max(current.lastRecencyWeight, recencyWeight);

      if (!current.lastPurchasedAt || new Date(purchase.purchasedDate).getTime() > new Date(current.lastPurchasedAt).getTime()) {
        current.lastPurchasedAt = purchase.purchasedDate;
      }

      statsByItem.set(itemId, current);
    });
  });

  return Array.from(statsByItem.values())
    .filter((stat) => stat.purchaseCount >= 2 || stat.totalQuantity >= 10)
    .map((stat) => {
      const averageQuantity = stat.totalQuantity / stat.purchaseCount;
      const score = (stat.weightedQuantity * 2) + (stat.purchaseCount * 1.5) + stat.lastRecencyWeight;
      const quantity = Math.max(1, Math.round(averageQuantity * (1 + stat.lastRecencyWeight * 0.15)));
      const lastPurchasedLabel = stat.lastPurchasedAt
        ? new Date(stat.lastPurchasedAt).toLocaleDateString()
        : "unknown date";

      return {
        itemId: stat.itemId,
        itemName: stat.itemName,
        quantity,
        purchaseCount: stat.purchaseCount,
        totalQuantity: stat.totalQuantity,
        lastPurchasedAt: stat.lastPurchasedAt,
        score,
        rationale: `Bought ${stat.purchaseCount} times, ${stat.totalQuantity} total units, last purchased on ${lastPurchasedLabel}.`,
      } satisfies SuggestedRequisitionItem;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}