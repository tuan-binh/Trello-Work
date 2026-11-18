import { apiClient } from "./api";

// --- Types ---
export interface WorkspaceItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  currentUserRole: string;
}

export interface BoardSummary {
  id: number;
  title: string;
  workspaceId: number;
  workspaceName: string;
  bgGradient?: string;
  bgImage?: string;
  starred: boolean;
  visibility: "PRIVATE" | "WORKSPACE" | "PUBLIC";
  recentViewed?: string;
}

export interface BoardMemberDto {
  id: number;
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
  role: "ADMIN" | "MEMBER" | "OBSERVER";
  status: "ACTIVE" | "PENDING";
}

export interface LabelDto {
  id: number;
  name: string;
  color: string;
}

export interface ChecklistItemDto {
  id: number;
  text: string;
  done: boolean;
  position: number;
}

export interface ChecklistDto {
  id: number;
  title: string;
  position: number;
  items: ChecklistItemDto[];
}

export interface AttachmentDto {
  id: number;
  name: string;
  url: string;
  size: string;
  isCover: boolean;
  createdAt: string;
}

export interface CommentDto {
  id: number;
  author: string;
  initials: string;
  avatarBg: string;
  text: string;
  createdAt: string;
}

export interface ActivityDto {
  id: number;
  author: string;
  actionText: string;
  targetText?: string;
  createdAt: string;
}

export interface CardSummaryDto {
  id: number;
  title: string;
  description?: string;
  position: number;
  labels: LabelDto[];
  checklistTotal?: number;
  checklistDone?: number;
  commentsCount?: number;
  dueDate?: string;
  isDueComplete: boolean;
  members: string[];
  coverUrl?: string;
  coverColor?: string;
  isArchived: boolean;
}

export interface ListDto {
  id: number;
  title: string;
  position: number;
  isArchived: boolean;
  cards: CardSummaryDto[];
}

export interface BoardDetailDto {
  id: number;
  title: string;
  workspace: string;
  workspaceId: number;
  bgGradient?: string;
  bgImage?: string;
  starred: boolean;
  visibility: "PRIVATE" | "WORKSPACE" | "PUBLIC";
  members: BoardMemberDto[];
  labels: LabelDto[];
  lists: ListDto[];
}

export interface CardDetailDto {
  id: number;
  listId: number;
  listTitle: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string;
  isDueComplete: boolean;
  coverUrl?: string;
  coverColor?: string;
  isArchived: boolean;
  labels: LabelDto[];
  members: BoardMemberDto[];
  checklists: ChecklistDto[];
  attachments: AttachmentDto[];
  comments: CommentDto[];
  activities: ActivityDto[];
}

// --- Service Functions ---

// 1. Workspaces
export const getMyWorkspaces = () => apiClient<WorkspaceItem[]>("/api/v1/workspaces");
export const createWorkspace = (data: { name: string; description?: string }) =>
  apiClient<WorkspaceItem>("/api/v1/workspaces", { method: "POST", body: JSON.stringify(data) });

