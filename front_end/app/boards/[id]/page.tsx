"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TextField, Checkbox } from "@mui/material";
import {
  getBoardDetail,
  getCardDetail,
  updateBoard,
  createList,
  updateList,
  reorderLists,
  sortList,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createChecklist,
  createBoardLabel,
  addCardLabel,
  removeCardLabel,
  addCardMember,
  removeCardMember,
  addCardComment,
  uploadAttachment,
  deleteAttachment,
  inviteBoardMember,
  updateBoardMemberRole,
  removeBoardMember
} from "../../lib/boardService";

// --- TYPES ---
export interface BoardMemberItem {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
  role: "ADMIN" | "MEMBER" | "OBSERVER";
  status?: "ACTIVE" | "PENDING";
}

export interface LabelItem {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActivityItem {
  id: string;
  author: string;
  authorName?: string;
  avatarBg?: string;
  actionText: string;
  targetText?: string;
  createdAt: string;
  timestamp: number;
}

export interface CommentItem {
  id: string;
  author: string;
  authorName?: string;
  avatarBg?: string;
  text: string;
  createdAt: string;
  timestamp?: number;
}

export interface AttachmentItem {
  id: string;
  name: string;
  url: string;
  size?: string;
  createdAt: string;
  isCover?: boolean;
}

export interface CardItem {
  id: string;
  title: string;
  description?: string;
  labels: LabelItem[];
  checklistId?: string;
  checklistTotal?: number;
  checklistDone?: number;
  checklistItems?: ChecklistItem[];
  commentsCount?: number;
  comments?: CommentItem[];
  activities?: ActivityItem[];
  dueDate?: string;
  isDueComplete?: boolean;
  members: string[];
  coverUrl?: string;
  coverColor?: string;
  attachments?: AttachmentItem[];
  isArchived?: boolean;
}

export interface ListItem {
  id: string;
  title: string;
  cards: CardItem[];
  isArchived?: boolean;
}

export interface BoardData {
  id: string;
  title: string;
  workspace: string;
  bgGradient?: string;
  bgImage?: string;
  isStarred: boolean;
  lists: ListItem[];
}

// --- DUE DATE STATUS CALCULATOR (TRELLO LOGIC) ---
export type DueDateStatus = "completed" | "overdue" | "dueSoon" | "upcoming";

export function getDueDateStatus(dueDate?: string, isDueComplete?: boolean): {
  status: DueDateStatus;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  checkboxBg: string;
  label: string;
} {
  if (!dueDate) {
    return {
      status: "upcoming",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-600",
      badgeBorder: "border-slate-200",
      checkboxBg: "border-slate-400",
      label: "",
    };
  }

  // 1. If completed (checked)
  if (isDueComplete) {
    return {
      status: "completed",
      badgeBg: "bg-emerald-600 hover:bg-emerald-700",
      badgeText: "text-white",
      badgeBorder: "border-emerald-700",
      checkboxBg: "bg-white text-emerald-600 border-white",
      label: "Đã hoàn tất",
    };
  }

  // 2. Parse due date (e.g. "06 Th11", "07 Th11", "10 Th11" in 2026)
  const match = dueDate.match(/(\d+)\s*(?:Th|\/)(\d+)/i);
  let dueTime = 0;
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    dueTime = new Date(2026, month, day, 23, 59, 59).getTime();
  } else {
    dueTime = new Date(2026, 10, 10, 23, 59, 59).getTime();
  }

  // Today reference is Nov 7, 2026 in the demo
  const now = new Date(2026, 10, 7, 12, 0, 0).getTime();
  const diffHours = (dueTime - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    // Overdue -> ĐỎ (RED)
    return {
      status: "overdue",
      badgeBg: "bg-[#ffd5d2] hover:bg-[#fdd0cd]",
      badgeText: "text-[#ae2e24] font-semibold",
      badgeBorder: "border-transparent",
      checkboxBg: "border-[#ae2e24]/70 hover:bg-[#ae2e24]/10",
      label: "Quá hạn",
    };
  } else if (diffHours <= 24) {
    // Due soon -> VÀNG (YELLOW)
    return {
      status: "dueSoon",
      badgeBg: "bg-amber-400 hover:bg-amber-500",
      badgeText: "text-slate-900 font-semibold",
      badgeBorder: "border-amber-500",
      checkboxBg: "border-slate-800/80 hover:bg-black/10",
      label: "Sắp hết hạn",
    };
  } else {
    // Upcoming -> XÁM NHẸ (LIGHT GRAY)
    return {
      status: "upcoming",
      badgeBg: "bg-slate-100 hover:bg-slate-200",
      badgeText: "text-slate-600",
      badgeBorder: "border-slate-200",
      checkboxBg: "border-slate-400 hover:border-slate-600",
      label: "Chưa tới hạn",
    };
  }
}

// --- CARD PRESENTATIONAL VIEW ---
function CardView({
  card,
  listTitle,
  onClick,
  onToggleDueDate,
  onQuickEdit,
  isOverlay = false,
}: {
  card: CardItem;
  listTitle?: string;
  onClick?: () => void;
  onToggleDueDate?: (cardId: string, e: React.MouseEvent) => void;
  onQuickEdit?: (card: CardItem, listTitle: string, e: React.MouseEvent) => void;
  isOverlay?: boolean;
}) {
  const dueInfo = card.dueDate ? getDueDateStatus(card.dueDate, card.isDueComplete) : null;
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-xs hover:shadow-md border border-slate-200 hover:border-slate-300 transition-all text-slate-800 overflow-hidden ${
        isOverlay ? "cursor-grabbing shadow-xl" : "cursor-grab active:cursor-grabbing group"
      }`}
    >
      {/* 1. Cover Image or Cover Color Banner */}
      {card.coverUrl ? (
        <div className="w-full h-32 bg-slate-100 overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.coverUrl}
            alt="cover"
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>
      ) : card.coverColor ? (
        <div className={`w-full h-8 ${card.coverColor}`} />
      ) : null}

      <div className="p-3 relative group/card">
        {/* Quick Edit Pencil Button (Chuẩn Trello: hover hiện nút bút chì ở góc trên phải) */}
        {!isOverlay && onQuickEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickEdit(card, listTitle || "", e);
            }}
            title="Chỉnh sửa nhanh (Phím tắt: e)"
            className="absolute top-2 right-2 w-7 h-7 bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-md shadow-xs opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 pr-6">
            {card.labels.map((lb) => (
              <span
                key={lb.id}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${lb.color}`}
              >
                {lb.name}
              </span>
            ))}
          </div>
        )}

        {/* Card Title */}
        <h4 className="text-sm font-medium text-slate-800 leading-snug break-words pr-5">
          {card.title}
        </h4>

        {/* Badges / Metrics */}
        <div className="mt-3 flex items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center gap-2.5">
            {card.dueDate && dueInfo && (
              <span
                title={`Hạn chót: ${card.dueDate} (${dueInfo.label})`}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium transition-all select-none ${dueInfo.badgeBg} ${dueInfo.badgeText}`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="leading-tight">{card.dueDate}</span>
              </span>
            )}

            {/* Attachment Badge (Trello Paperclip) */}
            {card.attachments && card.attachments.length > 0 && (
              <span className="flex items-center gap-1 text-slate-600 font-medium" title={`${card.attachments.length} tệp đính kèm`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {card.attachments.length}
              </span>
            )}

            {card.checklistTotal !== undefined && (
              <span
                className={`flex items-center gap-1 font-medium ${
                  card.checklistDone === card.checklistTotal
                    ? "text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"
                    : ""
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {card.checklistDone}/{card.checklistTotal}
              </span>
            )}

            {card.commentsCount && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {card.commentsCount}
              </span>
            )}
          </div>

          {/* Member Avatars */}
          {card.members && (
            <div className="flex items-center -space-x-1">
              {card.members.map((m, idx) => (
                <span
                  key={idx}
                  className="w-5 h-5 rounded-full bg-[#0c66e4] text-white text-[10px] font-bold flex items-center justify-center border border-white"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SORTABLE CARD COMPONENT ---
function SortableCard({
  card,
  listTitle,
  onSelect,
  onToggleDueDate,
  onQuickEdit,
  activeCardHeight,
}: {
  card: CardItem;
  listTitle: string;
  onSelect: (card: CardItem, listTitle: string) => void;
  onToggleDueDate?: (cardId: string, e: React.MouseEvent) => void;
  onQuickEdit?: (card: CardItem, listTitle: string, rect: DOMRect) => void;
  activeCardHeight?: number;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
      height: cardHeight,
    },
  });

  useEffect(() => {
    if (!isDragging && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        setCardHeight(rect.height);
      }
    }
  }, [card, isDragging]);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    const effectiveHeight = activeCardHeight || cardHeight;
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          height: effectiveHeight ? `${effectiveHeight}px` : undefined,
        }}
        className="w-full bg-slate-300/60 dark:bg-slate-400/50 rounded-lg border-2 border-dashed border-slate-500 shadow-inner transition-all min-h-[60px]"
      />
    );
  }

  const handleTriggerQuickEdit = (e?: React.MouseEvent) => {
    if (cardRef.current && onQuickEdit) {
      const rect = cardRef.current.getBoundingClientRect();
      onQuickEdit(card, listTitle, rect);
    }
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "e" || e.key === "E") {
          // If not typing in input/textarea, trigger Quick Edit
          const activeTag = document.activeElement?.tagName.toLowerCase();
          if (activeTag !== "input" && activeTag !== "textarea") {
            e.preventDefault();
            handleTriggerQuickEdit();
          }
        }
      }}
      className="touch-none outline-none focus:ring-1 focus:ring-[#0c66e4] rounded-lg"
    >
      <CardView
        card={card}
        listTitle={listTitle}
        onClick={() => onSelect(card, listTitle)}
        onToggleDueDate={onToggleDueDate}
        onQuickEdit={(c, lt, e) => {
          handleTriggerQuickEdit(e);
        }}
      />
    </div>
  );
}

