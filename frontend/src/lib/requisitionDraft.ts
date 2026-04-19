export const REQUISITION_DRAFT_STORAGE_KEY = "requisition_ai_draft";

export interface RequisitionDraftItem {
  itemId: number;
  itemName: string;
  quantity: number;
  rationale?: string;
}

export interface RequisitionDraftPayload {
  parentOfficeId: number;
  reason?: string;
  items: RequisitionDraftItem[];
}

export const saveRequisitionDraft = (payload: RequisitionDraftPayload) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(REQUISITION_DRAFT_STORAGE_KEY, JSON.stringify(payload));
};

export const consumeRequisitionDraft = (): RequisitionDraftPayload | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(REQUISITION_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  localStorage.removeItem(REQUISITION_DRAFT_STORAGE_KEY);

  try {
    const parsed = JSON.parse(raw) as RequisitionDraftPayload;
    if (!parsed?.parentOfficeId || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};