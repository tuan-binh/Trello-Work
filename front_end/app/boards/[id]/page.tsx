"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
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

// --- TYPES ---
export interface LabelItem {
  id: string;
  name: string;
  color: string;
}

export interface CardItem {
  id: string;
  title: string;
  description?: string;
  labels: LabelItem[];
  checklistTotal?: number;
  checklistDone?: number;
  commentsCount?: number;
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
  bgGradient: string;
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
            commentsCount: 1,
            members: ["B"],
          },
          {
            id: "c6",
            title: "Khởi tạo repo GitHub & CI/CD pipeline",
            labels: [{ id: "d2", name: "DevOps", color: "bg-slate-700 text-white" }],
            members: ["B"],
          },
        ],
      },
    ],
  },
};

// --- SORTABLE CARD COMPONENT ---
function SortableCard({
  card,
  listTitle,
  onSelect,
}: {
  card: CardItem;
  listTitle: string;
  onSelect: (card: CardItem, listTitle: string) => void;
}) {
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
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-40 bg-slate-300 rounded-lg p-3 min-h-[85px] border-2 border-dashed border-slate-500"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(card, listTitle)}
      className="bg-white rounded-lg p-3 shadow-xs hover:shadow-md border border-slate-200 hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group touch-none"
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

// --- SORTABLE LIST COLUMN COMPONENT ---
function SortableColumn({
  list,
  onSelectCard,
  addingCardListId,
  setAddingCardListId,
  newCardTitle,
  setNewCardTitle,
  onAddCard,
}: {
  list: ListItem;
  onSelectCard: (card: CardItem, listTitle: string) => void;
  addingCardListId: string | null;
  setAddingCardListId: (id: string | null) => void;
  newCardTitle: string;
  setNewCardTitle: (t: string) => void;
  onAddCard: (listId: string) => void;
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

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-72 shrink-0 bg-black/20 border-2 border-dashed border-white/70 rounded-xl h-[450px] shadow-inner transition-all"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
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
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Card Footer */}
      <div className="p-2 pt-1">
        {addingCardListId === list.id ? (
          <div className="space-y-2 animate-in fade-in duration-100">
            <textarea
              autoFocus
              rows={2}
              placeholder="Nhập tiêu đề cho thẻ này..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onAddCard(list.id);
                }
              }}
              className="w-full bg-white p-2.5 rounded-lg border border-blue-500 shadow-sm text-sm focus:outline-none resize-none text-slate-800"
            />
            <div className="flex items-center gap-2">
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
    return (
      INITIAL_BOARDS_MAP[boardId] || {
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
      }
    );
  });

  useEffect(() => {
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [boardId]);

  // States
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const [activeColumn, setActiveColumn] = useState<ListItem | null>(null);
  const [activeCard, setActiveCard] = useState<CardItem | null>(null);

  const [selectedCard, setSelectedCard] = useState<{
    card: CardItem;
    listTitle: string;
  } | null>(null);

  // --- FILTER STATES (Trello Style Filter) ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

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
    (filterKeyword ? 1 : 0) + selectedLabels.length + selectedMembers.length;

  const clearAllFilters = () => {
    setFilterKeyword("");
    setSelectedLabels([]);
    setSelectedMembers([]);
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
    if (!filterKeyword && selectedLabels.length === 0 && selectedMembers.length === 0) {
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

        // Labels match
        if (selectedLabels.length > 0) {
          const hasLabel = c.labels?.some((lb) => selectedLabels.includes(lb.name));
          if (!hasLabel) return false;
        }

        // Members match
        if (selectedMembers.length > 0) {
          const hasMember = c.members?.some((m) => selectedMembers.includes(m));
          if (!hasMember) return false;
        }

        return true;
      }),
    }));
  }, [board.lists, filterKeyword, selectedLabels, selectedMembers]);

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

        const overCards = [...overList.cards, movedCard];

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
      className={`h-screen max-h-screen bg-gradient-to-br ${board.bgGradient} flex flex-col font-sans select-none overflow-hidden`}
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
          <div className="relative">
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

            {/* FILTER DROPDOWN POPUP (Trello Standard Popover) */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                    <svg className="w-4 h-4 text-[#0c66e4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Bộ lọc thẻ
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                  {/* Keyword search */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Từ khóa
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Tìm thẻ theo tên hoặc mô tả..."
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0c66e4]"
                      />
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Members Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Thành viên
                    </label>
                    <div className="space-y-1.5">
                      {allBoardMembers.map((m) => {
                        const checked = selectedMembers.includes(m);
                        return (
                          <div
                            key={m}
                            onClick={() => toggleFilterMember(m)}
                            className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-[#0c66e4]"
                            />
                            <span className="w-6 h-6 rounded-full bg-[#0c66e4] text-white text-[11px] font-bold flex items-center justify-center">
                              {m}
                            </span>
                            <span className="text-xs font-medium text-slate-700">
                              Thành viên {m}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Labels Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Nhãn (Labels)
                    </label>
                    <div className="space-y-1.5">
                      {allBoardLabels.map((lb) => {
                        const checked = selectedLabels.includes(lb.name);
                        return (
                          <div
                            key={lb.id}
                            onClick={() => toggleFilterLabel(lb.name)}
                            className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-[#0c66e4]"
                            />
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-md flex-1 ${lb.color}`}
                            >
                              {lb.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reset Button */}
                  {activeFiltersCount > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">
                        Đang áp dụng {activeFiltersCount} bộ lọc
                      </span>
                      <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  )}
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
      <DndContext
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
              />
            ))}
          </SortableContext>

          {/* ADD NEW LIST COLUMN */}
          <div className="w-72 shrink-0">
            {isAddingList ? (
              <form
                onSubmit={handleAddList}
                className="bg-[#f1f2f4] p-3 rounded-xl shadow-md space-y-2 animate-in fade-in"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Nhập tiêu đề danh sách..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full bg-white px-3 py-2 rounded-lg border border-blue-500 text-sm focus:outline-none text-slate-800"
                />
                <div className="flex items-center gap-2">
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
            <div className="w-72 bg-[#f1f2f4] rounded-xl p-3 shadow-2xl border-2 border-blue-400 rotate-2 opacity-95">
              <h3 className="font-semibold text-sm text-slate-800">
                {activeColumn.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                {activeColumn.cards.length} thẻ
              </p>
            </div>
          )}

          {activeCard && (
            <div className="w-68 bg-white rounded-lg p-3 shadow-2xl border-2 border-[#0c66e4] rotate-3 opacity-95">
              {activeCard.labels && activeCard.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {activeCard.labels.map((lb) => (
                    <span
                      key={lb.id}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${lb.color}`}
                    >
                      {lb.name}
                    </span>
                  ))}
                </div>
              )}
              <h4 className="text-sm font-medium text-slate-800 leading-snug">
                {activeCard.title}
              </h4>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 4. TRELLO CARD DETAIL MODAL */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f1f2f4] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl border border-slate-300 text-slate-800 cursor-default"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer"
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
                {/* Labels & Members Info */}
                <div className="flex flex-wrap gap-4">
                  {selectedCard.card.members && (
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Thành viên
                      </h5>
                      <div className="flex items-center gap-1.5">
                        {selectedCard.card.members.map((m, idx) => (
                          <span
                            key={idx}
                            className="w-7 h-7 rounded-full bg-[#0c66e4] text-white text-xs font-bold flex items-center justify-center shadow-xs"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCard.card.labels && selectedCard.card.labels.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Nhãn (Labels)
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCard.card.labels.map((lb) => (
                          <span
                            key={lb.id}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md ${lb.color}`}
                          >
                            {lb.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Mô tả chi tiết
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-sm text-slate-700 min-h-[80px]">
                    {selectedCard.card.description ||
                      "Chưa có mô tả cụ thể cho thẻ này. Nhấp để thêm chi tiết..."}
                  </div>
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
                    <span className="text-xs font-semibold text-slate-500">
                      {Math.round(
                        ((selectedCard.card.checklistDone || 0) /
                          (selectedCard.card.checklistTotal || 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
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
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#0c66e4]" />
                      <span className="line-through text-slate-400">Phân tích yêu cầu và dựng layout</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input type="checkbox" className="w-4 h-4 rounded text-[#0c66e4]" />
                      <span>Viết API kết nối CSDL và xử lý lỗi</span>
                    </div>
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
                  <div className="flex gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#0c66e4] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      B
                    </span>
                    <input
                      type="text"
                      placeholder="Viết bình luận..."
                      className="flex-1 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0c66e4]"
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar Action Buttons */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Thêm vào thẻ
                  </h5>
                  <div className="space-y-1.5">
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Thành viên
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Nhãn
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Việc cần làm
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
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
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Lưu trữ (Archive)
                    </button>
                  </div>
                </div>
              </div>
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