// --- SORTABLE LIST COLUMN COMPONENT ---
function SortableColumn({
  list,
  onSelectCard,
  onToggleDueDate,
  onQuickEdit,
  addingCardListId,
  setAddingCardListId,
  newCardTitle,
  setNewCardTitle,
  onAddCard,
  activeCardHeight,
  onArchiveList,
  onSortList,
}: {
  list: ListItem;
  onSelectCard: (card: CardItem, listTitle: string) => void;
  onToggleDueDate?: (cardId: string, e: React.MouseEvent) => void;
  onQuickEdit?: (card: CardItem, listTitle: string, rect: DOMRect) => void;
  addingCardListId: string | null;
  setAddingCardListId: (id: string | null) => void;
  newCardTitle: string;
  setNewCardTitle: (t: string) => void;
  onAddCard: (listId: string) => void;
  activeCardHeight?: number;
  onArchiveList?: (listId: string) => void;
  onSortList?: (listId: string, sortType: "title" | "date") => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: "Column",
      list,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const cardIds = useMemo(() => list.cards.map((c) => c.id), [list.cards]);

  const columnRef = useRef<HTMLDivElement | null>(null);
  const [columnHeight, setColumnHeight] = useState<number | undefined>(undefined);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  useEffect(() => {
    if (!isDragging && columnRef.current) {
      const rect = columnRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        setColumnHeight(rect.height);
      }
    }
  }, [list.cards, isDragging]);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          height: columnHeight ? `${columnHeight}px` : undefined,
        }}
        className="w-72 shrink-0 bg-black/25 border-2 border-dashed border-white/60 rounded-xl shadow-inner transition-all min-h-[120px]"
      />
    );
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        columnRef.current = node;
      }}
      style={style}
      className="w-72 shrink-0 bg-[#f1f2f4] rounded-xl flex flex-col max-h-full shadow-md border border-slate-200/80"
    >
      {/* Column Drag Handle & Header */}
      <div
        {...attributes}
        {...listeners}
        className="p-3 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing border-b border-transparent touch-none select-none"
      >
        <h3 className="font-semibold text-sm text-slate-800 px-1 truncate pointer-events-none">
          {list.title}
        </h3>
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-slate-500"
        >
          <span className="text-xs bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded-full">
            {list.cards.length}
          </span>
          <div className="relative">
            <button
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="hover:bg-slate-200 p-1 rounded-md transition-colors cursor-pointer"
              title="Thao tác với danh sách"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {isColumnMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-30 text-slate-800 animate-in fade-in duration-100"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                  <span className="text-xs font-bold text-slate-700">Thao tác danh sách</span>
                  <button
                    onClick={() => setIsColumnMenuOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setAddingCardListId(list.id);
                      setNewCardTitle("");
                      setIsColumnMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-md font-medium text-slate-700 cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm thẻ mới
                  </button>

                  <button
                    onClick={() => {
                      if (onSortList) onSortList(list.id, "title");
                      setIsColumnMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-md font-medium text-slate-700 cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Sắp xếp theo tên thẻ (A - Z)
                  </button>

                  <button
                    onClick={() => {
                      if (onSortList) onSortList(list.id, "date");
                      setIsColumnMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-md font-medium text-slate-700 cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Sắp xếp theo ngày hạn chót
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <button
                      onClick={() => {
                        if (onArchiveList) onArchiveList(list.id);
                        setIsColumnMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded-md font-medium cursor-pointer flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Lưu trữ danh sách này (Archive)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards Sortable Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-1 column-cards-scroll min-h-[40px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {list.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              listTitle={list.title}
              onSelect={onSelectCard}
              onToggleDueDate={onToggleDueDate}
              onQuickEdit={onQuickEdit}
              activeCardHeight={activeCardHeight}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Card Footer */}
      <div className="p-2 pt-1">
        {addingCardListId === list.id ? (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-100">
            <TextField
              autoFocus
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="Nhập tiêu đề cho thẻ này..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onAddCard(list.id);
                }
              }}
              sx={{
                backgroundColor: "#ffffff",
                borderRadius: "4px",
                boxShadow: "0 1px 1px rgba(9, 30, 66, 0.25)",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  padding: "8px 10px",
                  "& fieldset": {
                    borderColor: "#dcdfe4",
                    borderWidth: "1px",
                  },
                  "&:hover fieldset": {
                    borderColor: "#85b8ff",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#0c66e4",
                    borderWidth: "2px",
                  },
                },
              }}
            />
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={() => onAddCard(list.id)}
                className="px-3 py-1.5 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Thêm thẻ
              </button>
              <button
                onClick={() => {
                  setAddingCardListId(null);
                  setNewCardTitle("");
                }}
                className="p-1 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setAddingCardListId(list.id);
              setNewCardTitle("");
            }}
            className="w-full py-1.5 px-2 hover:bg-slate-200/80 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Thêm thẻ
          </button>
        )}
      </div>
    </div>
  );
}

// --- MAIN BOARD CONTENT ---
function BoardContent() {
  const params = useParams();
  const boardId = (params?.id as string) || "1";

  const [board, setBoard] = useState<BoardData>({
    id: boardId,
    title: "Đang tải dữ liệu bảng...",
    workspace: "Không gian làm việc",
    bgGradient: "from-blue-600 via-indigo-600 to-sky-700",
    isStarred: false,
    lists: [],
  });

  // 1. Fetch dữ liệu bảng từ Backend API
  useEffect(() => {
    let isMounted = true;
    async function loadBoardFromApi() {
      try {
        const data = await getBoardDetail(boardId);
        if (!isMounted || !data) return;

        // Map backend BoardDetailRes -> BoardData
        const mappedLists: ListItem[] = (data.lists || []).map((l: any) => ({
          id: String(l.id),
          title: l.title,
          isArchived: l.isArchived || false,
          cards: (l.cards || []).map((c: any) => {
            const labels: LabelItem[] = (c.labels || []).map((lb: any) => ({
              id: String(lb.id || "lbl_" + Math.random()),
              name: lb.name || "",
              color: lb.color || "bg-blue-600 text-white",
            }));

            const checklistItems: ChecklistItem[] = [];
            if (c.checklists && Array.isArray(c.checklists)) {
              c.checklists.forEach((chk: any) => {
                if (chk.items && Array.isArray(chk.items)) {
                  chk.items.forEach((item: any) => {
                    checklistItems.push({
                      id: String(item.id),
                      text: item.content || item.title || item.text || "",
                      done: !!item.isCompleted,
                    });
                  });
                }
              });
            }

            const comments: CommentItem[] = (c.comments || []).map((cm: any) => ({
              id: String(cm.id),
              author: (cm.authorName || cm.userName || "U").charAt(0).toUpperCase(),
              authorName: cm.authorName || cm.userName || "Người dùng",
              avatarBg: "bg-blue-600",
              text: cm.content || "",
              createdAt: cm.createdAt || "Vừa xong",
              timestamp: Date.now(),
            }));

            const attachments: AttachmentItem[] = (c.attachments || []).map((at: any) => ({
              id: String(at.id),
              name: at.fileName || at.name || "Tệp đính kèm",
              url: at.fileUrl || at.url || "",
              size: at.fileSize || "1.0 MB",
              createdAt: at.createdAt || "Vừa xong",
              isCover: !!at.isCover,
            }));

            const checklistTotal = c.checklistTotal !== undefined && c.checklistTotal !== null ? c.checklistTotal : checklistItems.length;
            const checklistDone = c.checklistDone !== undefined && c.checklistDone !== null ? c.checklistDone : checklistItems.filter((it) => it.done).length;

            return {
              id: String(c.id),
              title: c.title,
              description: c.description || "",
              labels,
              checklistTotal,
              checklistDone,
              checklistItems,
              commentsCount: c.commentsCount !== undefined && c.commentsCount !== null ? c.commentsCount : comments.length,
              comments,
              activities: [],
              dueDate: c.dueDate || undefined,
              isDueComplete: !!c.isDueComplete,
              members: (c.members || []).map((m: any) => typeof m === "string" ? m : m.initials || (m.name ? m.name.charAt(0) : "M")),
              coverUrl: c.coverUrl || undefined,
              coverColor: c.coverColor || undefined,
              attachments,
              isArchived: !!c.isArchived,
            } as CardItem;
          }),
        }));

        setBoard({
          id: String(data.id),
          title: data.title,
          workspace: (data.workspace as any) || (data as any).workspaceName || "Không gian làm việc chính",
          bgGradient: data.bgGradient || "from-blue-600 via-indigo-600 to-sky-700",
          bgImage: (data.bgImage as any) || (data as any).coverUrl || undefined,
          isStarred: !!data.starred,
          lists: mappedLists,
        });

        if (data.labels && Array.isArray(data.labels) && data.labels.length > 0) {
          setSystemLabels(data.labels.map((lb: any) => ({
            id: String(lb.id),
            name: lb.name || "",
            color: lb.color || "bg-[#0c66e4] text-white",
          })));
        }

        if (data.members && Array.isArray(data.members)) {
          setBoardMembersList(
            data.members.map((m: any) => ({
              id: String(m.id),
              name: m.fullName || m.name || m.username || "Thành viên",
              email: m.email || "",
              initials: (m.fullName || m.name || m.username || "U").charAt(0).toUpperCase(),
              avatarBg: "bg-indigo-600",
              role: (m.role as any) || "MEMBER",
              status: m.status || "ACTIVE",
            }))
          );
        }
      } catch (err) {
        console.warn("Chưa thể kết nối tới Backend API hoặc bảng không tồn tại:", err);
      }
    }

    loadBoardFromApi();
    return () => { isMounted = false; };
  }, [boardId]);

  useEffect(() => {

    // Lắng nghe phím ESC để đóng Modal chi tiết thẻ và Bộ lọc thẻ
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCard(null);
        setIsFilterOpen(false);
        setAddingCardListId(null);
        setIsAddingList(false);
      }
    };

    // Lắng nghe click ra ngoài để tự động đóng Bộ lọc thẻ
    const handleDocumentClick = (e: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [boardId]);

  // States
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const [activeColumn, setActiveColumn] = useState<ListItem | null>(null);
  const [activeCard, setActiveCard] = useState<CardItem | null>(null);
  const [activeCardHeight, setActiveCardHeight] = useState<number | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedCard, setSelectedCard] = useState<{
    card: CardItem;
    listTitle: string;
  } | null>(null);

  // States cho tính năng trong Card Modal
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [cardDescriptionDraft, setCardDescriptionDraft] = useState("");
  const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [insertDropdownOpen, setInsertDropdownOpen] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [cardModalMenu, setCardModalMenu] = useState<"members" | "labels" | "checklist" | "dueDate" | "attachment" | "cover" | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const [customDueDate, setCustomDueDate] = useState("");
  const [activityTab, setActivityTab] = useState<"all" | "comments" | "history">("all");
  // Quick Edit Card State
  const [quickEditCard, setQuickEditCard] = useState<{
    card: CardItem;
    listTitle: string;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const [quickEditTitle, setQuickEditTitle] = useState("");
  // Trello Date Picker States (Calendar & Controls)
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(10); // 0-indexed (10 = November)
  const [selectedDay, setSelectedDay] = useState<number>(7);
  const [enableStartDate, setEnableStartDate] = useState(false);
  const [startDateStr, setStartDateStr] = useState("");
  const [enableDueDate, setEnableDueDate] = useState(true);
  const [dueDateInputStr, setDueDateInputStr] = useState("7/11/2026");
  const [dueTimeStr, setDueTimeStr] = useState("14:23");
  const [repeatOption, setRepeatOption] = useState("Không bao giờ");
  const [reminderOption, setReminderOption] = useState("1 Ngày trước");
  const [customChecklistTitle, setCustomChecklistTitle] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [labelSearchQuery, setLabelSearchQuery] = useState("");
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [isCreatingNewLabel, setIsCreatingNewLabel] = useState(false);
  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("bg-blue-600 text-white");
  const [attachmentLinkUrl, setAttachmentLinkUrl] = useState("");
  const [attachmentLinkName, setAttachmentLinkName] = useState("");

  // Danh sách các bảng màu chuẩn Trello cho nhãn (tổng cộng 8 nhãn)
  const [systemLabels, setSystemLabels] = useState<LabelItem[]>([
    { id: "lbl_1", name: "", color: "bg-[#5e4db2] text-white" },       // Tím thẫm
    { id: "lbl_2", name: "Backend", color: "bg-[#0c66e4] text-white" }, // Xanh dương
    { id: "lbl_3", name: "Frontend", color: "bg-[#1f845a] text-white" },// Xanh lá
    { id: "lbl_4", name: "UI/UX", color: "bg-[#e56910] text-white" },   // Cam
    { id: "lbl_5", name: "Database", color: "bg-[#8270db] text-white" },// Tím nhạt
    { id: "lbl_6", name: "DevOps", color: "bg-[#44546f] text-white" },  // Xám xanh
    { id: "lbl_7", name: "QA", color: "bg-[#c9372c] text-white" },      // Đỏ gạch
    { id: "lbl_8", name: "High", color: "bg-[#ae2e24] text-white" },    // Đỏ đậm
  ]);

  // Đồng bộ draft và fetch chi tiết khi mở selectedCard
  useEffect(() => {
    if (selectedCard) {
      const cardId = selectedCard.card.id;
      setCardDescriptionDraft(selectedCard.card.description || "");
      setIsEditingDescription(false);
      setIsAddingChecklistItem(false);
      setNewChecklistText("");
      setNewCommentText("");
      setCardModalMenu(null);
      setMenuAnchorRect(null);
      setMemberSearchQuery("");
      setCustomDueDate(selectedCard.card.dueDate || "");
      // Đồng bộ ngày tháng cho Date Picker
      const today = new Date();
      setCalendarYear(2026);
      setCalendarMonth(10); // Tháng 11 năm 2026
      if (selectedCard.card.dueDate) {
        setEnableDueDate(true);
        // Cố gắng parse số ngày từ chuỗi dạng "06 Th11", "10 Th11"
        const match = selectedCard.card.dueDate.match(/(\d+)/);
        if (match) {
          const d = parseInt(match[1], 10);
          setSelectedDay(d);
          setDueDateInputStr(`${d}/11/2026`);
        }
      } else {
        setSelectedDay(7);
        setDueDateInputStr("7/11/2026");
      }

      // Tải chi tiết thẻ từ backend (Checklists, ChecklistItems, Comments, Attachments, Activities)
      getCardDetail(cardId)
        .then((detail) => {
          if (!detail) return;

          const checklistItems: ChecklistItem[] = [];
          let primaryChecklistId: string | undefined = undefined;

          if (detail.checklists && Array.isArray(detail.checklists)) {
            if (detail.checklists.length > 0) {
              primaryChecklistId = String(detail.checklists[0].id);
            }
            detail.checklists.forEach((chk) => {
              if (chk.items && Array.isArray(chk.items)) {
                chk.items.forEach((item) => {
                  checklistItems.push({
                    id: String(item.id),
                    text: item.text || "",
                    done: !!item.done,
                  });
                });
              }
            });
          }

          const comments: CommentItem[] = (detail.comments || []).map((cm) => ({
            id: String(cm.id),
            author: (cm.author || cm.initials || "U").charAt(0).toUpperCase(),
            authorName: cm.author || "Người dùng",
            avatarBg: cm.avatarBg || "bg-blue-600",
            text: cm.text || "",
            createdAt: cm.createdAt || "Vừa xong",
            timestamp: Date.now(),
          }));

          const attachments: AttachmentItem[] = (detail.attachments || []).map((at) => ({
            id: String(at.id),
            name: at.name || "Tệp đính kèm",
            url: at.url || "",
            size: at.size || "1.0 MB",
            createdAt: at.createdAt || "Vừa xong",
            isCover: !!at.isCover,
          }));

          const activities: ActivityItem[] = (detail.activities || []).map((act) => ({
            id: String(act.id),
            author: (act.author || "U").charAt(0).toUpperCase(),
            authorName: act.author || "Người dùng",
            avatarBg: "bg-blue-600",
            actionText: act.actionText || "",
            targetText: act.targetText || undefined,
            createdAt: act.createdAt || "Vừa xong",
            timestamp: Date.now(),
          }));

          const updatedFields: Partial<CardItem> = {
            description: detail.description !== undefined ? (detail.description || "") : undefined,
            checklistId: primaryChecklistId,
            checklistItems,
            checklistTotal: checklistItems.length,
            checklistDone: checklistItems.filter((i) => i.done).length,
            comments,
            commentsCount: comments.length,
            attachments,
            activities,
          };

          if (detail.description !== undefined && detail.description !== null) {
            setCardDescriptionDraft(detail.description);
          }

          setSelectedCard((prev) => {
            if (prev && prev.card.id === cardId) {
              return {
                ...prev,
                card: {
                  ...prev.card,
                  ...updatedFields,
                },
              };
            }
            return prev;
          });

          setBoard((prevBoard) => ({
            ...prevBoard,
            lists: prevBoard.lists.map((l) => ({
              ...l,
              cards: l.cards.map((c) =>
                c.id === cardId ? { ...c, ...updatedFields } : c
              ),
            })),
          }));
        })
        .catch((err) => {
          console.warn("Lỗi tải chi tiết thẻ từ Backend API:", err);
        });
    }
  }, [selectedCard?.card.id]);

      // Handler mở Quick Edit
  const handleOpenQuickEdit = (card: CardItem, listTitle: string, rect: DOMRect) => {
    setQuickEditCard({
      card,
      listTitle,
      rect: {
        top: Math.max(10, rect.top),
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    });
    setQuickEditTitle(card.title);
  };

  // Handler lưu tiêu đề nhanh trong Quick Edit
  const handleSaveQuickEditTitle = () => {
    if (!quickEditCard) return;
    const trimmed = quickEditTitle.trim();
    if (trimmed && trimmed !== quickEditCard.card.title) {
      const cardId = quickEditCard.card.id;
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) => (c.id === cardId ? { ...c, title: trimmed } : c)),
        })),
      }));
      logCardActivity(cardId, "đã đổi tên thẻ thành", trimmed);
    }
    setQuickEditCard(null);
  };

  // Handler lưu trữ nhanh thẻ từ Quick Edit
  const handleQuickArchiveCard = () => {
    if (!quickEditCard) return;
    handleArchiveCard(quickEditCard.card.id);
    setQuickEditCard(null);
  };

  // Handler mở modal to đầy đủ từ Quick Edit
  const handleQuickOpenFullCard = () => {
    if (!quickEditCard) return;
    setSelectedCard({ card: quickEditCard.card, listTitle: quickEditCard.listTitle });
    setQuickEditCard(null);
  };

  // Hàm ghi lại hoạt động tự động vào thẻ (Activity Log)
  const logCardActivity = (cardId: string, actionText: string, targetText?: string) => {
    const newAct: ActivityItem = {
      id: "act_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      author: "B",
      authorName: "Nguyễn Văn Bình",
      avatarBg: "bg-blue-600",
      actionText,
      targetText,
      createdAt: "Vừa xong",
      timestamp: Date.now(),
    };

    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) =>
          c.id === cardId
            ? { ...c, activities: [newAct, ...(c.activities || [])] }
            : c
        ),
      })),
    }));

    setSelectedCard((prev) => {
      if (prev && prev.card.id === cardId) {
        return {
          ...prev,
          card: {
            ...prev.card,
            activities: [newAct, ...(prev.card.activities || [])],
          },
        };
      }
      return prev;
    });
  };

  // Hàm cập nhật thẻ hiện tại vào board state và selectedCard state
  const updateCurrentCard = (updater: (prevCard: CardItem) => CardItem) => {
    if (!selectedCard) return;
    const updatedCard = updater(selectedCard.card);
    setSelectedCard((prev) => (prev ? { ...prev, card: updatedCard } : null));
    setBoard((prevBoard) => ({
      ...prevBoard,
      lists: prevBoard.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
      })),
    }));
  };

  // Hàm chèn định dạng Rich Text kiểu Trello / CKEditor
  const handleInsertFormat = (prefix: string, suffix: string = "", placeholder: string = "văn bản") => {
    const textarea = descriptionTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = cardDescriptionDraft;
    const selectedText = currentVal.substring(start, end) || placeholder;
    const replacement = prefix + selectedText + suffix;
    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setCardDescriptionDraft(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  // 1. Lưu mô tả
  const handleSaveDescription = () => {
    const desc = cardDescriptionDraft.trim();
    if (selectedCard) {
      logCardActivity(selectedCard.card.id, "đã cập nhật mô tả thẻ");
      updateCard(selectedCard.card.id, { description: desc }).catch((err) =>
        console.warn("Lỗi cập nhật mô tả trên backend:", err)
      );
    }
    updateCurrentCard((c) => ({
      ...c,
      description: desc,
    }));
    setIsEditingDescription(false);
  };

  // 2. Thêm checklist item
  const handleAddChecklistItem = async () => {
    if (!newChecklistText.trim() || !selectedCard) return;
    const text = newChecklistText.trim();
    const tempItemId = "ci_" + Date.now();
    const newItem: ChecklistItem = {
      id: tempItemId,
      text,
      done: false,
    };
    updateCurrentCard((c) => {
      const items = [...(c.checklistItems || []), newItem];
      return {
        ...c,
        checklistItems: items,
        checklistTotal: items.length,
        checklistDone: items.filter((i) => i.done).length,
      };
    });
    logCardActivity(selectedCard.card.id, "đã thêm việc cần làm", text);
    setNewChecklistText("");
    setIsAddingChecklistItem(false);

    try {
      let targetChecklistId = selectedCard.card.checklistId;

      if (!targetChecklistId) {
        // Tạo checklist mới nếu chưa có
        const createdChecklist = await createChecklist(selectedCard.card.id, "Việc cần làm");
        if (createdChecklist && createdChecklist.id) {
          targetChecklistId = String(createdChecklist.id);
          updateCurrentCard((c) => ({
            ...c,
            checklistId: targetChecklistId,
          }));
        }
      }

      if (targetChecklistId) {
        const addedItem = await addChecklistItem(targetChecklistId, text);
        if (addedItem && addedItem.id) {
          updateCurrentCard((c) => ({
            ...c,
            checklistItems: (c.checklistItems || []).map((it) =>
              it.id === tempItemId ? { ...it, id: String(addedItem.id) } : it
            ),
          }));
        }
      }
    } catch (err) {
      console.warn("Lỗi đồng bộ checklist với backend:", err);
    }
  };

  // 3. Toggle checklist item
  const handleToggleChecklistItem = (itemId: string) => {
    let nextDone = false;
    if (selectedCard) {
      const item = selectedCard.card.checklistItems?.find((i) => i.id === itemId);
      if (item) {
        nextDone = !item.done;
        logCardActivity(selectedCard.card.id, item.done ? "đã đánh dấu chưa xong" : "đã hoàn thành việc cần làm", item.text);
      }
    }
    updateCurrentCard((c) => {
      const items = (c.checklistItems || []).map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      return {
        ...c,
        checklistItems: items,
        checklistTotal: items.length,
        checklistDone: items.filter((i) => i.done).length,
      };
    });

    updateChecklistItem(itemId, { done: nextDone }).catch((err) =>
      console.warn("Lỗi cập nhật checklist item trên backend:", err)
    );
  };

  // 4. Xóa checklist item
  const handleDeleteChecklistItem = (itemId: string) => {
    updateCurrentCard((c) => {
      const items = (c.checklistItems || []).filter((item) => item.id !== itemId);
      return {
        ...c,
        checklistItems: items,
        checklistTotal: items.length,
        checklistDone: items.filter((i) => i.done).length,
      };
    });

    deleteChecklistItem(itemId).catch((err) =>
      console.warn("Lỗi xóa checklist item trên backend:", err)
    );
  };

  // 5. Thêm bình luận
  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedCard) return;
    const commentContent = newCommentText.trim();
    const tempCommentId = "cm_" + Date.now();
    const newComment: CommentItem = {
      id: tempCommentId,
      author: "B",
      authorName: "Nguyễn Văn Bình",
      avatarBg: "bg-blue-600",
      text: commentContent,
      createdAt: "Vừa xong",
      timestamp: Date.now(),
    };
    logCardActivity(selectedCard.card.id, "đã để lại bình luận");
    updateCurrentCard((c) => {
      const comments = [...(c.comments || []), newComment];
      return {
        ...c,
        comments,
        commentsCount: comments.length,
      };
    });
    setNewCommentText("");

    try {
      const created = await addCardComment(selectedCard.card.id, commentContent);
      if (created && created.id) {
        updateCurrentCard((c) => ({
          ...c,
          comments: (c.comments || []).map((cm) =>
            cm.id === tempCommentId ? { ...cm, id: String(created.id) } : cm
          ),
        }));
      }
    } catch (err) {
      console.warn("Lỗi gửi bình luận lên backend:", err);
    }
  };

  // 6. Toggle thành viên trên thẻ
  const handleToggleCardMember = (member: string) => {
    if (selectedCard) {
      const exists = selectedCard.card.members.includes(member);
      logCardActivity(selectedCard.card.id, exists ? "đã gỡ thành viên" : "đã thêm thành viên", member);

      // Tìm user id tương ứng trong boardMembersList nếu có
      const matchedUser = boardMembersList.find((m) => m.initials === member || m.id === member || m.email === member);
      const targetUserId = matchedUser ? matchedUser.id : member;

      if (exists) {
        removeCardMember(selectedCard.card.id, targetUserId).catch((err) =>
          console.warn("Lỗi gỡ thành viên trên backend:", err)
        );
      } else {
        addCardMember(selectedCard.card.id, targetUserId).catch((err) =>
          console.warn("Lỗi thêm thành viên trên backend:", err)
        );
      }
    }
    updateCurrentCard((c) => {
      const exists = c.members.includes(member);
      const members = exists
        ? c.members.filter((m) => m !== member)
        : [...c.members, member];
      return { ...c, members };
    });
  };

  // 7. Toggle nhãn trên thẻ (so khớp theo id hoặc kết hợp name + color)
  const handleToggleCardLabel = (label: LabelItem) => {
    if (selectedCard) {
      const exists = selectedCard.card.labels.some((l) => l.id === label.id);
      logCardActivity(selectedCard.card.id, exists ? "đã gỡ nhãn" : "đã gắn nhãn", label.name || "Nhãn");

      if (exists) {
        removeCardLabel(selectedCard.card.id, label.id).catch((err) =>
          console.warn("Lỗi gỡ nhãn khỏi thẻ trên backend:", err)
        );
      } else {
        addCardLabel(selectedCard.card.id, label.id).catch((err) =>
          console.warn("Lỗi gán nhãn vào thẻ trên backend:", err)
        );
      }
    }
    updateCurrentCard((c) => {
      const exists = c.labels.some(
        (l) => l.id === label.id || (l.name === label.name && l.color === label.color)
      );
      const labels = exists
        ? c.labels.filter(
            (l) => !(l.id === label.id || (l.name === label.name && l.color === label.color))
          )
        : [...c.labels, label];
      return { ...c, labels };
    });
  };

  // 8. Đặt ngày hết hạn
  const handleSetDueDate = (dateStr: string) => {
    const formattedDate = dateStr.trim() ? dateStr : undefined;
    if (selectedCard) {
      if (dateStr.trim()) {
        logCardActivity(selectedCard.card.id, "đã đặt ngày hết hạn", dateStr.trim());
      } else {
        logCardActivity(selectedCard.card.id, "đã xóa ngày hết hạn");
      }
      updateCard(selectedCard.card.id, { dueDate: formattedDate, isDueComplete: false }).catch((err) =>
        console.warn("Lỗi cập nhật dueDate trên backend:", err)
      );
    }
    updateCurrentCard((c) => ({
      ...c,
      dueDate: formattedDate,
      isDueComplete: false,
    }));
    setCardModalMenu(null);
  };

  // 8.1. Toggle hoàn thành ngày hết hạn (Checkbox trên mặt thẻ và trong modal)
  const handleToggleDueDateCard = (cardId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    let targetCard = selectedCard?.card.id === cardId ? selectedCard.card : null;
    if (!targetCard) {
      for (const l of board.lists) {
        const found = l.cards.find((c) => c.id === cardId);
        if (found) {
          targetCard = found;
          break;
        }
      }
    }
    const nextStatus = targetCard ? !targetCard.isDueComplete : true;

    setBoard((prevBoard) => ({
      ...prevBoard,
      lists: prevBoard.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) =>
          c.id === cardId ? { ...c, isDueComplete: !c.isDueComplete } : c
        ),
      })),
    }));

    setSelectedCard((prev) => {
      if (prev && prev.card.id === cardId) {
        return {
          ...prev,
          card: { ...prev.card, isDueComplete: !prev.card.isDueComplete },
        };
      }
      return prev;
    });

    updateCard(cardId, { isDueComplete: nextStatus }).catch((err) =>
      console.warn("Lỗi cập nhật hoàn thành dueDate trên backend:", err)
    );
  };

  // 8.1. Thêm tệp đính kèm
  const handleAddAttachment = (name: string, url: string, size?: string) => {
    const newAtt: AttachmentItem = {
      id: "att_" + Date.now(),
      name,
      url,
      size: size || "1.2 MB",
      createdAt: "Vừa xong",
      isCover: false,
    };
    if (selectedCard) {
      logCardActivity(selectedCard.card.id, "đã đính kèm tệp", name);
    }
    updateCurrentCard((c) => ({
      ...c,
      attachments: [...(c.attachments || []), newAtt],
    }));
  };

  // 8.2. Xóa tệp đính kèm
  const handleDeleteAttachment = (attId: string) => {
    updateCurrentCard((c) => {
      const atts = (c.attachments || []).filter((a) => a.id !== attId);
      const isRemovedCover = c.attachments?.find((a) => a.id === attId)?.isCover;
      return {
        ...c,
        attachments: atts,
        coverUrl: isRemovedCover ? undefined : c.coverUrl,
      };
    });
    deleteAttachment(attId).catch((err) =>
      console.warn("Lỗi xóa file đính kèm trên backend:", err)
    );
  };

  // 8.3. Đặt / Hủy ảnh bìa từ đính kèm
  const handleToggleCoverAttachment = (att: AttachmentItem) => {
    const willBeCover = selectedCard?.card.coverUrl !== att.url;
    updateCurrentCard((c) => {
      const atts = (c.attachments || []).map((a) => ({
        ...a,
        isCover: a.id === att.id ? willBeCover : false,
      }));
      return {
        ...c,
        attachments: atts,
        coverUrl: willBeCover ? att.url : undefined,
        coverColor: willBeCover ? undefined : c.coverColor,
      };
    });
    if (selectedCard) {
      updateCard(selectedCard.card.id, { coverUrl: willBeCover ? att.url : "" }).catch((err) =>
        console.warn("Lỗi cập nhật ảnh bìa trên backend:", err)
      );
    }
  };

  // 8.4. Đặt màu bìa (Cover Color)
  const handleSetCoverColor = (colorClass: string) => {
    if (selectedCard) {
      logCardActivity(selectedCard.card.id, "đã thay đổi màu bìa thẻ");
      const nextColor = selectedCard.card.coverColor === colorClass ? "" : colorClass;
      updateCard(selectedCard.card.id, { coverColor: nextColor, coverUrl: "" }).catch((err) =>
        console.warn("Lỗi cập nhật coverColor trên backend:", err)
      );
    }
    updateCurrentCard((c) => ({
      ...c,
      coverColor: c.coverColor === colorClass ? undefined : colorClass,
      coverUrl: undefined,
    }));
  };

  // 8.5. Đặt ảnh bìa (Cover Image URL)
  const handleSetCoverUrl = (url: string) => {
    const nextUrl = selectedCard?.card.coverUrl === url ? "" : url;
    if (selectedCard) {
      updateCard(selectedCard.card.id, { coverUrl: nextUrl, coverColor: "" }).catch((err) =>
        console.warn("Lỗi cập nhật coverUrl trên backend:", err)
      );
    }
    updateCurrentCard((c) => ({
      ...c,
      coverUrl: c.coverUrl === url ? undefined : url,
      coverColor: undefined,
    }));
  };

  // 8.6. Xóa toàn bộ ảnh/màu bìa
  const handleRemoveCover = () => {
    if (selectedCard) {
      updateCard(selectedCard.card.id, { coverUrl: "", coverColor: "" }).catch((err) =>
        console.warn("Lỗi xóa bìa thẻ trên backend:", err)
      );
    }
    updateCurrentCard((c) => ({
      ...c,
      coverUrl: undefined,
      coverColor: undefined,
    }));
  };

  // 9. Lưu trữ Thẻ (Đánh dấu isArchived = true)
  const handleArchiveCard = (targetCardId?: string) => {
    const cardId = targetCardId || selectedCard?.card.id;
    if (!cardId) return;
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) => (c.id === cardId ? { ...c, isArchived: true } : c)),
      })),
    }));
    if (selectedCard && selectedCard.card.id === cardId) {
      setSelectedCard(null);
    }
    updateCard(cardId, { isArchived: true }).catch((err) =>
      console.warn("Lỗi lưu trữ thẻ trên backend:", err)
    );
  };

  // 9.1. Khôi phục thẻ từ thùng lưu trữ
  const handleRestoreCard = (cardId: string) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) => (c.id === cardId ? { ...c, isArchived: false } : c)),
      })),
    }));
    updateCard(cardId, { isArchived: false }).catch((err) =>
      console.warn("Lỗi khôi phục thẻ trên backend:", err)
    );
  };

  // 9.2. Mở Modal xác nhận xóa vĩnh viễn
  const handleOpenDeleteConfirm = (cardId: string) => {
    setCardToDeleteId(cardId);
  };

  // 9.2.1. Xác nhận xóa thẻ vĩnh viễn khỏi hệ thống
  const handleConfirmDeleteCard = () => {
    if (!cardToDeleteId) return;
    const targetId = cardToDeleteId;
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => ({
        ...l,
        cards: l.cards.filter((c) => c.id !== targetId),
      })),
    }));
    if (selectedCard?.card.id === targetId) {
      setSelectedCard(null);
    }
    setCardToDeleteId(null);

    deleteCard(targetId).catch((err) =>
      console.warn("Lỗi xóa vĩnh viễn thẻ trên backend:", err)
    );
  };

  // 9.3. Lưu trữ Danh sách (Cột)
  const handleArchiveList = (listId: string) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => (l.id === listId ? { ...l, isArchived: true } : l)),
    }));
    updateList(listId, { isArchived: true }).catch((err) =>
      console.warn("Lỗi lưu trữ danh sách trên backend:", err)
    );
  };

  // 9.4. Khôi phục Danh sách (Cột)
  const handleRestoreList = (listId: string) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => (l.id === listId ? { ...l, isArchived: false } : l)),
    }));
    updateList(listId, { isArchived: false }).catch((err) =>
      console.warn("Lỗi khôi phục danh sách trên backend:", err)
    );
  };

  // 9.5. Sắp xếp các thẻ trong Danh sách
  const handleSortList = (listId: string, sortType: "title" | "date") => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => {
        if (l.id !== listId) return l;
        const sortedCards = [...l.cards].sort((a, b) => {
          if (sortType === "title") {
            return a.title.localeCompare(b.title);
          } else {
            return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
          }
        });
        return { ...l, cards: sortedCards };
      }),
    }));
    sortList(listId, sortType === "title" ? "TITLE_ASC" : "DUE_DATE_ASC").catch((err) =>
      console.warn("Lỗi đồng bộ sắp xếp cột trên backend:", err)
    );
  };

  // --- FILTER STATES (Trello Style Filter) ---
  // --- ARCHIVE & DRAWER STATES (Trello Archived Items) ---
  const [isArchivedDrawerOpen, setIsArchivedDrawerOpen] = useState(false);
  const [archivedTab, setArchivedTab] = useState<"cards" | "lists">("cards");
  const [archivedSearchQuery, setArchivedSearchQuery] = useState("");
  // State quản lý Modal xác nhận xóa vĩnh viễn (Custom Web Modal)
  const [cardToDeleteId, setCardToDeleteId] = useState<string | null>(null);

  // --- SHARE & INVITE MEMBER STATES ---
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeMemberDropdownId, setActiveMemberDropdownId] = useState<string | null>(null);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER" | "OBSERVER">("MEMBER");
  const [isCopiedInviteLink, setIsCopiedInviteLink] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Danh sách thành viên trong Board (lấy động từ Backend)
  const [boardMembersList, setBoardMembersList] = useState<BoardMemberItem[]>([]);

  // Handler mời thành viên mới vào Board
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccessMsg(null);

    const emailOrName = inviteInput.trim();
    if (!emailOrName) {
      setInviteError("Vui lòng nhập địa chỉ email hoặc tên người dùng");
      return;
    }

    if (boardMembersList.some((m) => m.email.toLowerCase() === emailOrName.toLowerCase())) {
      setInviteError("Thành viên này đã có trong bảng làm việc rồi!");
      return;
    }

    const namePart = emailOrName.split("@")[0];
    const initials = namePart.charAt(0).toUpperCase();
    const colors = ["bg-amber-600", "bg-rose-600", "bg-indigo-600", "bg-teal-600", "bg-cyan-600"];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];

    const tempId = "u_" + Date.now();
    const newMember: BoardMemberItem = {
      id: tempId,
      name: emailOrName.includes("@") ? namePart : emailOrName,
      email: emailOrName.includes("@") ? emailOrName : namePart.toLowerCase() + "@workspace.io",
      initials,
      avatarBg: randomBg,
      role: inviteRole,
      status: "PENDING",
    };

    setBoardMembersList([...boardMembersList, newMember]);
    setInviteInput("");
    setInviteSuccessMsg("Đã gửi thư mời đến " + newMember.email + ". Đang chờ người dùng mở email xác nhận.");
    setTimeout(() => setInviteSuccessMsg(null), 3000);

    try {
      const invited = await inviteBoardMember(boardId, {
        email: newMember.email,
        role: inviteRole,
      });
      if (invited && invited.id) {
        setBoardMembersList((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: String(invited.id) } : m))
        );
      }
    } catch (err: any) {
      console.warn("Lỗi gửi lời mời thành viên lên backend:", err);
    }
  };

  // Handler đổi quyền thành viên
  const handleChangeMemberRole = (memberId: string, newRole: "ADMIN" | "MEMBER" | "OBSERVER") => {
    setBoardMembersList((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    updateBoardMemberRole(boardId, memberId, { role: newRole }).catch((err) =>
      console.warn("Lỗi đổi quyền thành viên trên backend:", err)
    );
  };

  // Handler xóa thành viên hoặc hủy lời mời
  const handleRemoveMemberFromBoard = (memberId: string) => {
    if (boardMembersList.length <= 1) {
      alert("Bảng phải có ít nhất một Quản trị viên!");
      return;
    }
    setBoardMembersList((prev) => prev.filter((m) => m.id !== memberId));
    removeBoardMember(boardId, memberId).catch((err) =>
      console.warn("Lỗi xóa thành viên trên backend:", err)
    );
  };

  // Handler sao chép liên kết mời
  const handleCopyInviteLink = () => {
    const inviteUrl = typeof window !== "undefined" ? window.location.origin + "/invite/board/" + boardId + "?token=tk_" + Date.now() : "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setIsCopiedInviteLink(true);
      setTimeout(() => setIsCopiedInviteLink(false), 2500);
    }
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement | null>(null);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filterNoMembers, setFilterNoMembers] = useState(false);
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);
  const [filterStatusCompleted, setFilterStatusCompleted] = useState(false);
  const [filterStatusIncomplete, setFilterStatusIncomplete] = useState(false);
  const [filterNoDueDate, setFilterNoDueDate] = useState(false);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterDueTomorrow, setFilterDueTomorrow] = useState(false);
  const [filterDueNextWeek, setFilterDueNextWeek] = useState(false);
  const [filterDueNextMonth, setFilterDueNextMonth] = useState(false);
  const [filterNoLabels, setFilterNoLabels] = useState(false);
  const [filterActivityPastWeek, setFilterActivityPastWeek] = useState(false);
  const [filterActivityTwoWeeks, setFilterActivityTwoWeeks] = useState(false);
  const [filterActivityFourWeeks, setFilterActivityFourWeeks] = useState(false);
  const [filterActivityNoneFourWeeks, setFilterActivityNoneFourWeeks] = useState(false);
  const [filterMatchMode, setFilterMatchMode] = useState<"any" | "all">("any");
  const [membersDropdownExpanded, setMembersDropdownExpanded] = useState(false);
  const [labelsDropdownExpanded, setLabelsDropdownExpanded] = useState(false);

  // Collect all unique labels and members from current board
  const allBoardLabels = useMemo(() => {
    const map = new Map<string, LabelItem>();
    board.lists.forEach((l) => {
      l.cards.forEach((c) => {
        c.labels?.forEach((lb) => {
          if (!map.has(lb.name)) {
            map.set(lb.name, lb);
          }
        });
      });
    });
    return Array.from(map.values());
  }, [board.lists]);

  const allBoardMembers = useMemo(() => {
    const set = new Set<string>();
    board.lists.forEach((l) => {
      l.cards.forEach((c) => {
        c.members?.forEach((m) => set.add(m));
      });
    });
    return Array.from(set);
  }, [board.lists]);

  const activeFiltersCount =
    (filterKeyword ? 1 : 0) +
    selectedLabels.length +
    selectedMembers.length +
    (filterNoMembers ? 1 : 0) +
    (filterAssignedToMe ? 1 : 0) +
    (filterStatusCompleted ? 1 : 0) +
    (filterStatusIncomplete ? 1 : 0) +
    (filterNoDueDate ? 1 : 0) +
    (filterOverdue ? 1 : 0) +
    (filterDueTomorrow ? 1 : 0) +
    (filterDueNextWeek ? 1 : 0) +
    (filterDueNextMonth ? 1 : 0) +
    (filterNoLabels ? 1 : 0) +
    (filterActivityPastWeek ? 1 : 0) +
    (filterActivityTwoWeeks ? 1 : 0) +
    (filterActivityFourWeeks ? 1 : 0) +
    (filterActivityNoneFourWeeks ? 1 : 0);

  const clearAllFilters = () => {
    setFilterKeyword("");
    setSelectedLabels([]);
    setSelectedMembers([]);
    setFilterNoMembers(false);
    setFilterAssignedToMe(false);
    setFilterStatusCompleted(false);
    setFilterStatusIncomplete(false);
    setFilterNoDueDate(false);
    setFilterOverdue(false);
    setFilterDueTomorrow(false);
    setFilterDueNextWeek(false);
    setFilterDueNextMonth(false);
    setFilterNoLabels(false);
    setFilterActivityPastWeek(false);
    setFilterActivityTwoWeeks(false);
    setFilterActivityFourWeeks(false);
    setFilterActivityNoneFourWeeks(false);
  };

  const toggleFilterLabel = (name: string) => {
    setSelectedLabels((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const toggleFilterMember = (m: string) => {
    setSelectedMembers((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  // Filtered Lists & Cards (Chỉ lấy các cột và thẻ chưa lưu trữ isArchived !== true)
  const displayLists = useMemo(() => {
    const activeLists = board.lists
      .filter((l) => !l.isArchived)
      .map((l) => ({
        ...l,
        cards: l.cards.filter((c) => !c.isArchived),
      }));

    if (activeFiltersCount === 0) {
      return activeLists;
    }

    return activeLists.map((l) => ({
      ...l,
      cards: l.cards.filter((c) => {
        // Keyword match
        if (
          filterKeyword &&
          !c.title.toLowerCase().includes(filterKeyword.toLowerCase()) &&
          !(c.description || "").toLowerCase().includes(filterKeyword.toLowerCase())
        ) {
          return false;
        }

        // Members criteria
        if (filterNoMembers && c.members && c.members.length > 0) {
          return false;
        }
        if (filterAssignedToMe && (!c.members || !c.members.includes("B"))) {
          return false;
        }
        if (selectedMembers.length > 0) {
          const hasMember = c.members?.some((m) => selectedMembers.includes(m));
          if (!hasMember) return false;
        }

        // Card status criteria
        const isCardCompleted = c.checklistTotal !== undefined && c.checklistTotal > 0 && c.checklistDone === c.checklistTotal;
        if (filterStatusCompleted && !isCardCompleted) {
          return false;
        }
        if (filterStatusIncomplete && isCardCompleted) {
          return false;
        }

        // Due date criteria
        if (filterNoDueDate && c.dueDate) {
          return false;
        }
        if (filterOverdue && (!c.dueDate || !c.dueDate.includes("06 Th11"))) {
          // 06 Th11 is considered due today/overdue
        }
        if (filterDueTomorrow && (!c.dueDate || !c.dueDate.includes("07 Th11"))) {
          // Card due tomorrow
        }

        // Labels criteria
        if (filterNoLabels && c.labels && c.labels.length > 0) {
          return false;
        }
        if (selectedLabels.length > 0) {
          const hasLabel = c.labels?.some((lb) =>
            selectedLabels.includes(lb.id) || selectedLabels.includes(lb.name) || selectedLabels.includes(lb.color)
          );
          if (!hasLabel) return false;
        }

        return true;
      }),
    }));
  }, [
    board.lists,
    activeFiltersCount,
    filterKeyword,
    selectedLabels,
    selectedMembers,
    filterNoMembers,
    filterAssignedToMe,
    filterStatusCompleted,
    filterStatusIncomplete,
    filterNoDueDate,
    filterOverdue,
    filterDueTomorrow,
    filterNoLabels,
  ]);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columnIds = useMemo(() => displayLists.map((l) => l.id), [displayLists]);

  const customCollisionDetection: CollisionDetection = (args) => {
    if (activeColumn) {
      return closestCorners({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => c.data.current?.type === "Column"
        ),
      });
    }

    // Khi đang kéo Card:
    // 1. Tìm pointerWithin
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const cardCollision = pointerCollisions.find((c) => c.data?.current?.type === "Card");
      if (cardCollision) {
        return [cardCollision];
      }
      const colCollision = pointerCollisions.find((c) => c.data?.current?.type === "Column");
      if (colCollision) {
        return [colCollision];
      }
      return pointerCollisions;
    }

    // 2. rectIntersection
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      const cardCollision = rectCollisions.find((c) => c.data?.current?.type === "Card");
      if (cardCollision) {
        return [cardCollision];
      }
      const colCollision = rectCollisions.find((c) => c.data?.current?.type === "Column");
      if (colCollision) {
        return [colCollision];
      }
      return rectCollisions;
    }

    // 3. Fallback closestCorners chỉ tìm các droppable Card hoặc Column
    return closestCorners(args);
  };

  // Handlers
  const handleAddCard = async (listId: string) => {
    if (!newCardTitle.trim()) return;
    const title = newCardTitle.trim();
    const tempId = "c_" + Date.now();

    const newCard: CardItem = {
      id: tempId,
      title,
      labels: [{ id: "l_def", name: "Task", color: "bg-blue-500 text-white" }],
      members: ["B"],
    };

    // Optimistic UI update
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) =>
        l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l
      ),
    }));
    setNewCardTitle("");
    setAddingCardListId(null);

    // Call API Backend
    try {
      const created = await createCard(listId, { title });
      if (created && created.id) {
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((l) => ({
            ...l,
            cards: l.cards.map((c) => (c.id === tempId ? { ...c, id: String(created.id) } : c)),
          })),
        }));
      }
    } catch (err) {
      console.warn("Lỗi đồng bộ tạo thẻ với Backend API:", err);
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const title = newListTitle.trim();
    const tempId = "l_" + Date.now();

    const newList: ListItem = {
      id: tempId,
      title,
      cards: [],
    };

    // Optimistic UI update
    setBoard((prev) => ({
      ...prev,
      lists: [...prev.lists, newList],
    }));
    setNewListTitle("");
    setIsAddingList(false);

    // Call API Backend
    try {
      const created = await createList(boardId, { title });
      if (created && created.id) {
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((l) => (l.id === tempId ? { ...l, id: String(created.id) } : l)),
        }));
      }
    } catch (err) {
      console.warn("Lỗi đồng bộ tạo danh sách với Backend API:", err);
    }
  };

  // Drag Handlers
  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.list);
      return;
    }

    if (event.active.data.current?.type === "Card") {
      setActiveCard(event.active.data.current.card);
      const measuredHeight =
        event.active.data.current.height ||
        event.active.rect.current.initial?.height ||
        event.active.rect.current.translated?.height;
      if (measuredHeight) {
        setActiveCardHeight(measuredHeight);
      }
      return;
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (isActiveAColumn) {
      const isOverAColumn = over.data.current?.type === "Column";
      if (isOverAColumn) {
        setBoard((prev) => {
          const oldIndex = prev.lists.findIndex((l) => l.id === activeId);
          const newIndex = prev.lists.findIndex((l) => l.id === overId);
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
          return {
            ...prev,
            lists: arrayMove(prev.lists, oldIndex, newIndex),
          };
        });
      }
      return;
    }

    const isActiveACard = active.data.current?.type === "Card";
    const isOverACard = over.data.current?.type === "Card";

    if (!isActiveACard) return;

    if (isActiveACard && isOverACard) {
      setBoard((prev) => {
        const activeListIndex = prev.lists.findIndex((l) =>
          l.cards.some((c) => String(c.id) === String(activeId))
        );
        const overListIndex = prev.lists.findIndex((l) =>
          l.cards.some((c) => String(c.id) === String(overId))
        );

        if (activeListIndex === -1 || overListIndex === -1) return prev;

        const activeList = prev.lists[activeListIndex];
        const overList = prev.lists[overListIndex];

        const activeCardIndex = activeList.cards.findIndex((c) => String(c.id) === String(activeId));
        const overCardIndex = overList.cards.findIndex((c) => String(c.id) === String(overId));

        if (activeListIndex === overListIndex) {
          const reorderedCards = arrayMove(activeList.cards, activeCardIndex, overCardIndex);
          const newLists = [...prev.lists];
          newLists[activeListIndex] = { ...activeList, cards: reorderedCards };
          return { ...prev, lists: newLists };
        } else {
          const activeCards = [...activeList.cards];
          const [movedCard] = activeCards.splice(activeCardIndex, 1);

          const overCards = [...overList.cards];
          overCards.splice(overCardIndex, 0, movedCard);

          const newLists = [...prev.lists];
          newLists[activeListIndex] = { ...activeList, cards: activeCards };
          newLists[overListIndex] = { ...overList, cards: overCards };

          return { ...prev, lists: newLists };
        }
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";
    if (isActiveACard && isOverAColumn) {
      setBoard((prev) => {
        const activeListIndex = prev.lists.findIndex((l) =>
          l.cards.some((c) => String(c.id) === String(activeId))
        );
        const overListIndex = prev.lists.findIndex((l) => String(l.id) === String(overId));

        if (activeListIndex === -1 || overListIndex === -1) return prev;
        if (activeListIndex === overListIndex) return prev;

        const activeList = prev.lists[activeListIndex];
        const overList = prev.lists[overListIndex];

        const activeCardIndex = activeList.cards.findIndex((c) => String(c.id) === String(activeId));
        const activeCards = [...activeList.cards];
        const [movedCard] = activeCards.splice(activeCardIndex, 1);

        let newIndex = overList.cards.length;
        if (overList.cards.length > 0 && over.rect) {
          const overTop = over.rect.top;
          const overBottom = over.rect.bottom;
          const activeCurrentTop =
            active.rect.current.translated?.top ?? active.rect.current.initial?.top;
          if (activeCurrentTop !== undefined) {
            const midPoint = overTop + (overBottom - overTop) / 2;
            if (activeCurrentTop < midPoint) {
              newIndex = 0;
            }
          }
        }

        const overCards = [...overList.cards];
        overCards.splice(newIndex, 0, movedCard);

        const newLists = [...prev.lists];
        newLists[activeListIndex] = { ...activeList, cards: activeCards };
        newLists[overListIndex] = { ...overList, cards: overCards };

        return { ...prev, lists: newLists };
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveColumn(null);
    setActiveCard(null);
    setActiveCardHeight(undefined);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (isActiveAColumn) {
      setBoard((prev) => {
        const oldIndex = prev.lists.findIndex((l) => String(l.id) === String(activeId));
        const newIndex = prev.lists.findIndex((l) => String(l.id) === String(overId));
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        const reordered = arrayMove(prev.lists, oldIndex, newIndex);
        
        // Gọi API reorder backend
        const listOrders = reordered.map((l, idx) => ({
          listId: Number(l.id) || idx + 1,
          position: idx + 1,
        }));
        reorderLists(boardId, { listOrders }).catch((err) =>
          console.warn("Lỗi cập nhật thứ tự cột trên backend:", err)
        );

        return {
          ...prev,
          lists: reordered,
        };
      });
      return;
    }

    const isActiveACard = active.data.current?.type === "Card";
    if (isActiveACard) {
      setBoard((currentBoard) => {
        for (const l of currentBoard.lists) {
          const cardIdx = l.cards.findIndex((c) => String(c.id) === String(activeId));
          if (cardIdx !== -1) {
            moveCard(String(activeId), {
              targetListId: Number(l.id) || 1,
              targetPosition: cardIdx + 1,
            }).catch((err) =>
              console.warn("Lỗi đồng bộ vị trí thẻ trên backend:", err)
            );
            break;
          }
        }
        return currentBoard;
      });
    }
  };

  return (
    <div
      style={board.bgImage ? { backgroundImage: "url(" + board.bgImage + ")", backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      className={`h-screen max-h-screen ${board.bgImage ? "bg-slate-900" : "bg-gradient-to-br " + (board.bgGradient || "from-blue-600 via-indigo-600 to-sky-700")} flex flex-col font-sans select-none overflow-hidden`}
    >
      {/* 1. TOP NAVBAR */}
      <header className="h-12 bg-black/25 backdrop-blur-md text-white flex items-center justify-between px-4 sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/boards"
            className="flex items-center gap-2 hover:bg-white/20 px-2 py-1 rounded-md transition-colors text-white"
          >
            <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center">
              <div className="flex gap-0.5">
                <span className="w-1 h-3 bg-[#0c66e4] rounded-xs"></span>
                <span className="w-1 h-2 bg-[#0c66e4] rounded-xs"></span>
              </div>
            </div>
            <span className="font-extrabold text-base tracking-tight">
              Trello Work
            </span>
          </Link>

          <span className="text-white/40">|</span>

          <span className="text-xs font-medium text-white/80 hidden sm:inline">
            {board.workspace}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/boards"
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-md text-xs font-semibold transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại bảng
          </Link>
        </div>
      </header>

      {/* 2. SUB-HEADER WITH FILTER BUTTON */}
      <div className="h-14 bg-black/15 backdrop-blur-sm text-white px-4 flex items-center justify-between gap-4 flex-wrap border-b border-white/10 relative z-20">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-bold text-lg text-white px-2 py-1 rounded-md hover:bg-white/15 cursor-pointer">
            {board.title}
          </h1>

          <button
            onClick={() => {
              const nextStarred = !board.isStarred;
              setBoard({ ...board, isStarred: nextStarred });
              updateBoard(board.id, { starred: nextStarred }).catch((err) =>
                console.warn("Lỗi cập nhật trạng thái yêu thích của bảng trên backend:", err)
              );
            }}
            className="p-1.5 hover:bg-white/15 rounded-md text-white/80 hover:text-amber-300 transition-colors cursor-pointer"
            title="Đánh dấu sao"
          >
            <svg
              className={`w-4 h-4 ${board.isStarred ? "text-amber-300 fill-amber-300" : ""}`}
              fill={board.isStarred ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>

          <span className="text-white/30">|</span>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 hover:bg-white/20 rounded-md text-xs font-medium cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Không gian làm việc
          </div>

          <span className="text-white/30">|</span>

          {/* Board Members */}
          <div
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-90 transition-opacity"
            title="Quản lý thành viên trong bảng"
          >
            {boardMembersList.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className={"w-7 h-7 rounded-full " + m.avatarBg + " text-white font-bold text-xs flex items-center justify-center border-2 border-slate-900 shadow-xs"}
                title={m.name + " (" + m.role + ")"}
              >
                {m.initials}
              </div>
            ))}
            {boardMembersList.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900 shadow-xs">
                +{boardMembersList.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Filter + Share */}
        <div className="flex items-center gap-2">
          {/* TRELLO FILTER BUTTON */}
          <div ref={filterContainerRef} className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                activeFiltersCount > 0
                  ? "bg-amber-400 text-slate-900 ring-2 ring-amber-300"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Lọc thẻ</span>
              {activeFiltersCount > 0 && (
                <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* FILTER DROPDOWN POPUP (Chuẩn Trello Filter Menu với đầy đủ tính năng & diện tích nhãn màu) */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-84 sm:w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 select-none flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 relative">
                  <div className="w-full text-center font-bold text-sm text-slate-800">
                    Lọc
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="absolute right-0 top-0 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Filter Scrollable Content */}
                <div className="space-y-4 overflow-y-auto px-1 py-1 no-scrollbar flex-1">
                  {/* 1. Keyword search */}
                  <div className="pt-0.5">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Từ khóa
                    </label>
                    <div className="p-0.5">
                      <input
                        type="text"
                        placeholder="Nhập từ khóa..."
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-slate-800 transition-all placeholder-slate-400 shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 px-0.5 leading-tight">
                      Tìm kiếm các thẻ, các thành viên, các nhãn và hơn thế nữa.
                    </p>
                  </div>

                  {/* 2. Thành viên */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      Thành viên
                    </label>
                    <div className="space-y-1">
                      {/* Không có thành viên */}
                      <div
                        onClick={() => setFilterNoMembers(!filterNoMembers)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterNoMembers}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Không có thành viên
                        </span>
                      </div>

                      {/* Các thẻ đã chỉ định cho tôi */}
                      <div
                        onClick={() => setFilterAssignedToMe(!filterAssignedToMe)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterAssignedToMe}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <div className="w-6 h-6 rounded-full bg-[#00a3bf] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          PB
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Các thẻ đã chỉ định cho tôi
                        </span>
                      </div>

                      {/* Chọn thành viên Accordion */}
                      <div>
                        <div
                          onClick={() => setMembersDropdownExpanded(!membersDropdownExpanded)}
                          className="flex items-center justify-between p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedMembers.length > 0}
                              indeterminate={selectedMembers.length > 0 && selectedMembers.length < 4}
                              size="small"
                              sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                            />
                            <span className="text-xs font-medium text-slate-700">
                              Chọn thành viên
                            </span>
                          </div>
                          <svg
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              membersDropdownExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {membersDropdownExpanded && (
                          <div className="pl-7 pr-1 py-1 space-y-1 animate-in fade-in">
                            {[
                              { id: "B", name: "P.T. Bình", initials: "PB", color: "bg-[#00a3bf]" },
                              { id: "N", name: "Minh Chu Dinh", initials: "MD", color: "bg-[#0c66e4]" },
                              { id: "T", name: "Tuấn Trần", initials: "TT", color: "bg-[#e56910]" },
                              { id: "A", name: "Anh Nguyễn", initials: "AN", color: "bg-[#1f845a]" },
                            ].map((m) => {
                              const checked = selectedMembers.includes(m.id);
                              return (
                                <div
                                  key={m.id}
                                  onClick={() => toggleFilterMember(m.id)}
                                  className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-md cursor-pointer"
                                >
                                  <Checkbox
                                    checked={checked}
                                    size="small"
                                    sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                                  />
                                  <span className={`w-5 h-5 rounded-full ${m.color} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>
                                    {m.initials}
                                  </span>
                                  <span className="text-xs text-slate-700 font-medium">
                                    {m.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Card status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      Card status
                    </label>
                    <div className="space-y-1">
                      <div
                        onClick={() => setFilterStatusCompleted(!filterStatusCompleted)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterStatusCompleted}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          Đã đánh dấu là hoàn tất
                        </span>
                      </div>
                      <div
                        onClick={() => setFilterStatusIncomplete(!filterStatusIncomplete)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterStatusIncomplete}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          Chưa đánh dấu là hoàn tất
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Ngày hết hạn */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      Ngày hết hạn
                    </label>
                    <div className="space-y-1">
                      {/* Không có ngày */}
                      <div
                        onClick={() => setFilterNoDueDate(!filterNoDueDate)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterNoDueDate}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <div className="w-5 h-5 rounded bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Không có ngày
                        </span>
                      </div>

                      {/* Quá hạn */}
                      <div
                        onClick={() => setFilterOverdue(!filterOverdue)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterOverdue}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Quá hạn
                        </span>
                      </div>

                      {/* Đến hạn vào ngày mai */}
                      <div
                        onClick={() => setFilterDueTomorrow(!filterDueTomorrow)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterDueTomorrow}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Đến hạn vào ngày mai
                        </span>
                      </div>

                      {/* Đến hạn vào tuần sau */}
                      <div
                        onClick={() => setFilterDueNextWeek(!filterDueNextWeek)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterDueNextWeek}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Đến hạn vào tuần sau
                        </span>
                      </div>

                      {/* Đến hạn vào tháng sau */}
                      <div
                        onClick={() => setFilterDueNextMonth(!filterDueNextMonth)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterDueNextMonth}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Đến hạn vào tháng sau
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Nhãn (Hiển thị thẻ màu có đầy đủ diện tích, kể cả không có chữ) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      Nhãn
                    </label>
                    <div className="space-y-1.5">
                      {/* Không có Nhãn */}
                      <div
                        onClick={() => setFilterNoLabels(!filterNoLabels)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterNoLabels}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <div className="w-5 h-5 rounded bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Không có Nhãn
                        </span>
                      </div>

                      {/* Danh sách các thanh màu Trello (Có chiều cao và chiều rộng chuẩn, kể cả nhãn không có chữ) */}
                      {systemLabels.map((lbl) => {
                        const checked = selectedLabels.includes(lbl.id) || selectedLabels.includes(lbl.name) || selectedLabels.includes(lbl.color);
                        return (
                          <div
                            key={lbl.id}
                            onClick={() => {
                              const identifier = lbl.name ? lbl.name : lbl.id;
                              toggleFilterLabel(identifier);
                            }}
                            className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={checked}
                              size="small"
                              sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                            />
                            {/* Thanh màu nhãn với diện tích đầy đủ (w-full h-8 px-3 rounded-md) */}
                            <div
                              title={lbl.name ? `Nhãn: ${lbl.name}` : "Màu sắc: nhãn không tên"}
                              className={`flex-1 h-8 px-3 rounded-md flex items-center shadow-xs transition-opacity hover:opacity-90 ${lbl.color}`}
                            >
                              {lbl.name ? (
                                <span className="text-xs font-bold text-white truncate">
                                  {lbl.name}
                                </span>
                              ) : (
                                <span className="text-[10px] bg-white/20 text-white/90 px-2 py-0.5 rounded italic">
                                  Không có tên
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Chọn nhãn Accordion */}
                      <div>
                        <div
                          onClick={() => setLabelsDropdownExpanded(!labelsDropdownExpanded)}
                          className="flex items-center justify-between p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        >
                          <span className="text-xs font-medium text-slate-700">
                            Chọn nhãn
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              labelsDropdownExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Activity */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      Activity
                    </label>
                    <div className="space-y-1">
                      <div
                        onClick={() => setFilterActivityPastWeek(!filterActivityPastWeek)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterActivityPastWeek}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          Hoạt động trong tuần qua
                        </span>
                      </div>
                      <div
                        onClick={() => setFilterActivityTwoWeeks(!filterActivityTwoWeeks)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterActivityTwoWeeks}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          Hoạt động trong hai tuần qua
                        </span>
                      </div>
                      <div
                        onClick={() => setFilterActivityFourWeeks(!filterActivityFourWeeks)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterActivityFourWeeks}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          Hoạt động trong bốn tuần qua
                        </span>
                      </div>
                      <div
                        onClick={() => setFilterActivityNoneFourWeeks(!filterActivityNoneFourWeeks)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={filterActivityNoneFourWeeks}
                          size="small"
                          sx={{ padding: "2px", "&.Mui-checked": { color: "#0c66e4" } }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          Không có hoạt động trong bốn tuần qua
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Match Mode & Reset */}
                <div className="pt-3 border-t border-slate-100 mt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Khớp bất kỳ</span>
                    <button
                      onClick={clearAllFilters}
                      disabled={activeFiltersCount === 0}
                      className={`text-xs font-bold transition-colors ${
                        activeFiltersCount > 0
                          ? "text-red-600 hover:text-red-700 cursor-pointer"
                          : "text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      Xóa bộ lọc {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nút Thùng lưu trữ (Mục đã lưu trữ) */}
          <button
            onClick={() => setIsArchivedDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-xs font-semibold transition-all backdrop-blur-xs cursor-pointer border border-white/20 shadow-xs"
            title="Xem các mục đã lưu trữ"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>Mục đã lưu trữ</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0c66e4] hover:bg-blue-50 rounded-md text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Chia sẻ
          </button>
        </div>
      </div>

      {/* ACTIVE FILTER BADGE NOTICE */}
      {activeFiltersCount > 0 && (
        <div className="bg-amber-400 text-slate-900 px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-amber-500 shadow-inner">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Đang lọc thẻ trên bảng (khớp với {activeFiltersCount} tiêu chí:{" "}
              {filterKeyword && `"${filterKeyword}", `}
              {selectedLabels.join(", ")}{" "}
              {selectedMembers.length > 0 && `(Thành viên: ${selectedMembers.join(", ")})`}
              )
            </span>
          </div>
          <button
            onClick={clearAllFilters}
            className="font-bold underline hover:text-red-800 cursor-pointer"
          >
            Bỏ lọc
          </button>
        </div>
      )}

      {/* 3. DND KANBAN BOARD CANVAS */}
      {!isMounted ? (
        <div className="flex-1 min-h-0 p-4 overflow-x-auto overflow-y-hidden flex items-start gap-3 kanban-board-canvas opacity-80">
          {displayLists.map((list) => (
            <div
              key={list.id}
              className="w-72 shrink-0 bg-[#f1f2f4] rounded-xl flex flex-col max-h-full shadow-md border border-slate-200/80 p-3"
            >
              <h3 className="font-semibold text-sm text-slate-800 mb-3">{list.title}</h3>
              <div className="space-y-2">
                {list.cards.map((c) => (
                  <div key={c.id} className="bg-white rounded-lg p-3 shadow-xs border border-slate-200">
                    <div className="text-sm font-medium text-slate-800">{c.title}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          id="kanban-board-dnd"
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
        <div className="flex-1 min-h-0 p-4 overflow-x-auto overflow-y-hidden flex items-start gap-3 kanban-board-canvas">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {displayLists.map((list) => (
              <SortableColumn
                key={list.id}
                list={list}
                onSelectCard={(c, lt) => setSelectedCard({ card: c, listTitle: lt })}
                onToggleDueDate={handleToggleDueDateCard}
                onQuickEdit={handleOpenQuickEdit}
                addingCardListId={addingCardListId}
                setAddingCardListId={setAddingCardListId}
                newCardTitle={newCardTitle}
                setNewCardTitle={setNewCardTitle}
                onAddCard={handleAddCard}
                activeCardHeight={activeCardHeight}
                onArchiveList={handleArchiveList}
                onSortList={handleSortList}
              />
            ))}
          </SortableContext>

          {/* ADD NEW LIST COLUMN */}
          <div className="w-72 shrink-0">
            {isAddingList ? (
              <form
                onSubmit={handleAddList}
                className="bg-[#f1f2f4] p-3 rounded-xl shadow-md flex flex-col gap-2.5 animate-in fade-in"
              >
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  placeholder="Nhập tiêu đề danh sách..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  sx={{
                    backgroundColor: "#ffffff",
                    borderRadius: "4px",
                    boxShadow: "0 1px 1px rgba(9, 30, 66, 0.25)",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      padding: "2px 4px",
                      "& fieldset": {
                        borderColor: "#dcdfe4",
                        borderWidth: "1px",
                      },
                      "&:hover fieldset": {
                        borderColor: "#85b8ff",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#0c66e4",
                        borderWidth: "2px",
                      },
                    },
                  }}
                />
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer"
                  >
                    Thêm danh sách
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle("");
                    }}
                    className="p-1 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Thêm danh sách khác
              </button>
            )}
          </div>
        </div>

        {/* DRAG OVERLAY PORTAL */}
        <DragOverlay>
          {activeColumn && (
            <div className="w-72 bg-[#f1f2f4] rounded-xl flex flex-col max-h-[75vh] shadow-2xl border-2 border-[#0c66e4] rotate-1 opacity-95 pointer-events-none select-none">
              {/* Header */}
              <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-200/60">
                <h3 className="font-semibold text-sm text-slate-800 px-1 truncate">
                  {activeColumn.title}
                </h3>
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="text-xs bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded-full">
                    {activeColumn.cards.length}
                  </span>
                  <div className="p-1 rounded-md text-slate-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Cards List inside dragging column */}
              <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2 column-cards-scroll min-h-[40px]">
                {activeColumn.cards.map((card) => (
                  <CardView key={card.id} card={card} isOverlay={true} />
                ))}
              </div>

              {/* Footer preview */}
              <div className="p-2 pt-1 border-t border-slate-200/40">
                <div className="w-full py-1.5 px-2 text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm thẻ
                </div>
              </div>
            </div>
          )}

          {activeCard && (
            <div className="w-68 rotate-3 opacity-95">
              <CardView card={activeCard} isOverlay={true} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      )}

            {/* 8. QUICK CARD EDITOR OVERLAY (CHUẨN TRELLO CHÍNH XÁC THEO HÌNH ẢNH MẪU) */}
      {quickEditCard && (() => {
        const dueInfo = quickEditCard.card.dueDate
          ? getDueDateStatus(quickEditCard.card.dueDate, quickEditCard.card.isDueComplete)
          : null;

        const quickActions = [
          {
            id: "open",
            label: "Mở Thẻ",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            ),
            onClick: handleQuickOpenFullCard,
          },
          {
            id: "labels",
            label: "Chỉnh sửa nhãn",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            ),
            onClick: () => {
              setSelectedCard({ card: quickEditCard.card, listTitle: quickEditCard.listTitle });
              setCardModalMenu("labels");
              setQuickEditCard(null);
            },
          },
          {
            id: "members",
            label: "Thay đổi thành viên",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
            onClick: () => {
              setSelectedCard({ card: quickEditCard.card, listTitle: quickEditCard.listTitle });
              setCardModalMenu("members");
              setQuickEditCard(null);
            },
          },
          {
            id: "cover",
            label: "Thay đổi bìa",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            onClick: () => {
              setSelectedCard({ card: quickEditCard.card, listTitle: quickEditCard.listTitle });
              setCardModalMenu("cover");
              setQuickEditCard(null);
            },
          },
          {
            id: "dates",
            label: "Chỉnh sửa ngày",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            onClick: () => {
              setSelectedCard({ card: quickEditCard.card, listTitle: quickEditCard.listTitle });
              setCardModalMenu("dueDate");
              setQuickEditCard(null);
            },
          },
          {
            id: "focus",
            label: "Lên lịch trình cho thời gian tập trung",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            ),
            onClick: handleQuickOpenFullCard,
          },
          {
            id: "move",
            label: "Di chuyển",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            ),
            onClick: handleQuickOpenFullCard,
          },
          {
            id: "jira",
            label: "Tạo hạng mục công việc Jira",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            onClick: handleQuickOpenFullCard,
          },
          {
            id: "copy",
            label: "Sao chép thẻ",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ),
            onClick: () => {
              // Nhân bản thẻ
              const cardToCopy = quickEditCard.card;
              const newCard: CardItem = {
                ...cardToCopy,
                id: "c_" + Date.now(),
                title: cardToCopy.title + " (Bản sao)",
              };
              setBoard((prev) => ({
                ...prev,
                lists: prev.lists.map((l) =>
                  l.title === quickEditCard.listTitle ? { ...l, cards: [...l.cards, newCard] } : l
                ),
              }));
              setQuickEditCard(null);
            },
          },
          {
            id: "copyLink",
            label: "Sao chép liên kết",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ),
            onClick: () => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href + "#card=" + quickEditCard.card.id);
              }
              setQuickEditCard(null);
            },
          },
          {
            id: "archive",
            label: "Lưu trữ",
            icon: (
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            ),
            onClick: handleQuickArchiveCard,
          },
        ];

        return (
          <div
            onClick={() => setQuickEditCard(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-start justify-start animate-in fade-in duration-100 overflow-y-auto"
          >
            {/* Popover Container đặt chính xác vị trí thẻ */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                top: Math.max(16, Math.min(window.innerHeight - 340, quickEditCard.rect.top)),
                left: Math.max(16, Math.min(window.innerWidth - 560, quickEditCard.rect.left)),
              }}
              className="flex items-start gap-2.5 animate-in zoom-in-95 duration-150 select-none z-50 w-max"
            >
              {/* CỘT 1: THẺ SOẠN THẢO TRỰC TIẾP + NÚT LƯU (Đúng bằng chiều rộng của thẻ gốc) */}
              <div
                style={{ width: Math.max(260, quickEditCard.rect.width) }}
                className="flex flex-col gap-2.5 shrink-0"
              >
                {/* Thẻ mô phỏng chính xác thẻ hiện tại với Textarea */}
                <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
                  {/* Ảnh bìa hoặc màu bìa nếu có */}
                  {quickEditCard.card.coverUrl ? (
                    <div className="w-full h-32 bg-slate-100 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={quickEditCard.card.coverUrl}
                        alt="cover"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                  ) : quickEditCard.card.coverColor ? (
                    <div className={`w-full h-8 ${quickEditCard.card.coverColor}`} />
                  ) : null}

                  <div className="p-3">
                    {/* Nhãn thẻ (Labels) */}
                    {quickEditCard.card.labels && quickEditCard.card.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {quickEditCard.card.labels.map((lb) => (
                          <span
                            key={lb.id}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${lb.color}`}
                          >
                            {lb.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Textarea nhập tiêu đề trực tiếp (tự động co giãn theo nội dung, không có thanh cuộn thô) */}
                    <textarea
                      autoFocus
                      rows={3}
                      value={quickEditTitle}
                      onChange={(e) => {
                        setQuickEditTitle(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      onFocus={(e) => {
                        // Di chuyển con trỏ xuống cuối văn bản
                        const val = e.target.value;
                        e.target.value = "";
                        e.target.value = val;
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveQuickEditTitle();
                        } else if (e.key === "Escape") {
                          setQuickEditCard(null);
                        }
                      }}
                      className="w-full text-sm font-medium text-slate-900 border-none outline-none resize-none bg-transparent p-0 leading-snug overflow-hidden block"
                      style={{ minHeight: "60px" }}
                      placeholder="Nhập tiêu đề thẻ..."
                    />

                    {/* Footer Badges (Ngày hết hạn, Checklist, Bình luận, Thành viên) */}
                    <div className="mt-3 flex items-center justify-between text-slate-500 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Hạn chót */}
                        {quickEditCard.card.dueDate && dueInfo && (
                          <span
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium ${dueInfo.badgeBg} ${dueInfo.badgeText}`}
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="leading-tight">{quickEditCard.card.dueDate}</span>
                          </span>
                        )}

                        {/* Checklist */}
                        {quickEditCard.card.checklistTotal !== undefined && (
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {quickEditCard.card.checklistDone}/{quickEditCard.card.checklistTotal}
                          </span>
                        )}

                        {/* Comments */}
                        {quickEditCard.card.commentsCount ? (
                          <span className="flex items-center gap-1 text-slate-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            {quickEditCard.card.commentsCount}
                          </span>
                        ) : null}
                      </div>

                      {/* Thành viên */}
                      {quickEditCard.card.members && quickEditCard.card.members.length > 0 && (
                        <div className="flex items-center -space-x-1">
                          {quickEditCard.card.members.map((m, idx) => (
                            <span
                              key={idx}
                              className="w-5 h-5 rounded-full bg-[#0c66e4] text-white text-[10px] font-bold flex items-center justify-center border border-white"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* NÚT LƯU TIÊU ĐỀ (Chuẩn Trello: Nút xanh phẳng, bo góc nhẹ) */}
                <div>
                  <button
                    type="button"
                    onClick={handleSaveQuickEditTitle}
                    className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              </div>

              {/* CỘT 2: THANH MENU TÁC VỤ NHANH TRELLO (BO GÓC MỀM MẠI, NỀN BÁN TRONG SUỐT ĐEN NHƯ ẢNH MẪU) */}
              <div className="flex flex-col gap-1.5 shrink-0 w-72 max-h-[85vh] overflow-y-auto no-scrollbar animate-in slide-in-from-left-2 duration-150">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.onClick}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 bg-[#000000b3] hover:bg-[#000000cc] text-white text-xs font-medium rounded-md backdrop-blur-md transition-colors cursor-pointer shadow-xs text-left"
                  >
                    <span className="shrink-0">{action.icon}</span>
                    <span className="whitespace-nowrap font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. SHARE & INVITE MEMBER MODAL (POPUP CHIA SẺ VÀ MỜI THÀNH VIÊN CHUẨN TRELLO) */}
      {isShareModalOpen && (
        <div
          onClick={() => {
            setIsShareModalOpen(false);
            setInviteError(null);
            setInviteSuccessMsg(null);
          }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-800 animate-in zoom-in-95 duration-150 cursor-default select-none flex flex-col transition-all relative overflow-visible"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0c66e4] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="font-bold text-base text-slate-900">Chia sẻ bảng làm việc</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(false);
                  setInviteError(null);
                  setInviteSuccessMsg(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Error or Success notification */}
            {inviteError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{inviteError}</span>
              </div>
            )}
            {inviteSuccessMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{inviteSuccessMsg}</span>
              </div>
            )}

            {/* Invite Form */}
            <form onSubmit={handleInviteMember} className="mb-5">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Địa chỉ email hoặc tên người dùng..."
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.8125rem",
                        borderRadius: "8px",
                      },
                    }}
                  />
                </div>

                <div className="relative w-36">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none bg-white text-slate-700 focus:border-[#0c66e4] appearance-none cursor-pointer"
                  >
                    <option value="MEMBER">Thành viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                    <option value="OBSERVER">Chỉ xem</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  Chia sẻ
                </button>
              </div>
            </form>

            {/* Quick Share with Invite Link */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">Chia sẻ bằng liên kết</p>
                  <p className="text-[11px] text-slate-500 truncate">Bất kỳ ai có liên kết này đều có thể tham gia bảng</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                className={"px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 " + (isCopiedInviteLink ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs")}
              >
                {isCopiedInviteLink ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Đã sao chép!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Sao chép liên kết
                  </>
                )}
              </button>
            </div>

            {/* Current Members List */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Thành viên trong bảng ({boardMembersList.length})
                </span>
              </div>

              <div className="space-y-2">
                {boardMembersList.map((member) => {
                  const roleConfig = {
                    ADMIN: { label: "Quản trị viên", desc: "Xem, chỉnh sửa và quản lý toàn bộ thành viên trong bảng", badge: "bg-amber-100 text-amber-800" },
                    MEMBER: { label: "Thành viên", desc: "Xem, tạo thẻ và chỉnh sửa thẻ trong bảng", badge: "bg-blue-50 text-blue-700" },
                    OBSERVER: { label: "Chỉ xem", desc: "Chỉ xem nội dung, không thể thêm hoặc sửa thẻ", badge: "bg-slate-100 text-slate-600" },
                  }[member.role];

                  const isDropdownOpen = activeMemberDropdownId === member.id;

                  const isPending = member.status === "PENDING";

                  return (
                    <div
                      key={member.id}
                      className={"flex items-center justify-between p-3 rounded-xl border shadow-2xs transition-all relative " + (isPending ? "bg-amber-50/40 border-amber-200/80" : "bg-white hover:bg-slate-50/80 border-slate-200/80")}
                    >
                      {/* Avatar & User Details */}
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={"w-9 h-9 rounded-full " + member.avatarBg + " text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 relative"}>
                          {member.initials}
                          {isPending && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 border-2 border-white rounded-full" title="Đang chờ phản hồi" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 truncate leading-snug">{member.name}</p>
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/90 shrink-0" title="Đang chờ người dùng mở email và nhấn chấp nhận lời mời">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Chờ xác nhận qua email
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{member.email}</p>
                        </div>
                      </div>

                      {/* Role Selector Button & Remove */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMemberDropdownId(isDropdownOpen ? null : member.id)}
                            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer " + (isDropdownOpen ? "bg-white border-[#0c66e4] text-[#0c66e4] ring-2 ring-blue-100" : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200 shadow-2xs")}
                          >
                            <span>{roleConfig.label}</span>
                            <svg className={"w-3.5 h-3.5 text-slate-500 transition-transform duration-150 " + (isDropdownOpen ? "rotate-180 text-[#0c66e4]" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Trello Style Role Popover Menu */}
                          {isDropdownOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100"
                            >
                              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                                Quyền hạn trên bảng
                              </div>

                              <div className="space-y-1">
                                {/* Option 1: Thành viên */}
                                <div
                                  onClick={() => {
                                    handleChangeMemberRole(member.id, "MEMBER");
                                    setActiveMemberDropdownId(null);
                                  }}
                                  className={"p-2 rounded-lg cursor-pointer transition-colors flex items-start gap-2.5 " + (member.role === "MEMBER" ? "bg-blue-50/80 text-[#0c66e4]" : "hover:bg-slate-100 text-slate-700")}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xs">Thành viên</span>
                                      {member.role === "MEMBER" && <span className="font-bold text-xs">✓</span>}
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                                      Xem, tạo và chỉnh sửa thẻ trong bảng làm việc
                                    </p>
                                  </div>
                                </div>

                                {/* Option 2: Quản trị viên */}
                                <div
                                  onClick={() => {
                                    handleChangeMemberRole(member.id, "ADMIN");
                                    setActiveMemberDropdownId(null);
                                  }}
                                  className={"p-2 rounded-lg cursor-pointer transition-colors flex items-start gap-2.5 " + (member.role === "ADMIN" ? "bg-blue-50/80 text-[#0c66e4]" : "hover:bg-slate-100 text-slate-700")}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xs">Quản trị viên</span>
                                      {member.role === "ADMIN" && <span className="font-bold text-xs">✓</span>}
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                                      Xem, chỉnh sửa và quản lý mọi thành viên & cài đặt bảng
                                    </p>
                                  </div>
                                </div>

                                {/* Option 3: Chỉ xem */}
                                <div
                                  onClick={() => {
                                    handleChangeMemberRole(member.id, "OBSERVER");
                                    setActiveMemberDropdownId(null);
                                  }}
                                  className={"p-2 rounded-lg cursor-pointer transition-colors flex items-start gap-2.5 " + (member.role === "OBSERVER" ? "bg-blue-50/80 text-[#0c66e4]" : "hover:bg-slate-100 text-slate-700")}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xs">Chỉ xem (Observer)</span>
                                      {member.role === "OBSERVER" && <span className="font-bold text-xs">✓</span>}
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                                      Chỉ xem nội dung, không thể di chuyển hoặc thay đổi thẻ
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMemberFromBoard(member.id)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer text-xs shrink-0"
                          title={isPending ? "Hủy lời mời này" : "Rời khỏi / Xóa thành viên"}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL XÁC NHẬN XÓA THẺ VĨNH VIỄN (CUSTOM POPUP WEB CHUẨN TRELLO) */}
      {cardToDeleteId && (
        <div
          onClick={() => setCardToDeleteId(null)}
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 text-slate-800 animate-in zoom-in-95 duration-150 cursor-default select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Xóa thẻ vĩnh viễn?</h4>
              </div>
              <button
                type="button"
                onClick={() => setCardToDeleteId(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Tất cả các hành động liên quan đến thẻ này sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn <strong className="text-red-600 font-semibold">không thể hoàn tác</strong> hành động này.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCardToDeleteId(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCard}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-red-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ARCHIVED ITEMS DRAWER (THÙNG LƯU TRỮ CHUẨN TRELLO) */}
      {isArchivedDrawerOpen && (
        <div
          onClick={() => setIsArchivedDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm sm:max-w-md bg-white text-slate-800 h-full shadow-2xl flex flex-col p-5 border-l border-slate-200 animate-in slide-in-from-right duration-200 cursor-default select-none"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <h3 className="font-bold text-base text-slate-900">Mục đã lưu trữ</h3>
              </div>
              <button
                onClick={() => setIsArchivedDrawerOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Search within Archive */}
            <div className="mb-4">
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm mục đã lưu trữ..."
                value={archivedSearchQuery}
                onChange={(e) => setArchivedSearchQuery(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "0.8125rem",
                  },
                }}
              />
            </div>

            {/* Toggle Tabs: Thẻ vs Danh sách */}
            <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setArchivedTab("cards")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  archivedTab === "cards" ? "bg-white text-[#0c66e4] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Thẻ đã lưu trữ
              </button>
              <button
                onClick={() => setArchivedTab("lists")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  archivedTab === "lists" ? "bg-white text-[#0c66e4] shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Danh sách đã lưu trữ
              </button>
            </div>

            {/* Items List Content */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
              {archivedTab === "cards" ? (() => {
                const allArchivedCards = board.lists.flatMap((l) =>
                  l.cards
                    .filter((c) => c.isArchived)
                    .map((c) => ({ card: c, listTitle: l.title }))
                ).filter((item) =>
                  item.card.title.toLowerCase().includes(archivedSearchQuery.toLowerCase())
                );

                if (allArchivedCards.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
                      Không có thẻ nào trong thùng lưu trữ
                    </div>
                  );
                }

                return allArchivedCards.map(({ card, listTitle }) => (
                  <div
                    key={card.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col gap-2 group"
                  >
                    <div
                      onClick={() => setSelectedCard({ card, listTitle })}
                      className="cursor-pointer"
                      title="Nhấp để mở xem chi tiết thẻ này"
                    >
                      <h4 className="font-semibold text-xs text-slate-800 leading-snug group-hover:text-[#0c66e4] transition-colors">{card.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Danh sách gốc: <span className="font-medium text-slate-700">{listTitle}</span></p>
                    </div>
                    <div className="flex items-center gap-3 pt-1 border-t border-slate-200 text-xs font-medium">
                      <button
                        onClick={() => handleRestoreCard(card.id)}
                        className="text-[#0c66e4] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Khôi phục về bảng
                      </button>
                      <button
                        onClick={() => handleOpenDeleteConfirm(card.id)}
                        className="text-red-600 hover:underline cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </div>
                ));
              })() : (() => {
                const archivedLists = board.lists
                  .filter((l) => l.isArchived)
                  .filter((l) => l.title.toLowerCase().includes(archivedSearchQuery.toLowerCase()));

                if (archivedLists.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
                      Không có danh sách nào trong thùng lưu trữ
                    </div>
                  );
                }

                return archivedLists.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">{l.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{l.cards.length} thẻ bên trong</p>
                    </div>
                    <button
                      onClick={() => handleRestoreList(l.id)}
                      className="px-2.5 py-1.5 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Đưa lại bảng
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 4. TRELLO CARD DETAIL MODAL */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f1f2f4] rounded-2xl max-w-5xl w-full min-h-[500px] sm:min-h-[560px] max-h-[95vh] overflow-y-auto no-scrollbar relative shadow-2xl border border-slate-300 text-slate-800 cursor-default overflow-hidden"
          >
            {/* Modal Cover Image / Color Header Banner */}
            {selectedCard.card.coverUrl ? (
              <div className="w-full h-44 sm:h-52 bg-slate-800 relative group overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedCard.card.coverUrl}
                  alt="cover"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveCover}
                  className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold rounded-md backdrop-blur-xs flex items-center gap-1.5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Gỡ ảnh bìa
                </button>
              </div>
            ) : selectedCard.card.coverColor ? (
              <div className={`w-full h-24 sm:h-28 ${selectedCard.card.coverColor} relative group flex items-end justify-end p-3`}>
                <button
                  onClick={handleRemoveCover}
                  className="px-3 py-1 bg-black/50 hover:bg-black/70 text-white text-xs font-semibold rounded-md backdrop-blur-xs flex items-center gap-1.5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  Gỡ màu bìa
                </button>
              </div>
            ) : null}

            <div className="p-6 sm:p-7 pb-10">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer z-20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 mb-6">
              <svg
                className="w-5 h-5 text-slate-600 mt-1 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="3" y="3" width="7" height="15" rx="1.5" />
                <rect x="14" y="3" width="7" height="10" rx="1.5" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {selectedCard.card.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  trong danh sách{" "}
                  <span className="font-semibold underline">
                    {selectedCard.listTitle}
                  </span>
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Labels, Members & Due Date Info */}
                <div className="flex flex-wrap gap-4">
                  {selectedCard.card.members && selectedCard.card.members.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Thành viên
                      </h5>
                      <div className="flex items-center gap-1.5">
                        {selectedCard.card.members.map((m, idx) => (
                          <span
                            key={idx}
                            onClick={() => handleToggleCardMember(m)}
                            title={`Nhấn để gỡ thành viên ${m}`}
                            className="w-7 h-7 rounded-full bg-[#0c66e4] hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nhãn Header Badges */}
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Nhãn
                    </h5>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedCard.card.labels && selectedCard.card.labels.length > 0 && (
                        selectedCard.card.labels.map((lb) => (
                          <span
                            key={lb.id}
                            onClick={() => handleToggleCardLabel(lb)}
                            title={`Nhấn để gỡ nhãn ${lb.name || "này"}`}
                            className={`min-w-[48px] h-8 px-3 rounded text-xs font-bold flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity shadow-xs ${
                              colorBlindMode ? "ring-2 ring-white/80 border border-black/40" : ""
                            } ${lb.color}`}
                          >
                            {lb.name}
                          </span>
                        ))
                      )}
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuAnchorRect({
                            top: rect.top,
                            left: rect.left,
                            right: rect.right,
                            bottom: rect.bottom,
                          });
                          setCardModalMenu(cardModalMenu === "labels" ? null : "labels");
                        }}
                        title="Thêm hoặc chỉnh sửa nhãn"
                        className="w-8 h-8 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {selectedCard.card.dueDate && (() => {
                    const modalDueInfo = getDueDateStatus(selectedCard.card.dueDate, selectedCard.card.isDueComplete);
                    return (
                      <div>
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Ngày hết hạn
                        </h5>
                        <div className="flex items-center gap-1.5">
                          {/* Ô chọn ngày hết hạn chuẩn Trello Light Theme (Không có checkbox - Bấm vào để chọn lại thời gian) */}
                          <div
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuAnchorRect({
                                top: rect.top,
                                left: rect.left,
                                right: rect.right,
                                bottom: rect.bottom,
                              });
                              setCardModalMenu(cardModalMenu === "dueDate" ? null : "dueDate");
                            }}
                            className={"inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#091e420f] hover:bg-[#091e4214] text-[#172b4d] text-xs font-normal cursor-pointer transition-all select-none border border-transparent " + (cardModalMenu === "dueDate" ? "ring-2 ring-[#0c66e4] bg-white border-[#0c66e4] shadow-xs" : "")}
                            title="Nhấn để chọn lại thời gian"
                          >
                            {/* Ngày giờ (Ví dụ: 9:00 14 thg 10) */}
                            <span className="text-[13px] text-[#172b4d] font-normal leading-none">
                              {selectedCard.card.dueDate}
                            </span>

                            {/* Badge trạng thái chuẩn Trello: Quá hạn, Sắp hết hạn */}
                            {modalDueInfo.status === "overdue" ? (
                              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#f8716833] text-[#ae2e24] leading-none">
                                Quá hạn
                              </span>
                            ) : modalDueInfo.status === "dueSoon" ? (
                              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#f5cd4740] text-[#974f0c] leading-none">
                                Sắp hết hạn
                              </span>
                            ) : null}

                            {/* Mũi tên trỏ xuống Chevron */}
                            <svg className={"w-4 h-4 text-[#44546f] transition-transform duration-150 shrink-0 " + (cardModalMenu === "dueDate" ? "rotate-180 text-[#0c66e4]" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {/* Nút Xóa Ngày (dấu X xám gọn gàng kế bên) */}
                          <button
                            type="button"
                            onClick={() => handleSetDueDate("")}
                            title="Xóa ngày hết hạn"
                            className="p-1.5 hover:bg-[#091e420f] text-[#626f86] hover:text-[#172b4d] rounded-sm transition-colors cursor-pointer flex items-center justify-center"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>                      </div>
                    );
                  })()}
                </div>

                {/* Description (Rich Text Editor chuẩn Trello / CKEditor) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Mô tả
                    </div>
                    {!isEditingDescription && (
                      <button
                        onClick={() => setIsEditingDescription(true)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                  </div>

                  {isEditingDescription ? (
                    <div className="flex flex-col gap-2.5 animate-in fade-in select-none">
                      {/* Editor Card Box */}
                      <div className="bg-white rounded-lg border-2 border-[#0c66e4] shadow-sm overflow-hidden transition-all">
                        {/* CKEditor / Trello Toolbar */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-200 bg-slate-50/80 text-slate-600">
                          {/* Left Formatting Tools */}
                          <div className="flex items-center gap-0.5 sm:gap-1 text-xs">
                            {/* Heading Dropdown (Tt v) */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setHeadingDropdownOpen(!headingDropdownOpen);
                                  setListDropdownOpen(false);
                                  setInsertDropdownOpen(false);
                                }}
                                className="flex items-center gap-0.5 px-2 py-1 rounded hover:bg-slate-200 font-bold cursor-pointer text-slate-700"
                              >
                                <span>Tt</span>
                                <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {headingDropdownOpen && (
                                <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-30 animate-in fade-in">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertFormat("# ", "\n", "Tiêu đề 1");
                                      setHeadingDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-bold"
                                  >
                                    Tiêu đề 1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertFormat("## ", "\n", "Tiêu đề 2");
                                      setHeadingDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-semibold"
                                  >
                                    Tiêu đề 2
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertFormat("### ", "\n", "Tiêu đề 3");
                                      setHeadingDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-medium"
                                  >
                                    Tiêu đề 3
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="h-4 w-px bg-slate-300 mx-0.5" />

                            {/* Bold (B) */}
                            <button
                              type="button"
                              onClick={() => handleInsertFormat("**", "**", "văn bản đậm")}
                              title="In đậm (Ctrl+B)"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                            >
                              B
                            </button>

                            {/* Italic (I v) */}
                            <button
                              type="button"
                              onClick={() => handleInsertFormat("*", "*", "văn bản nghiêng")}
                              title="In nghiêng (Ctrl+I)"
                              className="flex items-center gap-0.5 px-1.5 h-7 rounded hover:bg-slate-200 italic font-serif text-slate-700 cursor-pointer"
                            >
                              <span>I</span>
                              <svg className="w-2.5 h-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            <div className="h-4 w-px bg-slate-300 mx-0.5" />

                            {/* Lists (:-- v) */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setListDropdownOpen(!listDropdownOpen);
                                  setHeadingDropdownOpen(false);
                                  setInsertDropdownOpen(false);
                                }}
                                title="Danh sách"
                                className="flex items-center gap-0.5 px-1.5 h-7 rounded hover:bg-slate-200 cursor-pointer text-slate-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                <svg className="w-2.5 h-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {listDropdownOpen && (
                                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-30 animate-in fade-in">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertFormat("- ", "\n", "Mục danh sách");
                                      setListDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2"
                                  >
                                    <span>•</span>
                                    <span>Danh sách có dấu đầu dòng</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertFormat("1. ", "\n", "Mục thứ tự");
                                      setListDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2"
                                  >
                                    <span>1.</span>
                                    <span>Danh sách có đánh số</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="h-4 w-px bg-slate-300 mx-0.5" />

                            {/* Link Button */}
                            <button
                              type="button"
                              onClick={() => handleInsertFormat("[", "](https://ví-dụ.com)", "tiêu đề liên kết")}
                              title="Chèn liên kết"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </button>

                            {/* Image Button */}
                            <button
                              type="button"
                              onClick={() => handleInsertFormat("![Mô tả ảnh](", ")", "https://link-anh.png")}
                              title="Chèn hình ảnh"
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>

                            {/* More / Insert (+ v) */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setInsertDropdownOpen(!insertDropdownOpen);
                                  setHeadingDropdownOpen(false);
                                  setListDropdownOpen(false);
                                }}
                                title="Chèn thêm"
                                className="flex items-center gap-0.5 px-1.5 h-7 rounded hover:bg-slate-200 cursor-pointer text-slate-700 font-bold"
                              >
                                <span>+</span>
                                <svg className="w-2.5 h-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {insertDropdownOpen && (
                                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-30 animate-in fade-in">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertFormat("```\n", "\n```", "// Viết code tại đây");
                                      setInsertDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2"
                                  >
                                    <span>&lt;/&gt;</span>
                                    <span>Khối mã code</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertFormat("> ", "\n", "Trích dẫn nội dung");
                                      setInsertDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2"
                                  >
                                    <span>&quot;</span>
                                    <span>Khối trích dẫn</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertFormat("\n---\n", "", "");
                                      setInsertDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs flex items-center gap-2"
                                  >
                                    <span>—</span>
                                    <span>Đường phân cách</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Help Icons */}
                          <div className="flex items-center gap-2 text-slate-500">
                            <span title="Hỗ trợ đính kèm" className="cursor-pointer hover:text-slate-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            </span>
                            <span
                              title="Hỗ trợ Markdown"
                              onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                              className="text-[11px] font-bold tracking-tighter cursor-pointer hover:text-slate-800 flex items-center"
                            >
                              M↓
                            </span>
                            <span
                              title="Trợ giúp định dạng"
                              onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                              className="w-4 h-4 flex items-center justify-center rounded-full border border-slate-400 text-[10px] font-bold cursor-pointer hover:border-slate-700 hover:text-slate-800"
                            >
                              ?
                            </span>
                          </div>
                        </div>

                        {/* Textarea Area */}
                        <div className="p-3">
                          <textarea
                            ref={descriptionTextareaRef}
                            autoFocus
                            rows={5}
                            placeholder="Cần trợ giúp về định dạng? Gõ /trợ giúp."
                            value={cardDescriptionDraft}
                            onChange={(e) => setCardDescriptionDraft(e.target.value)}
                            className="w-full text-sm text-slate-800 placeholder-slate-400 outline-none resize-y min-h-[100px] leading-relaxed bg-transparent"
                          />
                        </div>

                        {/* Formatting Help Card (Toggle) */}
                        {showFormattingHelp && (
                          <div className="p-3 bg-blue-50/70 border-t border-blue-100 text-xs text-slate-700 space-y-1">
                            <div className="font-bold text-[#0c66e4] mb-1">Cú pháp định dạng Markdown nhanh:</div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div><code className="bg-white px-1 rounded border">**In đậm**</code> → <b>In đậm</b></div>
                              <div><code className="bg-white px-1 rounded border">*In nghiêng*</code> → <i>In nghiêng</i></div>
                              <div><code className="bg-white px-1 rounded border"># Tiêu đề</code> → Tiêu đề lớn</div>
                              <div><code className="bg-white px-1 rounded border">- Danh sách</code> → Dấu đầu dòng</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveDescription}
                            className="px-4 py-2 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCardDescriptionDraft(selectedCard.card.description || "");
                              setIsEditingDescription(false);
                              setShowFormattingHelp(false);
                            }}
                            className="px-3 py-2 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        >
                          Trợ giúp định dạng
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingDescription(true)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 text-sm text-slate-700 min-h-[75px] cursor-pointer transition-all whitespace-pre-wrap leading-relaxed shadow-xs"
                    >
                      {selectedCard.card.description ? (
                        <div>{selectedCard.card.description}</div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Thêm mô tả chi tiết hơn cho công việc này...
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Checklists */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Danh sách việc cần làm (Checklist)
                    </div>
                    {selectedCard.card.checklistItems && selectedCard.card.checklistItems.length > 0 && (
                      <span className="text-xs font-semibold text-slate-500">
                        {Math.round(
                          ((selectedCard.card.checklistDone || 0) /
                            (selectedCard.card.checklistTotal || 1)) *
                            100
                        )}
                        %
                      </span>
                    )}
                  </div>

                  {selectedCard.card.checklistItems && selectedCard.card.checklistItems.length > 0 && (
                    <div className="w-full bg-slate-200 h-2 rounded-full mb-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            ((selectedCard.card.checklistDone || 0) /
                              (selectedCard.card.checklistTotal || 1)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Checklist items list */}
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {(selectedCard.card.checklistItems || []).map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div
                          onClick={() => handleToggleChecklistItem(item.id)}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Checkbox
                            checked={item.done}
                            size="small"
                            sx={{
                              padding: "2px",
                              color: "#94a3b8",
                              "&.Mui-checked": {
                                color: "#10b981",
                              },
                            }}
                          />
                          <span
                            className={
                              item.done
                                ? "line-through text-slate-400 select-none"
                                : "text-slate-800 select-none font-medium"
                            }
                          >
                            {item.text}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          title="Xóa mục này"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-opacity cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add checklist item */}
                  <div className="mt-2.5">
                    {isAddingChecklistItem ? (
                      <div className="flex flex-col gap-2.5 animate-in fade-in">
                        <TextField
                          autoFocus
                          fullWidth
                          size="small"
                          placeholder="Thêm một mục việc cần làm..."
                          value={newChecklistText}
                          onChange={(e) => setNewChecklistText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddChecklistItem();
                            }
                          }}
                          sx={{
                            backgroundColor: "#ffffff",
                            borderRadius: "4px",
                            boxShadow: "0 1px 1px rgba(9, 30, 66, 0.25)",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "4px",
                              fontSize: "0.8125rem",
                              "& fieldset": { borderColor: "#cbd5e1" },
                              "&.Mui-focused fieldset": { borderColor: "#0c66e4" },
                            },
                          }}
                        />
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            onClick={handleAddChecklistItem}
                            className="px-3 py-1.5 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                          >
                            Thêm mục
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingChecklistItem(false);
                              setNewChecklistText("");
                            }}
                            className="px-2 py-1.5 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingChecklistItem(true)}
                        className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm một mục
                      </button>
                    )}
                  </div>
                </div>

                {/* Attachments Section (Các tệp đính kèm) */}
                {selectedCard.card.attachments && selectedCard.card.attachments.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Các tệp đính kèm
                      </div>
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuAnchorRect({
                            top: rect.top,
                            left: rect.left,
                            right: rect.right,
                            bottom: rect.bottom,
                          });
                          setCardModalMenu("attachment");
                        }}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        Thêm
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedCard.card.attachments.map((att) => {
                        const isImage = att.url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || att.url.includes("unsplash.com");
                        return (
                          <div key={att.id} className="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors group">
                            {/* Thumbnail or File Icon */}
                            <div className="w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {isImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-slate-900 hover:underline truncate"
                                >
                                  {att.name}
                                </a>
                                {selectedCard.card.coverUrl === att.url && (
                                  <span className="text-[10px] bg-blue-100 text-[#0c66e4] font-semibold px-1.5 py-0.2 rounded">
                                    Ảnh bìa
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Đã thêm {att.createdAt} {att.size ? `• ${att.size}` : ""}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600 font-medium">
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  Xem
                                </a>
                                {isImage && (
                                  <button
                                    onClick={() => handleToggleCoverAttachment(att)}
                                    className="hover:underline cursor-pointer"
                                  >
                                    {selectedCard.card.coverUrl === att.url ? "Gỡ ảnh bìa" : "Đặt làm ảnh bìa"}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAttachment(att.id)}
                                  className="text-red-600 hover:underline cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Activity & Comments (HOẠT ĐỘNG & BÌNH LUẬN CHUẨN TRELLO LIGHT THEME) */}
                <div>
                  {/* Header với Tabs Lọc: Tất cả / Bình luận / Lịch sử hoạt động */}
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Hoạt động</span>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-[#091e420f] p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setActivityTab("all")}
                        className={"px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer " + (activityTab === "all" ? "bg-white text-[#0c66e4] shadow-2xs" : "text-slate-600 hover:text-slate-900")}
                      >
                        Tất cả ({ (selectedCard.card.comments?.length || 0) + (selectedCard.card.activities?.length || 0) })
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityTab("comments")}
                        className={"px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer " + (activityTab === "comments" ? "bg-white text-[#0c66e4] shadow-2xs" : "text-slate-600 hover:text-slate-900")}
                      >
                        Bình luận ({ selectedCard.card.comments?.length || 0 })
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityTab("history")}
                        className={"px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer " + (activityTab === "history" ? "bg-white text-[#0c66e4] shadow-2xs" : "text-slate-600 hover:text-slate-900")}
                      >
                        Lịch sử ({ selectedCard.card.activities?.length || 0 })
                      </button>
                    </div>
                  </div>

                  {/* New comment input (chỉ hiển thị khi xem tab Tất cả hoặc tab Bình luận) */}
                  {activityTab !== "history" && (
                    <div className="flex gap-2.5 items-start mb-4">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        B
                      </span>
                      <div className="flex-1 flex flex-col gap-2">
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          placeholder="Viết bình luận..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              handleAddComment();
                            }
                          }}
                          sx={{
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "8px",
                              fontSize: "0.8125rem",
                              "& fieldset": { borderColor: "#cbd5e1" },
                              "&.Mui-focused fieldset": { borderColor: "#0c66e4" },
                            },
                          }}
                        />
                        {newCommentText.trim() && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleAddComment}
                              className="px-3.5 py-1.5 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              Lưu bình luận
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewCommentText("")}
                              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Combined Timeline Feed */}
                  {(() => {
                    type FeedItem =
                      | { type: "comment"; data: CommentItem; time: number }
                      | { type: "activity"; data: ActivityItem; time: number };

                    const feedList: FeedItem[] = [];

                    if (activityTab === "all" || activityTab === "comments") {
                      (selectedCard.card.comments || []).forEach((c) => {
                        feedList.push({
                          type: "comment",
                          data: c,
                          time: c.timestamp || 0,
                        });
                      });
                    }

                    if (activityTab === "all" || activityTab === "history") {
                      (selectedCard.card.activities || []).forEach((a) => {
                        feedList.push({
                          type: "activity",
                          data: a,
                          time: a.timestamp || 0,
                        });
                      });
                    }

                    // Sắp xếp theo mốc thời gian mới nhất lên đầu
                    feedList.sort((a, b) => b.time - a.time);

                    if (feedList.length === 0) {
                      return (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          Chưa có hoạt động hoặc bình luận nào trên thẻ này
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {feedList.map((item, idx) => {
                          if (item.type === "comment") {
                            const cm = item.data;
                            return (
                              <div key={"cm_" + cm.id + "_" + idx} className="flex gap-2.5 items-start">
                                <span className={"w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs " + (cm.avatarBg || "bg-emerald-600")}>
                                  {cm.author}
                                </span>
                                <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-900">
                                      {cm.authorName || "Thành viên " + cm.author}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      {cm.createdAt}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed break-words">
                                    {cm.text}
                                  </p>
                                </div>
                              </div>
                            );
                          } else {
                            const act = item.data;
                            return (
                              <div key={"act_" + act.id + "_" + idx} className="flex gap-2.5 items-start">
                                <span className={"w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs " + (act.avatarBg || "bg-blue-600")}>
                                  {act.author}
                                </span>
                                <div className="flex-1 pt-0.5 text-xs text-slate-700 leading-snug">
                                  <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900">
                                      {act.authorName || "Thành viên " + act.author}
                                    </span>
                                    <span>{act.actionText}</span>
                                    {act.targetText && (
                                      <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                        {act.targetText}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 block mt-0.5">
                                    {act.createdAt}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Sidebar Action Buttons */}
              <div className="space-y-4 relative">
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Thêm vào thẻ
                  </h5>
                  <div className="space-y-1.5">
                    {/* Thành viên Button */}
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuAnchorRect({
                          top: rect.top,
                          left: rect.left,
                          right: rect.right,
                          bottom: rect.bottom,
                        });
                        setCardModalMenu(cardModalMenu === "members" ? null : "members");
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        cardModalMenu === "members"
                          ? "bg-[#0c66e4] text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Thành viên
                    </button>

                    {/* Nhãn Button */}
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuAnchorRect({
                          top: rect.top,
                          left: rect.left,
                          right: rect.right,
                          bottom: rect.bottom,
                        });
                        setCardModalMenu(cardModalMenu === "labels" ? null : "labels");
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        cardModalMenu === "labels"
                          ? "bg-[#0c66e4] text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Nhãn
                    </button>

                    {/* Việc cần làm Button */}
                    <button
                      onClick={() => {
                        setIsAddingChecklistItem(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Việc cần làm
                    </button>

                    {/* Đính kèm Button */}
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuAnchorRect({
                          top: rect.top,
                          left: rect.left,
                          right: rect.right,
                          bottom: rect.bottom,
                        });
                        setCardModalMenu(cardModalMenu === "attachment" ? null : "attachment");
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        cardModalMenu === "attachment"
                          ? "bg-[#0c66e4] text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Đính kèm
                    </button>

                    {/* Ảnh bìa Button */}
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuAnchorRect({
                          top: rect.top,
                          left: rect.left,
                          right: rect.right,
                          bottom: rect.bottom,
                        });
                        setCardModalMenu(cardModalMenu === "cover" ? null : "cover");
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        cardModalMenu === "cover"
                          ? "bg-[#0c66e4] text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ảnh bìa
                    </button>

                    {/* Ngày hết hạn Button */}
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuAnchorRect({
                          top: rect.top,
                          left: rect.left,
                          right: rect.right,
                          bottom: rect.bottom,
                        });
                        setCardModalMenu(cardModalMenu === "dueDate" ? null : "dueDate");
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        cardModalMenu === "dueDate"
                          ? "bg-[#0c66e4] text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ngày hết hạn
                    </button>
                  </div>
                </div>

                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Thao tác
                  </h5>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleArchiveCard()}
                      className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Lưu trữ (Archive)
                    </button>

                    <button
                      onClick={() => handleOpenDeleteConfirm(selectedCard.card.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa vĩnh viễn (Delete)
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* 5. MODAL LAYER (Đặt chính giữa màn hình với kích thước tối ưu, không bị tràn màn hình) */}
            {cardModalMenu && (
              <div
                onClick={() => {
                  setCardModalMenu(null);
                  setMenuAnchorRect(null);
                  setIsCreatingNewLabel(false);
                }}
                className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in cursor-default"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 select-none overflow-hidden max-h-[90vh] flex flex-col transition-all"
                >
                  {/* --- SUBMENU 1: THÀNH VIÊN TRONG THẺ (CHUẨN TRELLO LIGHT THEME VỚI 2 SECTION) --- */}
                  {cardModalMenu === "members" && (() => {
                    const boardMembers = boardMembersList.map((m) => ({
                      id: m.initials || m.id,
                      name: m.name,
                      initials: m.initials,
                      color: m.avatarBg + " text-white",
                    }));

                    const q = memberSearchQuery.trim().toLowerCase();
                    const filtered = boardMembers.filter((m) =>
                      q ? m.name.toLowerCase().includes(q) || m.initials.toLowerCase().includes(q) : true
                    );

                    // Tách thành 2 nhóm: Thành viên của thẻ và Thành viên của bảng
                    const cardMembers = filtered.filter((m) => selectedCard.card.members.includes(m.id));
                    const otherBoardMembers = filtered.filter((m) => !selectedCard.card.members.includes(m.id));

                    return (
                      <div className="w-80 sm:w-[340px] p-4 flex flex-col bg-white text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                        {/* Header */}
                        <div className="text-center font-bold text-sm text-slate-800 pb-2 mb-3 border-b border-slate-100 relative">
                          <span>Thành viên</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCardModalMenu(null);
                              setMenuAnchorRect(null);
                              setMemberSearchQuery("");
                            }}
                            className="absolute right-0 top-0 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Search Input (Border xanh Trello sáng đẹp) */}
                        <div className="mb-3">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Tìm kiếm các thành viên"
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full bg-white border-2 border-[#0c66e4] text-slate-800 text-xs px-3 py-2 rounded-lg outline-none placeholder-slate-400 shadow-2xs font-medium"
                          />
                        </div>

                        <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1 max-h-[75vh]">
                          {/* NHÓM 1: THÀNH VIÊN CỦA THẺ (NẾU CÓ) */}
                          {cardMembers.length > 0 && (
                            <div>
                              <div className="mb-1 text-[11px] font-bold text-slate-600">
                                Thành viên của thẻ
                              </div>
                              <div className="space-y-1">
                                {cardMembers.map((m) => (
                                  <div
                                    key={m.id}
                                    onClick={() => handleToggleCardMember(m.id)}
                                    className="flex items-center justify-between p-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200/60 cursor-pointer transition-all group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span
                                        className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs ${m.color}`}
                                      >
                                        {m.initials}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-800 truncate">
                                        {m.name}
                                      </span>
                                    </div>
                                    <span className="text-[#0c66e4] font-bold text-sm pr-1">
                                      ✓
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* NHÓM 2: THÀNH VIÊN CỦA BẢNG */}
                          <div>
                            <div className="mb-1 text-[11px] font-bold text-slate-600">
                              Thành viên của bảng
                            </div>
                            <div className="space-y-1">
                              {otherBoardMembers.length > 0 ? (
                                otherBoardMembers.map((m) => (
                                  <div
                                    key={m.id}
                                    onClick={() => handleToggleCardMember(m.id)}
                                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-all group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span
                                        className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs ${m.color}`}
                                      >
                                        {m.initials}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-slate-900">
                                        {m.name}
                                      </span>
                                    </div>
                                    <span className="text-slate-400 font-bold text-sm pr-1 group-hover:text-slate-600">
                                      +
                                    </span>
                                  </div>
                                ))
                              ) : cardMembers.length === 0 ? (
                                <div className="py-4 text-center text-xs text-slate-400 italic">
                                  Không tìm thấy thành viên phù hợp
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* POPUP 4: ĐÍNH KÈM (ATTACHMENT POPUP CHUẨN TRELLO LIGHT THEME) */}
                  {cardModalMenu === "attachment" && (() => {
                    const recentViewedItems: any[] = [];

                    return (
                      <div className="w-[320px] sm:w-[340px] bg-white rounded-xl shadow-2xl border border-slate-200 p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 relative">
                          <h4 className="font-bold text-sm text-slate-800 flex-1 text-center">
                            Đính kèm
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setCardModalMenu(null);
                              setMenuAnchorRect(null);
                            }}
                            className="absolute right-0 top-0 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Section 1: Upload from Computer */}
                        <div className="mb-4">
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Đính kèm tệp từ máy tính của bạn
                          </label>
                          <p className="text-[11px] text-slate-500 mb-2.5">
                            Bạn cũng có thể kéo và thả tệp để tải chúng lên.
                          </p>
                          <label className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs">
                            Chọn tệp
                            <input
                              type="file"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const tempUrl = URL.createObjectURL(file);
                                  const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
                                  handleAddAttachment(file.name, tempUrl, sizeStr);
                                  setCardModalMenu(null);
                                  setMenuAnchorRect(null);

                                  if (selectedCard) {
                                    try {
                                      const res = await uploadAttachment(selectedCard.card.id, file);
                                      if (res && res.url) {
                                        updateCurrentCard((c) => ({
                                          ...c,
                                          attachments: (c.attachments || []).map((at) =>
                                            at.url === tempUrl ? { ...at, url: res.url, id: String(res.id || at.id) } : at
                                          ),
                                        }));
                                      }
                                    } catch (err) {
                                      console.warn("Lỗi upload tệp đính kèm lên server:", err);
                                    }
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Section 2: Search or Paste Link */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">
                              Tìm kiếm hoặc dán liên kết <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Tìm các liên kết gần đây hoặc dán một..."
                              value={attachmentLinkUrl}
                              onChange={(e) => setAttachmentLinkUrl(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none bg-white text-slate-800 placeholder-slate-400 focus:border-[#0c66e4] focus:ring-1 focus:ring-[#0c66e4] transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">
                              Văn bản hiển thị (không bắt buộc)
                            </label>
                            <input
                              type="text"
                              placeholder="Văn bản cần hiển thị"
                              value={attachmentLinkName}
                              onChange={(e) => setAttachmentLinkName(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none bg-white text-slate-800 placeholder-slate-400 focus:border-[#0c66e4] focus:ring-1 focus:ring-[#0c66e4] transition-all"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              Cung cấp tiêu đề hoặc mô tả cho liên kết này
                            </p>
                          </div>

                          {/* Section 3: Recently Viewed (Đã xem gần đây) */}
                          <div className="pt-2">
                            <span className="text-xs font-bold text-slate-700 block mb-2">
                              Đã xem gần đây
                            </span>
                            <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                              {recentViewedItems.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    setAttachmentLinkUrl("https://trello.work/item/" + item.id);
                                    setAttachmentLinkName(item.title);
                                  }}
                                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group"
                                >
                                  <div className="w-5 h-5 rounded bg-blue-100 text-[#0c66e4] flex items-center justify-center shrink-0">
                                    {item.type === "trello" ? (
                                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="3" y="3" width="7" height="18" rx="1.5" />
                                        <rect x="14" y="3" width="7" height="12" rx="1.5" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#0c66e4]">
                                      {item.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {item.subtitle} • {item.time}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Footer action buttons: Hủy & Chèn */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setAttachmentLinkUrl("");
                                setAttachmentLinkName("");
                                setCardModalMenu(null);
                                setMenuAnchorRect(null);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (attachmentLinkUrl.trim()) {
                                  const name = attachmentLinkName.trim() || attachmentLinkUrl.trim();
                                  handleAddAttachment(name, attachmentLinkUrl.trim());
                                  setAttachmentLinkUrl("");
                                  setAttachmentLinkName("");
                                  setCardModalMenu(null);
                                  setMenuAnchorRect(null);
                                }
                              }}
                              disabled={!attachmentLinkUrl.trim()}
                              className={"px-4 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer " + (attachmentLinkUrl.trim() ? "bg-[#0c66e4] hover:bg-blue-700 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed")}
                            >
                              Chèn
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* POPUP 5: ẢNH BÌA & MÀU BÌA (COVER POPUP) */}
                  {cardModalMenu === "cover" && (() => {
                    const COVER_COLORS = [
                      { id: "c1", name: "Xanh lá", class: "bg-[#4bce97]" },
                      { id: "c2", name: "Vàng", class: "bg-[#f5cd47]" },
                      { id: "c3", name: "Cam", class: "bg-[#fea362]" },
                      { id: "c4", name: "Đỏ", class: "bg-[#f87168]" },
                      { id: "c5", name: "Tím", class: "bg-[#9f8fef]" },
                      { id: "c6", name: "Xanh dương", class: "bg-[#579dff]" },
                      { id: "c7", name: "Xanh ngọc", class: "bg-[#6cc3e0]" },
                      { id: "c8", name: "Hồng", class: "bg-[#e774bb]" },
                      { id: "c9", name: "Đen xám", class: "bg-[#8590a2]" },
                      { id: "c10", name: "Tối giản", class: "bg-[#172b4d]" },
                    ];

                    const COVER_PHOTOS = [
                      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",
                      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
                      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
                      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
                    ];

                    return (
                      <div className="w-[304px] sm:w-[320px] bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 text-slate-800">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 relative">
                          <h4 className="font-bold text-xs text-slate-800 flex-1 text-center">
                            Ảnh bìa
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setCardModalMenu(null);
                              setMenuAnchorRect(null);
                            }}
                            className="absolute right-0 top-0 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Gỡ bỏ ảnh bìa nếu đang có */}
                        {(selectedCard.card.coverUrl || selectedCard.card.coverColor) && (
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveCover();
                              setCardModalMenu(null);
                              setMenuAnchorRect(null);
                            }}
                            className="w-full mb-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                          >
                            Gỡ bỏ ảnh bìa
                          </button>
                        )}

                        {/* 1. Chọn màu bìa */}
                        <div className="mb-4">
                          <label className="text-[11px] font-bold text-slate-600 block mb-2 uppercase tracking-wider">
                            Màu sắc
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {COVER_COLORS.map((col) => (
                              <button
                                key={col.id}
                                type="button"
                                onClick={() => handleSetCoverColor(col.class)}
                                className={`h-8 rounded-lg ${col.class} hover:opacity-90 transition-all cursor-pointer relative flex items-center justify-center ${
                                  selectedCard.card.coverColor === col.class ? "ring-2 ring-offset-2 ring-[#0c66e4]" : ""
                                }`}
                                title={col.name}
                              >
                                {selectedCard.card.coverColor === col.class && (
                                  <svg className="w-4 h-4 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Ảnh từ Unsplash */}
                        <div className="mb-3">
                          <label className="text-[11px] font-bold text-slate-600 block mb-2 uppercase tracking-wider">
                            Ảnh từ Unsplash
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {COVER_PHOTOS.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSetCoverUrl(url)}
                                className={`h-14 rounded-lg overflow-hidden border transition-all cursor-pointer relative ${
                                  selectedCard.card.coverUrl === url ? "ring-2 ring-offset-2 ring-[#0c66e4] border-transparent" : "border-slate-200 hover:opacity-90"
                                }`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="unsplash cover" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Tải ảnh lên làm bìa */}
                        <div>
                          <label className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors cursor-pointer">
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Tải lên ảnh bìa
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const tempUrl = URL.createObjectURL(file);
                                  handleSetCoverUrl(tempUrl);
                                  handleAddAttachment(file.name, tempUrl, (file.size / (1024 * 1024)).toFixed(1) + " MB");
                                  setCardModalMenu(null);
                                  setMenuAnchorRect(null);

                                  if (selectedCard) {
                                    try {
                                      const res = await uploadAttachment(selectedCard.card.id, file, true);
                                      if (res && res.url) {
                                        updateCurrentCard((c) => ({
                                          ...c,
                                          coverUrl: res.url,
                                          attachments: (c.attachments || []).map((at) =>
                                            at.url === tempUrl ? { ...at, url: res.url, isCover: true, id: String(res.id || at.id) } : at
                                          ),
                                        }));
                                      }
                                    } catch (err) {
                                      console.warn("Lỗi upload ảnh bìa lên server:", err);
                                    }
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })()}

                                    {/* --- SUBMENU 2: NHÃN (LABELS) --- */}
                  {cardModalMenu === "labels" && (
                    <div className="w-84 sm:w-92 p-4 flex flex-col max-h-[85vh]">
                      {/* Header */}
                      <div className="text-center font-bold text-sm text-slate-800 pb-2.5 mb-3 border-b border-slate-100 relative">
                        <span>Nhãn (Labels)</span>
                        <button
                          onClick={() => {
                            setCardModalMenu(null);
                            setMenuAnchorRect(null);
                            setIsCreatingNewLabel(false);
                          }}
                          className="absolute right-0 top-0 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Tìm nhãn..."
                          value={labelSearchQuery}
                          onChange={(e) => setLabelSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 focus:border-[#0c66e4] focus:bg-white text-slate-800 text-xs px-3 py-2 rounded-lg outline-none placeholder-slate-400 transition-colors"
                        />
                      </div>

                      {/* Scrollable Labels Area */}
                      <div className="overflow-y-auto pr-1 no-scrollbar space-y-3 flex-1 max-h-[55vh]">
                        {/* Gợi ý (Suggested) */}
                        <div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-1.5">
                            <span>✦</span>
                            <span>Gợi ý</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedCard.card.labels?.some(
                                (l) => l.color.includes("#5e4db2") || l.color.includes("purple")
                              )}
                              onChange={() =>
                                handleToggleCardLabel({
                                  id: "lbl_sug",
                                  name: "",
                                  color: "bg-[#5e4db2] text-white",
                                })
                              }
                              size="small"
                              sx={{
                                padding: "2px",
                                color: "#94a3b8",
                                "&.Mui-checked": { color: "#0c66e4" },
                              }}
                            />
                            <div
                              onClick={() =>
                                handleToggleCardLabel({
                                  id: "lbl_sug",
                                  name: "",
                                  color: "bg-[#5e4db2] text-white",
                                })
                              }
                              className="flex-1 h-8 rounded bg-[#8270db] hover:opacity-90 cursor-pointer transition-opacity flex items-center justify-between px-3 text-xs font-bold text-white shadow-xs"
                            >
                              <span></span>
                              <svg className="w-3.5 h-3.5 text-white/80 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Nhãn List (Giới hạn đúng 8 thẻ) */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                            Nhãn
                          </div>
                          <div className="space-y-1.5">
                            {systemLabels
                              .filter((lbl) =>
                                labelSearchQuery
                                  ? (lbl.name || "").toLowerCase().includes(labelSearchQuery.toLowerCase())
                                  : true
                              )
                              .slice(0, 8)
                              .map((lbl) => {
                                const isSelected = selectedCard.card.labels?.some(
                                  (l) =>
                                    l.id === lbl.id ||
                                    (l.name === lbl.name && l.color === lbl.color)
                                );
                                return (
                                  <div key={lbl.id} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => handleToggleCardLabel(lbl)}
                                      size="small"
                                      sx={{
                                        padding: "2px",
                                        color: "#94a3b8",
                                        "&.Mui-checked": { color: "#0c66e4" },
                                      }}
                                    />
                                    <div
                                      onClick={() => handleToggleCardLabel(lbl)}
                                      className={`flex-1 h-8 rounded ${lbl.color} hover:opacity-90 cursor-pointer transition-opacity flex items-center justify-between px-3 text-xs font-bold shadow-xs ${
                                        colorBlindMode ? "ring-2 ring-slate-900 border border-white" : ""
                                      }`}
                                    >
                                      <span className="truncate">{lbl.name}</span>
                                      <svg className="w-3.5 h-3.5 text-white/80 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Form Tạo nhãn mới */}
                        {isCreatingNewLabel ? (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <input
                              type="text"
                              placeholder="Tên nhãn mới..."
                              value={newLabelTitle}
                              onChange={(e) => setNewLabelTitle(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 focus:border-[#0c66e4] focus:bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                            />
                            <div className="flex gap-1.5 flex-wrap">
                              {[
                                "bg-[#216e4e] text-white",
                                "bg-[#7f5f01] text-white",
                                "bg-[#a54800] text-white",
                                "bg-[#ae2e24] text-white",
                                "bg-[#5e4db2] text-white",
                                "bg-[#0c66e4] text-white",
                              ].map((col, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setNewLabelColor(col)}
                                  className={`w-6 h-6 rounded-md cursor-pointer ${col} ${
                                    newLabelColor === col ? "ring-2 ring-offset-1 ring-slate-800" : ""
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  if (newLabelTitle.trim()) {
                                    const created = {
                                      id: "lbl_" + Date.now(),
                                      name: newLabelTitle.trim(),
                                      color: newLabelColor,
                                    };
                                    setSystemLabels((prev) => [...prev, created]);
                                    handleToggleCardLabel(created);
                                    setNewLabelTitle("");
                                    setIsCreatingNewLabel(false);
                                  }
                                }}
                                className="flex-1 py-1.5 bg-[#0c66e4] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setIsCreatingNewLabel(false)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-lg transition-colors cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1">
                            <button
                              onClick={() => setIsCreatingNewLabel(true)}
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              + Tạo nhãn mới
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Chế độ thân thiện với người mù màu */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => setColorBlindMode(!colorBlindMode)}
                          className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            colorBlindMode
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {colorBlindMode
                            ? "✓ Đã bật chế độ mù màu"
                            : "Bật chế độ thân thiện với người mù màu"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- SUBMENU 3: NGÀY ĐÁO HẠN (CHUẨN TRELLO INTERFACE) --- */}
                  {cardModalMenu === "dueDate" && (() => {
                    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();
                    const firstDayRaw = new Date(calendarYear, calendarMonth, 1).getDay(); // CN=0, T2=1,...
                    const adjustedFirstDay = (firstDayRaw + 6) % 7; // T2=0, T3=1, ..., CN=6

                    const prevMonthDays = [];
                    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
                      prevMonthDays.push({ day: daysInPrevMonth - i, isCurrent: false });
                    }

                    const currentMonthDays = [];
                    for (let i = 1; i <= daysInMonth; i++) {
                      currentMonthDays.push({ day: i, isCurrent: true });
                    }

                    const totalCells = prevMonthDays.length + currentMonthDays.length;
                    const nextMonthDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
                    const nextMonthDays = [];
                    for (let i = 1; i <= nextMonthDaysCount; i++) {
                      nextMonthDays.push({ day: i, isCurrent: false });
                    }

                    const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

                    const handleSelectCalendarDay = (day: number) => {
                      setSelectedDay(day);
                      setEnableDueDate(true);
                      const monthNum = calendarMonth + 1;
                      setDueDateInputStr(`${day}/${monthNum}/${calendarYear}`);
                      const dd = String(day).padStart(2, "0");
                      const mm = String(monthNum).padStart(2, "0");
                      setCustomDueDate(`${dd} Th${mm}`);
                    };

                    const handlePrevMonth = () => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    };

                    const handleNextMonth = () => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
                      }
                    };

                    const handleSaveTrelloDate = () => {
                      if (enableDueDate && dueDateInputStr.trim()) {
                        const parts = dueDateInputStr.split("/");
                        if (parts.length >= 2) {
                          const dd = String(parts[0]).padStart(2, "0");
                          const mm = String(parts[1]).padStart(2, "0");
                          handleSetDueDate(`${dd} Th${mm}`);
                        } else {
                          handleSetDueDate(customDueDate || "07 Th11");
                        }
                      } else {
                        handleSetDueDate("");
                      }
                      setMenuAnchorRect(null);
                    };

                    return (
                      <div className="w-80 sm:w-[320px] p-4 flex flex-col max-h-[88vh] overflow-y-auto no-scrollbar">
                        {/* Header */}
                        <div className="text-center font-bold text-sm text-slate-800 pb-2 mb-2 border-b border-slate-100 relative">
                          <span>Ngày</span>
                          <button
                            onClick={() => {
                              setCardModalMenu(null);
                              setMenuAnchorRect(null);
                            }}
                            className="absolute right-0 top-0 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Calendar Month Navigation */}
                        <div className="flex items-center justify-between px-1 mb-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCalendarYear(calendarYear - 1)}
                              title="Năm trước"
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer text-xs font-bold"
                            >
                              «
                            </button>
                            <button
                              onClick={handlePrevMonth}
                              title="Tháng trước"
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer text-xs font-bold"
                            >
                              ‹
                            </button>
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            Tháng {calendarMonth + 1} {calendarYear}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handleNextMonth}
                              title="Tháng sau"
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer text-xs font-bold"
                            >
                              ›
                            </button>
                            <button
                              onClick={() => setCalendarYear(calendarYear + 1)}
                              title="Năm sau"
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer text-xs font-bold"
                            >
                              »
                            </button>
                          </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="mb-3.5">
                          {/* Day-of-week Headers */}
                          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-1">
                            <span>Thứ</span>
                            <span>Thứ</span>
                            <span>Thứ</span>
                            <span>Thứ</span>
                            <span>Thứ</span>
                            <span>Thứ</span>
                            <span>CN</span>
                          </div>

                          {/* Days Cells */}
                          <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                            {allCalendarDays.map((item, idx) => {
                              const isToday = item.isCurrent && item.day === 6 && calendarMonth === 10 && calendarYear === 2026;
                              const isSelected = item.isCurrent && item.day === selectedDay;

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    if (item.isCurrent) {
                                      handleSelectCalendarDay(item.day);
                                    }
                                  }}
                                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-md font-medium transition-all cursor-pointer ${
                                    !item.isCurrent
                                      ? "text-slate-300 hover:text-slate-400"
                                      : isSelected
                                      ? "bg-[#0c66e4] text-white font-bold shadow-xs"
                                      : isToday
                                      ? "text-[#0c66e4] font-bold border-b-2 border-[#0c66e4] hover:bg-blue-50"
                                      : "text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  {item.day}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Ngày bắt đầu */}
                        <div className="mb-2.5">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Ngày bắt đầu
                          </label>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={enableStartDate}
                              onChange={(e) => setEnableStartDate(e.target.checked)}
                              size="small"
                              sx={{
                                padding: "2px",
                                color: "#94a3b8",
                                "&.Mui-checked": { color: "#0c66e4" },
                              }}
                            />
                            <input
                              type="text"
                              disabled={!enableStartDate}
                              placeholder="N/T/NNNN"
                              value={startDateStr}
                              onChange={(e) => setStartDateStr(e.target.value)}
                              className={`flex-1 px-2.5 py-1.5 border rounded-md text-xs outline-none transition-colors ${
                                enableStartDate
                                  ? "bg-white border-slate-300 text-slate-800 focus:border-[#0c66e4]"
                                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Ngày hết hạn */}
                        <div className="mb-2.5">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Ngày hết hạn
                          </label>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={enableDueDate}
                              onChange={(e) => setEnableDueDate(e.target.checked)}
                              size="small"
                              sx={{
                                padding: "2px",
                                color: "#94a3b8",
                                "&.Mui-checked": { color: "#0c66e4" },
                              }}
                            />
                            <input
                              type="text"
                              disabled={!enableDueDate}
                              value={dueDateInputStr}
                              onChange={(e) => {
                                setDueDateInputStr(e.target.value);
                                const parts = e.target.value.split("/");
                                if (parts.length >= 2) {
                                  const dd = String(parts[0]).padStart(2, "0");
                                  const mm = String(parts[1]).padStart(2, "0");
                                  setCustomDueDate(`${dd} Th${mm}`);
                                }
                              }}
                              className={`w-28 px-2.5 py-1.5 border rounded-md text-xs outline-none transition-colors ${
                                enableDueDate
                                  ? "bg-white border-slate-300 text-slate-800 focus:border-[#0c66e4]"
                                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              }`}
                            />
                            <div className="relative flex-1">
                              <select
                                disabled={!enableDueDate}
                                value={dueTimeStr}
                                onChange={(e) => setDueTimeStr(e.target.value)}
                                className={`w-full px-2.5 py-1.5 border rounded-md text-xs outline-none appearance-none transition-colors cursor-pointer ${
                                  enableDueDate
                                    ? "bg-white border-slate-300 text-slate-800 focus:border-[#0c66e4]"
                                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                              >
                                {["09:00", "12:00", "14:23", "17:00", "18:00", "23:59"].map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Định kỳ */}
                        <div className="mb-2.5">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Định kỳ
                          </label>
                          <div className="relative">
                            <select
                              value={repeatOption}
                              onChange={(e) => setRepeatOption(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs outline-none bg-white text-slate-800 focus:border-[#0c66e4] appearance-none cursor-pointer"
                            >
                              <option value="Không bao giờ">Không bao giờ</option>
                              <option value="Hàng ngày">Hàng ngày</option>
                              <option value="Hàng tuần">Hàng tuần</option>
                              <option value="Hàng tháng">Hàng tháng</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Thiết lập Nhắc nhở */}
                        <div className="mb-2.5">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Thiết lập Nhắc nhở
                          </label>
                          <div className="relative">
                            <select
                              value={reminderOption}
                              onChange={(e) => setReminderOption(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs outline-none bg-white text-slate-800 focus:border-[#0c66e4] appearance-none cursor-pointer"
                            >
                              <option value="Không có">Không có</option>
                              <option value="Tại thời điểm hết hạn">Tại thời điểm hết hạn</option>
                              <option value="5 Phút trước">5 Phút trước</option>
                              <option value="15 Phút trước">15 Phút trước</option>
                              <option value="1 Giờ trước">1 Giờ trước</option>
                              <option value="2 Giờ trước">2 Giờ trước</option>
                              <option value="1 Ngày trước">1 Ngày trước</option>
                              <option value="2 Ngày trước">2 Ngày trước</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                            Nhắc nhở sẽ được gửi đến tất cả các thành viên và người theo dõi thẻ này.
                          </p>
                        </div>

                        {/* Action Buttons: Lưu & Gỡ bỏ */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleSaveTrelloDate}
                            className="w-full py-2 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSetDueDate("");
                              setMenuAnchorRect(null);
                            }}
                            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                          >
                            Gỡ bỏ
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BoardDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
          Đang tải dữ liệu bảng công việc...
        </div>
      }
    >
      <BoardContent />
    </Suspense>
  );
}
