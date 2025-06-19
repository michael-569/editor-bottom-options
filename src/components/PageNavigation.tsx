"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const initialPages = ["Info", "Details", "Other", "Ending"];

// Type definitions for props
interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

interface SortablePageProps {
  id: string;
  children: React.ReactNode;
}

function useOutsideClick(ref: React.RefObject<HTMLDivElement>, handler: () => void) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, handler]);
}

function ContextMenu({ open, onClose, onAction }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null!);
  useOutsideClick(ref, onClose);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute z-50 mt-2 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 text-sm animate-fade-in"
    >
      <div className="px-4 pt-2 pb-2 font-semibold text-gray-700">Settings</div>
      <button
        className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 text-black"
        onClick={() => {
          onAction("setFirst");
          onClose();
        }}
      >
        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3.75A.75.75 0 014.5 3v14a.75.75 0 01-1.5 0v-13.25zM5 4.5h10.25a.75.75 0 01.53 1.28l-2.22 2.22a.25.25 0 000 .35l2.22 2.22a.75.75 0 01-.53 1.28H5V4.5z"/></svg>
        Set as first page
      </button>
      <button
        className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 text-black"
        onClick={() => {
          onAction("rename");
          onClose();
        }}
      >
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16.862 5.487a2.25 2.25 0 113.182 3.182l-9.193 9.193a2 2 0 01-.707.464l-3.25 1.083 1.083-3.25a2 2 0 01.464-.707l9.193-9.193z"/><path d="M15.5 7.5l1 1" strokeLinecap="round"/></svg>
        Rename
      </button>
      <button
        className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 text-black"
        onClick={() => {
          onAction("copy");
          onClose();
        }}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="8" y="7" width="8" height="12" rx="2" stroke="currentColor"/>
          <rect x="4" y="3" width="8" height="12" rx="2" stroke="currentColor"/>
          <path d="M12 12v4m0 0l2-2m-2 2l-2-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Copy
      </button>
      <button
        className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 text-black"
        onClick={() => {
          onAction("duplicate");
          onClose();
        }}
      >
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        Duplicate
      </button>
      <div className="border-t border-gray-200 my-2" />
      <button
        className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 text-red-500"
        onClick={() => {
          onAction("delete");
          onClose();
        }}
      >
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Delete
      </button>
    </div>
  );
}

function SortablePage({ id, children }: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center group relative">
      {children}
    </div>
  );
}

const PageNavigation: React.FC = () => {
  const [pages, setPages] = useState(initialPages);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const addPage = (idx: number) => {
    const newPages = [...pages];
    newPages.splice(idx, 0, "Untitled");
    setPages(newPages);
    setActiveIndex(idx);
  };

  const handleMenuAction = (action: string, idx: number) => {
    if (action === "delete") {
      const newPages = pages.filter((_, i) => i !== idx);
      setPages(newPages);
      // Adjust active index if needed
      if (activeIndex === idx) {
        setActiveIndex(Math.max(0, idx - 1));
      } else if (activeIndex > idx) {
        setActiveIndex(activeIndex - 1);
      }
    } else if (action === "setFirst" && idx !== 0) {
      const newPages = [pages[idx], ...pages.slice(0, idx), ...pages.slice(idx + 1)];
      setPages(newPages);
      setActiveIndex(0);
    } else if (action === "duplicate") {
      const newPages = [...pages];
      newPages.splice(idx + 1, 0, pages[idx] + " Copy");
      setPages(newPages);
      setActiveIndex(idx + 1);
    } else if (action === "copy") {
      if (navigator && navigator.clipboard) {
        navigator.clipboard.writeText(pages[idx]);
      }
    } else if (action === "rename") {
      const newName = prompt("Enter new page name:", pages[idx]);
      if (newName && newName.trim() !== "") {
        const newPages = [...pages];
        newPages[idx] = newName.trim();
        setPages(newPages);
      }
    }
    // Other actions can be implemented here
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id !== over.id) {
      return;
    }
    const oldIndex = pages.findIndex((p, i) => `${p}-${i}` === active.id);
    const newIndex = pages.findIndex((p, i) => `${p}-${i}` === over.id);
    const newPages = arrayMove(pages, oldIndex, newIndex);
    setPages(newPages);
    // Update activeIndex if needed
    if (activeIndex === oldIndex) {
      setActiveIndex(newIndex);
    } else if (oldIndex < activeIndex && newIndex >= activeIndex) {
      setActiveIndex(activeIndex - 1);
    } else if (oldIndex > activeIndex && newIndex <= activeIndex) {
      setActiveIndex(activeIndex + 1);
    }
  };

  return (
    <nav className="w-full p-4 bg-gray-50 border rounded-lg mt-8 flex items-center justify-center">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pages.map((p, i) => `${p}-${i}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-2">
            {pages.map((page, idx) => (
              <React.Fragment key={page + "-frag-" + idx}>
                <SortablePage id={`${page}-${idx}`}>
                  {/* Add button between pages (on hover) */}
                  {idx !== 0 && (
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-blue-100 hover:text-blue-600 mx-1"
                      onClick={() => addPage(idx)}
                      aria-label="Add page"
                      type="button"
                    >
                      +
                    </button>
                  )}
                  <div className="relative flex items-center">
                    <button
                      className={`flex items-center px-4 py-2 rounded-full border transition-colors duration-150 text-sm font-medium select-none
                        ${
                          idx === activeIndex
                            ? "bg-white border-blue-500 text-blue-600 shadow"
                            : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-white hover:border-blue-300"
                        }
                      `}
                      onClick={() => setActiveIndex(idx)}
                      type="button"
                    >
                      {page}
                    </button>
                    {/* Three dots menu */}
                    <button
                      className="ml-1 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 focus:outline-none"
                      onClick={() => setMenuOpenIdx(idx)}
                      type="button"
                      tabIndex={-1}
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>
                    </button>
                    <ContextMenu
                      open={menuOpenIdx === idx}
                      onClose={() => setMenuOpenIdx(null)}
                      onAction={(action: string) => handleMenuAction(action, idx)}
                    />
                  </div>
                </SortablePage>
              </React.Fragment>
            ))}
            {/* Add button at the end */}
            <button
              className="w-auto h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-blue-100 hover:text-blue-600 px-3 ml-2"
              onClick={() => addPage(pages.length)}
              aria-label="Add page at end"
              type="button"
            >
              + Add page
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </nav>
  );
};

export default PageNavigation; 