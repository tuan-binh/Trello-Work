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

// --- TYPES ---
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

export interface CommentItem {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CardItem {
  id: string;
  title: string;
  description?: string;
  labels: LabelItem[];
  checklistTotal?: number;
  checklistDone?: number;
  checklistItems?: ChecklistItem[];
  commentsCount?: number;
  comments?: CommentItem[];
  dueDate?: string;
  members: string[];
}

export interface ListItem {
  id: string;
  title: string;
  cards: CardItem[];
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

const INITIAL_BOARDS_MAP: Record<string, BoardData> = {
  "1": {
    id: "1",
    title: "Dự Án Phát Triển Trello Work 🚀",
    workspace: "Không gian làm việc chính",
    bgGradient: "from-blue-600 via-indigo-600 to-sky-700",
    isStarred: true,
    lists: [
      {
        id: "l1",
        title: "Cần làm (To Do)",
        cards: [
          {
            id: "c1",
            title: "Tích hợp Spring Security với JWT Authentication",
            description: "Bảo vệ các endpoint với filter JWT và cấp access token.",
            labels: [
              { id: "b1", name: "Backend", color: "bg-blue-500 text-white" },
              { id: "b2", name: "High", color: "bg-red-500 text-white" },
            ],
            checklistTotal: 4,
            checklistDone: 2,
            commentsCount: 3,
            dueDate: "10 Th11",
            members: ["B", "N"],
          },
          {
            id: "c2",
            title: "Cấu hình Flyway migration & MySQL Database",
            labels: [{ id: "b3", name: "Database", color: "bg-purple-500 text-white" }],
            checklistTotal: 2,
            checklistDone: 2,
            members: ["B"],
          },
        ],
      },
      {
        id: "l2",
        title: "Đang thực hiện (In Progress)",
        cards: [
          {
            id: "c3",
            title: "Thiết kế giao diện Trello Board View (Next.js + Tailwind)",
            description: "Gồm thanh board header, các cột danh sách thẻ và kéo thả.",
            labels: [
              { id: "f1", name: "Frontend", color: "bg-emerald-500 text-white" },
              { id: "f2", name: "UI/UX", color: "bg-pink-500 text-white" },
            ],
            checklistTotal: 5,
            checklistDone: 4,
            commentsCount: 6,
            dueDate: "06 Th11",
            members: ["A", "B"],
          },
        ],
      },
      {
        id: "l3",
        title: "Kiểm thử (QA / Review)",
        cards: [
          {
            id: "c4",
            title: "Test API Login & Register với Postman và SSL https://api.binh.cloud",
            labels: [{ id: "t1", name: "QA", color: "bg-amber-500 text-white" }],
            commentsCount: 2,
            members: ["T"],
          },
        ],
      },
      {
        id: "l4",
        title: "Hoàn thành (Done) 🎉",
        cards: [
          {
            id: "c5",
            title: "Cấu hình Docker Compose và Nginx Reverse Proxy",
            labels: [{ id: "d1", name: "DevOps", color: "bg-slate-700 text-white" }],
            checklistTotal: 3,
            checklistDone: 3,
            checklistItems: [
              { id: "ci1", text: "Viết Dockerfile cho Backend Spring Boot", done: true },
              { id: "ci2", text: "Cấu hình docker-compose.yml kết nối MySQL", done: true },
              { id: "ci3", text: "Thiết lập Nginx reverse proxy SSL", done: true },
            ],
            commentsCount: 1,
            comments: [
              { id: "cm1", author: "B", text: "Đã test chạy mượt mà trên server Ubuntu", createdAt: "Vừa xong" }
            ],
            members: ["B"],
          },
          {
            id: "c6",
            title: "Khởi tạo repo GitHub & CI/CD pipeline",
            description: "Thiết lập kho lưu trữ GitHub và cấu hình GitHub Actions cho tự động build test.",
            labels: [{ id: "d2", name: "DevOps", color: "bg-slate-700 text-white" }],
            checklistTotal: 2,
            checklistDone: 1,
            checklistItems: [
              { id: "ci4", text: "Phân tích yêu cầu và dựng layout", done: true },
              { id: "ci5", text: "Viết API kết nối CSDL và xử lý lỗi", done: false },
            ],
            commentsCount: 0,
            comments: [],
            members: ["B"],
          },
        ],
      },
    ],
  },
};

// --- CARD PRESENTATIONAL VIEW ---
function CardView({
  card,
  listTitle,
  onClick,
  isOverlay = false,
}: {
  card: CardItem;
  listTitle?: string;
  onClick?: () => void;
  isOverlay?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow-xs hover:shadow-md border border-slate-200 hover:border-slate-300 transition-all text-slate-800 ${
        isOverlay ? "cursor-grabbing shadow-xl" : "cursor-grab active:cursor-grabbing group"
      }`}
    >
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
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
      <h4 className="text-sm font-medium text-slate-800 leading-snug break-words">
        {card.title}
      </h4>

      {/* Badges / Metrics */}
      <div className="mt-3 flex items-center justify-between text-slate-500 text-xs">
        <div className="flex items-center gap-2.5">
          {card.dueDate && (
            <span className="flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {card.dueDate}
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
  );
}

// --- SORTABLE CARD COMPONENT ---
function SortableCard({
  card,
  listTitle,
  onSelect,
  activeCardHeight,
}: {
  card: CardItem;
  listTitle: string;
  onSelect: (card: CardItem, listTitle: string) => void;
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

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <CardView
        card={card}
        listTitle={listTitle}
        onClick={() => onSelect(card, listTitle)}
      />
    </div>
  );
}

// --- SORTABLE LIST COLUMN COMPONENT ---
function SortableColumn({
  list,
  onSelectCard,
  addingCardListId,
  setAddingCardListId,
  newCardTitle,
  setNewCardTitle,
  onAddCard,
  activeCardHeight,
}: {
  list: ListItem;
  onSelectCard: (card: CardItem, listTitle: string) => void;
  addingCardListId: string | null;
  setAddingCardListId: (id: string | null) => void;
  newCardTitle: string;
  setNewCardTitle: (t: string) => void;
  onAddCard: (listId: string) => void;
  activeCardHeight?: number;
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
          <button className="hover:bg-slate-200 p-1 rounded-md transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
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

  const [board, setBoard] = useState<BoardData>(() => {
    if (INITIAL_BOARDS_MAP[boardId]) {
      return INITIAL_BOARDS_MAP[boardId];
    }
    return {
      id: boardId,
      title: "Bảng Công Việc Mới 📋",
      workspace: "Không gian làm việc chính",
      bgGradient: "from-blue-600 via-indigo-600 to-sky-700",
      isStarred: false,
      lists: [
        { id: "l1", title: "Cần làm", cards: [] },
        { id: "l2", title: "Đang làm", cards: [] },
        { id: "l3", title: "Hoàn thành", cards: [] },
      ],
    };
  });

  useEffect(() => {
    // 1. Kiểm tra trong localStorage xem bảng vừa tạo hoặc đã lưu có không
    try {
      const customBoardsStr = localStorage.getItem("trello_custom_boards");
      if (customBoardsStr) {
        const customBoards = JSON.parse(customBoardsStr);
        const found = customBoards.find((b: any) => b.id === boardId);
        if (found) {
          setBoard({
            id: found.id,
            title: found.title,
            workspace: found.workspace || "Không gian làm việc chính",
            bgGradient: found.bgGradient,
            bgImage: found.bgImage,
            isStarred: found.starred || false,
            lists: [
              { id: "l1", title: "Cần làm (To Do)", cards: [] },
              { id: "l2", title: "Đang thực hiện (In Progress)", cards: [] },
              { id: "l3", title: "Hoàn thành (Done) 🎉", cards: [] },
            ],
          });
          return;
        }
      }
    } catch {}

    if (boardId && INITIAL_BOARDS_MAP[boardId]) {
      setBoard(INITIAL_BOARDS_MAP[boardId]);
    }

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
  const [cardModalMenu, setCardModalMenu] = useState<"members" | "labels" | "checklist" | "dueDate" | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const [customDueDate, setCustomDueDate] = useState("");
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

  // Đồng bộ draft khi mở selectedCard
  useEffect(() => {
    if (selectedCard) {
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
    }
  }, [selectedCard?.card.id]);

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
    updateCurrentCard((c) => ({
      ...c,
      description: cardDescriptionDraft.trim(),
    }));
    setIsEditingDescription(false);
  };

  // 2. Thêm checklist item
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim() || !selectedCard) return;
    const newItem: ChecklistItem = {
      id: "ci_" + Date.now(),
      text: newChecklistText.trim(),
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
    setNewChecklistText("");
    setIsAddingChecklistItem(false);
  };

  // 3. Toggle checklist item
  const handleToggleChecklistItem = (itemId: string) => {
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
  };

  // 5. Thêm bình luận
  const handleAddComment = () => {
    if (!newCommentText.trim() || !selectedCard) return;
    const newComment: CommentItem = {
      id: "cm_" + Date.now(),
      author: "B",
      text: newCommentText.trim(),
      createdAt: "Vừa xong",
    };
    updateCurrentCard((c) => {
      const comments = [...(c.comments || []), newComment];
      return {
        ...c,
        comments,
        commentsCount: comments.length,
      };
    });
    setNewCommentText("");
  };

  // 6. Toggle thành viên trên thẻ
  const handleToggleCardMember = (member: string) => {
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
    updateCurrentCard((c) => ({
      ...c,
      dueDate: dateStr.trim() ? dateStr : undefined,
    }));
    setCardModalMenu(null);
  };

  // 9. Lưu trữ / Xóa thẻ
  const handleArchiveCard = () => {
    if (!selectedCard) return;
    const cardId = selectedCard.card.id;
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => ({
        ...l,
        cards: l.cards.filter((c) => c.id !== cardId),
      })),
    }));
    setSelectedCard(null);
  };

  // --- FILTER STATES (Trello Style Filter) ---
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

  // Filtered Lists & Cards
  const displayLists = useMemo(() => {
    if (activeFiltersCount === 0) {
      return board.lists;
    }

    return board.lists.map((l) => ({
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

    // Đối với kéo Card:
    // 1. Tìm xem pointer có nằm bên trong thẻ/cột nào không
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      // Ưu tiên va chạm với Card trước
      const cardCollision = pointerCollisions.find((c) => c.data?.current?.type === "Card");
      if (cardCollision) {
        return [cardCollision];
      }
      return pointerCollisions;
    }

    // 2. Nếu pointer không va chạm trực tiếp, dùng rectIntersection với ưu tiên Card
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      const cardCollision = rectCollisions.find((c) => c.data?.current?.type === "Card");
      if (cardCollision) {
        return [cardCollision];
      }
      return rectCollisions;
    }

    // 3. Fallback dùng closestCorners
    return closestCorners(args);
  };

  // Handlers
  const handleAddCard = (listId: string) => {
    if (!newCardTitle.trim()) return;

    const newCard: CardItem = {
      id: "c_" + Date.now(),
      title: newCardTitle.trim(),
      labels: [{ id: "l_def", name: "Task", color: "bg-blue-500 text-white" }],
      members: ["B"],
    };

    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((l) =>
        l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l
      ),
    }));

    setNewCardTitle("");
    setAddingCardListId(null);
  };

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const newList: ListItem = {
      id: "l_" + Date.now(),
      title: newListTitle.trim(),
      cards: [],
    };

    setBoard((prev) => ({
      ...prev,
      lists: [...prev.lists, newList],
    }));

    setNewListTitle("");
    setIsAddingList(false);
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
          l.cards.some((c) => c.id === activeId)
        );
        const overListIndex = prev.lists.findIndex((l) =>
          l.cards.some((c) => c.id === overId)
        );

        if (activeListIndex === -1 || overListIndex === -1) return prev;

        const activeList = prev.lists[activeListIndex];
        const overList = prev.lists[overListIndex];

        const activeCardIndex = activeList.cards.findIndex((c) => c.id === activeId);
        const overCardIndex = overList.cards.findIndex((c) => c.id === overId);

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
          l.cards.some((c) => c.id === activeId)
        );
        const overListIndex = prev.lists.findIndex((l) => l.id === overId);

        if (activeListIndex === -1 || overListIndex === -1) return prev;
        if (activeListIndex === overListIndex) return prev;

        const activeList = prev.lists[activeListIndex];
        const overList = prev.lists[overListIndex];

        const activeCardIndex = activeList.cards.findIndex((c) => c.id === activeId);
        const activeCards = [...activeList.cards];
        const [movedCard] = activeCards.splice(activeCardIndex, 1);

        // Tính toán vị trí thả vào cột dựa theo tọa độ con trỏ/thẻ kéo
        // Nếu overList đã có cards, kiểm tra xem đang kéo ở nửa trên hay nửa dưới cột
        let newIndex = overList.cards.length;
        if (overList.cards.length > 0 && over.rect) {
          const overTop = over.rect.top;
          const overBottom = over.rect.bottom;
          const activeCurrentTop =
            active.rect.current.translated?.top ?? active.rect.current.initial?.top;
          if (activeCurrentTop !== undefined) {
            // Nếu vị trí thẻ đang kéo gần đỉnh cột hơn đáy cột, chèn lên đầu hoặc giữa
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
        const oldIndex = prev.lists.findIndex((l) => l.id === activeId);
        const newIndex = prev.lists.findIndex((l) => l.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        return {
          ...prev,
          lists: arrayMove(prev.lists, oldIndex, newIndex),
        };
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
            onClick={() => setBoard({ ...board, isStarred: !board.isStarred })}
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
          <div className="flex items-center -space-x-1.5">
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center border-2 border-slate-900 shadow-xs">
              B
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center border-2 border-slate-900 shadow-xs">
              N
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center border-2 border-slate-900 shadow-xs">
              T
            </div>
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

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0c66e4] hover:bg-blue-50 rounded-md text-xs font-bold transition-all shadow-sm cursor-pointer">
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
                addingCardListId={addingCardListId}
                setAddingCardListId={setAddingCardListId}
                newCardTitle={newCardTitle}
                setNewCardTitle={setNewCardTitle}
                onAddCard={handleAddCard}
                activeCardHeight={activeCardHeight}
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

      {/* 4. TRELLO CARD DETAIL MODAL */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f1f2f4] rounded-2xl max-w-5xl w-full min-h-[500px] sm:min-h-[560px] max-h-[95vh] overflow-y-auto no-scrollbar p-6 sm:p-7 pb-10 relative shadow-2xl border border-slate-300 text-slate-800 cursor-default"
          >
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

                  {selectedCard.card.dueDate && (
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Ngày hết hạn
                      </h5>
                      <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{selectedCard.card.dueDate}</span>
                        <button
                          onClick={() => handleSetDueDate("")}
                          title="Xóa ngày hết hạn"
                          className="ml-1 text-slate-400 hover:text-red-500 cursor-pointer font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
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

                {/* Activity & Comments */}
                <div>
                  <div className="flex items-center gap-2 mb-3 font-bold text-sm text-slate-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Hoạt động & Bình luận
                  </div>

                  {/* New comment input */}
                  <div className="flex gap-2.5 items-start mb-4">
                    <span className="w-7 h-7 rounded-full bg-[#0c66e4] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      B
                    </span>
                    <div className="flex-1 flex flex-col gap-2.5">
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
                      {newCommentText.trim() && (
                        <div className="pt-0.5">
                          <button
                            onClick={handleAddComment}
                            className="px-3 py-1.5 bg-[#0c66e4] hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                          >
                            Lưu bình luận
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments list */}
                  <div className="space-y-3">
                    {(selectedCard.card.comments || []).map((cm) => (
                      <div key={cm.id} className="flex gap-2.5 items-start">
                        <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          {cm.author}
                        </span>
                        <div className="flex-1 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">
                              Thành viên {cm.author}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {cm.createdAt}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed break-words">
                            {cm.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      onClick={handleArchiveCard}
                      className="w-full flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Lưu trữ (Archive)
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
                  className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 select-none overflow-hidden max-h-[88vh] flex flex-col"
                >
                  {/* --- SUBMENU 1: THÀNH VIÊN (CHUẨN TRELLO INTERFACE) --- */}
                  {cardModalMenu === "members" && (() => {
                    const boardMembersList = [
                      { id: "B", name: "P.T. Bình", initials: "PB", color: "bg-[#00a3bf] text-white" },
                      { id: "N", name: "Minh Chu Dinh", initials: "MD", color: "bg-[#0c66e4] text-white" },
                      { id: "T", name: "Tuấn Trần", initials: "TT", color: "bg-[#e56910] text-white" },
                      { id: "A", name: "Anh Nguyễn", initials: "AN", color: "bg-[#1f845a] text-white" },
                    ];

                    const filteredMembers = boardMembersList.filter((m) =>
                      memberSearchQuery
                        ? m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          m.initials.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          m.id.toLowerCase().includes(memberSearchQuery.toLowerCase())
                        : true
                    );

                    return (
                      <div className="w-80 sm:w-[320px] p-4 flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="text-center font-bold text-sm text-slate-800 pb-2 mb-3 border-b border-slate-100 relative">
                          <span>Thành viên</span>
                          <button
                            onClick={() => {
                              setCardModalMenu(null);
                              setMenuAnchorRect(null);
                              setMemberSearchQuery("");
                            }}
                            className="absolute right-0 top-0 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Search Input (Border xanh Trello khi focus) */}
                        <div className="mb-3">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Tìm kiếm các thành viên"
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 focus:border-[#0c66e4] focus:bg-white text-slate-800 text-xs px-3 py-2 rounded-lg outline-none placeholder-slate-400 transition-colors shadow-inner"
                          />
                        </div>

                        {/* Section Header: Thành viên của bảng */}
                        <div className="mb-1.5 text-[11px] font-bold text-slate-500">
                          Thành viên của bảng
                        </div>

                        {/* Members List */}
                        <div className="space-y-1 overflow-y-auto pr-1 no-scrollbar flex-1 max-h-72">
                          {filteredMembers.length > 0 ? (
                            filteredMembers.map((m) => {
                              const isAdded = selectedCard.card.members.includes(m.id);
                              return (
                                <div
                                  key={m.id}
                                  onClick={() => handleToggleCardMember(m.id)}
                                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                    isAdded
                                      ? "bg-blue-50/80 hover:bg-blue-100/70"
                                      : "hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 shadow-xs ${m.color}`}
                                    >
                                      {m.initials}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800 truncate">
                                      {m.name}
                                    </span>
                                  </div>
                                  {isAdded ? (
                                    <span className="text-[#0c66e4] font-bold text-sm pr-1">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 text-xs pr-1 group-hover:text-slate-400">
                                      +
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-4 text-center text-xs text-slate-400 italic">
                              Không tìm thấy thành viên phù hợp
                            </div>
                          )}
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