// 2. Boards
export const getBoards = (params?: { workspaceId?: number; search?: string; starred?: boolean }) => {
  const query = new URLSearchParams();
  if (params?.workspaceId) query.set("workspaceId", params.workspaceId.toString());
  if (params?.search) query.set("search", params.search);
  if (params?.starred !== undefined) query.set("starred", params.starred.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiClient<BoardSummary[]>(`/api/v1/boards${queryString}`);
};

export const createBoard = (data: {
  workspaceId: number;
  title: string;
  bgGradient?: string;
  bgImage?: string;
  visibility?: string;
}) => apiClient<BoardSummary>("/api/v1/boards", { method: "POST", body: JSON.stringify(data) });

export const getBoardDetail = (boardId: string | number) =>
  apiClient<BoardDetailDto>(`/api/v1/boards/${boardId}`);

export const updateBoard = (
  boardId: string | number,
  data: {
    title?: string;
    starred?: boolean;
    bgGradient?: string;
    bgImage?: string;
    visibility?: string;
  }
) => apiClient<BoardSummary>(`/api/v1/boards/${boardId}`, { method: "PATCH", body: JSON.stringify(data) });

export const inviteBoardMember = (boardId: string | number, data: { email: string; role?: string }) =>
  apiClient<BoardMemberDto>(`/api/v1/boards/${boardId}/members/invite`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateBoardMemberRole = (
  boardId: string | number,
  memberId: string | number,
  data: { role: string }
) =>
  apiClient<BoardMemberDto>(`/api/v1/boards/${boardId}/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const removeBoardMember = (boardId: string | number, memberId: string | number) =>
  apiClient<void>(`/api/v1/boards/${boardId}/members/${memberId}`, { method: "DELETE" });

export const getBoardInviteLink = (boardId: string | number) =>
  apiClient<{ inviteUrl: string }>(`/api/v1/boards/${boardId}/invite-link`);

// 3. Lists
export const createList = (boardId: string | number, data: { title: string; position?: number }) =>
  apiClient<ListDto>(`/api/v1/boards/${boardId}/lists`, { method: "POST", body: JSON.stringify(data) });

export const updateList = (listId: string | number, data: { title?: string; isArchived?: boolean }) =>
  apiClient<ListDto>(`/api/v1/lists/${listId}`, { method: "PATCH", body: JSON.stringify(data) });

export const reorderLists = (
  boardId: string | number,
  data: { listOrders: { listId: number; position: number }[] }
) =>
  apiClient<void>(`/api/v1/boards/${boardId}/lists/reorder`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const sortList = (listId: string | number, sortBy: "TITLE_ASC" | "DUE_DATE_ASC") =>
  apiClient<ListDto>(`/api/v1/lists/${listId}/sort`, {
    method: "POST",
    body: JSON.stringify({ sortBy }),
  });

// 4. Cards
export const createCard = (listId: string | number, data: { title: string; position?: number }) =>
  apiClient<CardSummaryDto>(`/api/v1/lists/${listId}/cards`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getCardDetail = (cardId: string | number) =>
  apiClient<CardDetailDto>(`/api/v1/cards/${cardId}`);

export const updateCard = (
  cardId: string | number,
  data: {
    title?: string;
    description?: string;
    dueDate?: string;
    isDueComplete?: boolean;
    coverUrl?: string;
    coverColor?: string;
    isArchived?: boolean;
  }
) =>
  apiClient<CardSummaryDto>(`/api/v1/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const moveCard = (
  cardId: string | number,
  data: { targetListId: number; targetPosition: number }
) =>
  apiClient<CardSummaryDto>(`/api/v1/cards/${cardId}/move`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteCard = (cardId: string | number) =>
  apiClient<void>(`/api/v1/cards/${cardId}`, { method: "DELETE" });

export const addCardMember = (cardId: string | number, userId: string | number) =>
  apiClient<void>(`/api/v1/cards/${cardId}/members/${userId}`, { method: "POST" });

export const removeCardMember = (cardId: string | number, userId: string | number) =>
  apiClient<void>(`/api/v1/cards/${cardId}/members/${userId}`, { method: "DELETE" });

export const addCardLabel = (cardId: string | number, labelId: string | number) =>
  apiClient<void>(`/api/v1/cards/${cardId}/labels/${labelId}`, { method: "POST" });

export const removeCardLabel = (cardId: string | number, labelId: string | number) =>
  apiClient<void>(`/api/v1/cards/${cardId}/labels/${labelId}`, { method: "DELETE" });

export const addCardComment = (cardId: string | number, text: string) =>
  apiClient<CommentDto>(`/api/v1/cards/${cardId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const getCardActivities = (cardId: string | number) =>
  apiClient<{ comments: CommentDto[]; activities: ActivityDto[] }>(`/api/v1/cards/${cardId}/activities`);

// 5. Checklists
export const createChecklist = (cardId: string | number, title: string) =>
  apiClient<ChecklistDto>(`/api/v1/cards/${cardId}/checklists`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });

export const deleteChecklist = (checklistId: string | number) =>
  apiClient<void>(`/api/v1/checklists/${checklistId}`, { method: "DELETE" });

export const addChecklistItem = (checklistId: string | number, text: string) =>
  apiClient<ChecklistItemDto>(`/api/v1/checklists/${checklistId}/items`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const updateChecklistItem = (
  itemId: string | number,
  data: { text?: string; done?: boolean }
) =>
  apiClient<ChecklistItemDto>(`/api/v1/checklist-items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteChecklistItem = (itemId: string | number) =>
  apiClient<void>(`/api/v1/checklist-items/${itemId}`, { method: "DELETE" });

// 6. Labels
export const getBoardLabels = (boardId: string | number) =>
  apiClient<LabelDto[]>(`/api/v1/boards/${boardId}/labels`);

export const createBoardLabel = (boardId: string | number, data: { name: string; color: string }) =>
  apiClient<LabelDto>(`/api/v1/boards/${boardId}/labels`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// 7. Attachments
export const uploadAttachment = (cardId: string | number, file: File, isCover?: boolean) => {
  const formData = new FormData();
  formData.append("file", file);
  if (isCover !== undefined) {
    formData.append("isCover", String(isCover));
  }
  return apiClient<AttachmentDto>(`/api/v1/cards/${cardId}/attachments`, {
    method: "POST",
    body: formData,
  });
};

export const toggleAttachmentCover = (attachmentId: string | number, isCover: boolean) =>
  apiClient<AttachmentDto>(`/api/v1/attachments/${attachmentId}/cover`, {
    method: "PATCH",
    body: JSON.stringify({ isCover }),
  });

export const deleteAttachment = (attachmentId: string | number) =>
  apiClient<void>(`/api/v1/attachments/${attachmentId}`, { method: "DELETE" });
