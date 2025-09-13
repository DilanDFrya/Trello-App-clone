"use client";

import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBoard } from "@/lib/hooks/useBoards";
import { ColumnWithTasks, Task } from "@/lib/supabase/models";
import {
  Calendar,
  MoreHorizontal,
  Plus,
  Trash2,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Drop indicator component
function DropIndicator({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center py-2">
      <div className="w-full h-0.5 bg-blue-500"></div>
    </div>
  );
}

function DroppableColumn({
  column,
  children,
  onCreateTask,
  onEditColumn,
  onDeleteColumn,
}: {
  column: ColumnWithTasks;
  children: React.ReactNode;
  onCreateTask: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onEditColumn: (column: ColumnWithTasks) => void;
  onDeleteColumn: (columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-full lg:flex-shrink-0 lg:w-80 transition-all duration-200 ${
        isOver ? "bg-blue-50/50 rounded-lg p-1" : ""
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${
          isOver
            ? "ring-2 ring-blue-400 ring-opacity-60 border-blue-300 shadow-lg shadow-blue-200/50 transform scale-[1.02]"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {/* column header */}
        <div className="p-3 sm:p-4 border-b ">
          <div className="flex items-center justify-between ">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                {column.titel}
              </h3>
              <Badge variant={"secondary"} className="text-xs flex-shrink-0">
                {column.tasks.length}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"ghost"}
                  size={"sm"}
                  className=" flex-shrink-0 "
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditColumn(column)}>
                  Edit Column
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteColumn(column.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* column content */}
        <div className="p-2 min-h-[200px] flex flex-col">
          {children}
          <Dialog>
            <DialogTrigger asChild></DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <p className="text-sm text-gray-600">
                  Create a new task for the board.
                </p>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onCreateTask}>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    id="titel"
                    name="titel"
                    placeholder="Enter task title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter task description..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Input
                    id="assignee"
                    name="assignee"
                    placeholder="Enter task assignee..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority..." />
                      </SelectTrigger>
                      <SelectContent>
                        {["low", "medium", "high"].map((priority, key) => (
                          <SelectItem key={key} value={priority}>
                            {priority.charAt(0).toUpperCase() +
                              priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" id="dueDate" name="dueDate" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function SortableTask({
  task,
  onDeleteTask,
}: {
  task: Task;
  onDeleteTask: (taskId: string) => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transition,
    isDragging,
    transform,
  } = useSortable({ id: task.id });
  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none" as const,
    userSelect: "none" as const,
    WebkitUserDrag: "none" as const,
  };

  function getPriorityColor(priority: "low" | "medium" | "high"): string {
    switch (priority) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  }

  return (
    <div ref={setNodeRef} style={styles} {...attributes} {...listeners}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow group">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {/* task header */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
                {task.titel}
              </h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* task description */}
            <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
              {task.description || "No description"}
            </p>
            {/* task meta */}
            <div className="flex items-center justify-between ">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                {task.assignee && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span className="truncate">{task.assignee}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span className="truncate"> {task.due_date}</span>
                  </div>
                )}
              </div>
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(
                  task.pirority
                )}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskOverlay({ task }: { task: Task }) {
  function getPriorityColor(priority: "low" | "medium" | "high"): string {
    switch (priority) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* task header */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
              {task.titel}
            </h4>
          </div>

          {/* task description */}
          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
            {task.description || "No description"}
          </p>
          {/* task meta */}
          <div className="flex items-center justify-between ">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              {task.assignee && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span className="truncate">{task.assignee}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate"> {task.due_date}</span>
                </div>
              )}
            </div>
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(
                task.pirority
              )}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom collision detection that allows task reordering but prioritizes columns for cross-column drops
function customCollisionDetection(
  args: Parameters<typeof rectIntersection>[0]
) {
  const { droppableContainers, active } = args;

  // First check for task intersections (for same-column reordering)
  const taskIntersections = rectIntersection({
    ...args,
    droppableContainers: droppableContainers.filter(
      (container) => container.data?.current?.type !== "column"
    ),
  });

  // If we have task intersections, check if they're in the same column as the active task
  if (taskIntersections.length > 0) {
    const activeTaskColumnId = droppableContainers.find(
      (container) => container.id === active.id
    )?.data?.current?.sortable?.containerId;

    const sameColumnTasks = taskIntersections.filter((intersection) => {
      const taskColumnId = droppableContainers.find(
        (container) => container.id === intersection.id
      )?.data?.current?.sortable?.containerId;
      return taskColumnId === activeTaskColumnId;
    });

    // If we have same-column tasks, prioritize them for reordering
    if (sameColumnTasks.length > 0) {
      return sameColumnTasks;
    }
  }

  // Check for column intersections (for cross-column drops)
  const columnIntersections = rectIntersection({
    ...args,
    droppableContainers: droppableContainers.filter(
      (container) => container.data?.current?.type === "column"
    ),
  });

  if (columnIntersections.length > 0) {
    return columnIntersections;
  }

  // Fall back to all task intersections
  if (taskIntersections.length > 0) {
    return taskIntersections;
  }

  // Final fallback to closest center
  return closestCenter(args);
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const {
    board,
    updateBoard,
    createColumn,
    columns,
    createRealTask,
    setColumns,
    moveTask,
    updateColumn,
    deleteColumn,
    deleteTask,
  } = useBoard(id);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [newColumnTitel, setNewColumnTitel] = useState("");

  const [editingColumnTitel, setEditingColumnTitel] = useState("");
  const [editingColumn, setEditingColumn] = useState<ColumnWithTasks | null>(
    null
  );

  const [filters, setFilters] = useState({
    priority: [] as string[],
    assignee: [] as string[],
    dueDate: null as string | null,
  });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dropPosition, setDropPosition] = useState<{
    columnId: string;
    index: number;
  } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  function handleFilterChange(
    type: "priority" | "assignee" | "dueDate",
    value: string | string[] | null
  ) {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      priority: [] as string[],
      assignee: [] as string[],
      dueDate: null as string | null,
    });
  }

  // Initialize sensors with stable configuration for desktop and mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Scroll functions for mobile
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  // Show/hide scroll button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollButton(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleUpdateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !board) return;

    try {
      await updateBoard(board.id, {
        titel: newTitle.trim(),
        color: newColor || board.color,
      });
      setIsEditingTitle(false);
    } catch {}
  }

  async function createTask(taskData: {
    titel: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    priority: "low" | "medium" | "high";
  }) {
    const targetColumn = columns[0];
    if (!targetColumn) {
      throw new Error("No column found");
    }
    await createRealTask(targetColumn.id, {
      titel: taskData.titel,
      description: taskData.description,
      assignee: taskData.assignee,
      due_date: taskData.dueDate, // Convert dueDate to due_date
      pirority: taskData.priority as "low" | "medium" | "high",
    });
  }

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const taskData = {
      titel: formData.get("titel") as string,
      description: (formData.get("description") as string) || undefined,
      assignee: (formData.get("assignee") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      priority:
        (formData.get("priority") as "low" | "medium" | "high") || "medium",
    };
    if (taskData.titel.trim()) {
      await createTask(taskData);

      const trigger = document.querySelector(
        '[data-state="open"]'
      ) as HTMLButtonElement;
      if (trigger) {
        trigger.click();
      }
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = event.active.id as string;
    const task = columns
      .flatMap((col) => col.tasks)
      .find((task) => task.id === taskId);

    if (task) {
      setActiveTask(task);
    }
    setDropPosition(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setDropPosition(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === activeId)
    );

    // Check if we're hovering over a task
    const targetColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === overId)
    );

    // Check if we're hovering over a column directly
    const directTargetColumn = columns.find((col) => col.id === overId);

    const finalTargetColumn = targetColumn || directTargetColumn;

    if (!sourceColumn) {
      setDropPosition(null);
      return;
    }

    if (sourceColumn.id === finalTargetColumn?.id) {
      // Same column logic
      if (targetColumn) {
        const activeIndex = sourceColumn.tasks.findIndex(
          (task) => task.id === activeId
        );

        const overIndex = targetColumn.tasks.findIndex(
          (task) => task.id === overId
        );

        // Set drop position for visual indicator
        if (activeIndex !== overIndex) {
          setDropPosition({
            columnId: sourceColumn.id,
            index: overIndex > activeIndex ? overIndex + 1 : overIndex,
          });
        } else {
          setDropPosition(null);
        }

        if (activeIndex !== overIndex) {
          setColumns((prev: ColumnWithTasks[]) => {
            const newColumns = [...prev];
            const column = newColumns.find((col) => col.id === sourceColumn.id);
            if (column) {
              const tasks = [...column.tasks];
              const [removed] = tasks.splice(activeIndex, 1);
              tasks.splice(overIndex, 0, removed);
              column.tasks = tasks;
            }
            return newColumns;
          });
        }
      }
    } else if (finalTargetColumn) {
      // Cross-column logic
      if (targetColumn) {
        // Hovering over a task in another column
        const overIndex = targetColumn.tasks.findIndex(
          (task) => task.id === overId
        );
        setDropPosition({
          columnId: finalTargetColumn.id,
          index: overIndex,
        });
      } else if (directTargetColumn) {
        // Hovering over empty column or column area
        setDropPosition({
          columnId: directTargetColumn.id,
          index: directTargetColumn.tasks.length,
        });
      }
    } else {
      setDropPosition(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDropPosition(null); // Clear drop position
    setActiveTask(null); // Clear active task
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((col) => col.id === overId);

    if (targetColumn) {
      const sourceColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId)
      );

      if (sourceColumn && sourceColumn.id !== targetColumn.id) {
        await moveTask(taskId, targetColumn.id, targetColumn.tasks.length);
      }
    } else {
      //chech to see if were droping on another thask
      const sourceColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId)
      );
      const targetColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === overId)
      );
      if (sourceColumn && targetColumn) {
        const oldIndex = sourceColumn.tasks.findIndex(
          (task) => task.id === taskId
        );

        const newIndex = targetColumn.tasks.findIndex(
          (task) => task.id === overId
        );
        if (oldIndex !== newIndex) {
          await moveTask(taskId, targetColumn.id, newIndex);
        }
      }
    }
  }

  async function handleCreateColumn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newColumnTitel.trim()) return;
    await createColumn(newColumnTitel.trim());
    setIsCreatingColumn(false);
    setNewColumnTitel("");
  }

  async function handleUpdateColumn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingColumnTitel.trim() || !editingColumn) return;
    await updateColumn(editingColumn.id, editingColumnTitel.trim());

    setEditingColumnTitel("");
    setIsEditingColumn(false);
    setEditingColumn(null);
  }

  function handleEditColumn(column: ColumnWithTasks) {
    setIsEditingColumn(true);
    setEditingColumnTitel(column.titel);
    setEditingColumn(column);
  }

  async function handleDeleteColumn(columnId: string) {
    if (
      confirm(
        "Are you sure you want to delete this column? All tasks in this column will also be deleted."
      )
    ) {
      await deleteColumn(columnId);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  }

  const filteredColumns = columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => {
      //filter by priority
      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(task.pirority)
      ) {
        return false;
      }

      //filter by due date
      if (filters.dueDate && task.due_date) {
        const taskDate = new Date(task.due_date).toDateString();
        const filterDate = new Date(filters.dueDate).toDateString();
        if (taskDate !== filterDate) {
          return false;
        }
      }

      return true;
    }),
  }));

  const totalTasks = columns.reduce(
    (acc, column) => acc + column.tasks.length,
    0
  );
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <Navbar
          boardTitel={board?.titel}
          onEditBoard={() => {
            setNewTitle(board?.titel ?? "");
            setNewColor(board?.color ?? "");
            setIsEditingTitle(true);
          }}
          onFilterClick={() => setIsFilterOpen(true)}
          filterCount={Object.values(filters)
            .flat()
            .reduce(
              (count, v) =>
                count + (Array.isArray(v) ? v.length : v !== null ? 1 : 0),
              0
            )}
        />

        <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
          <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleUpdateBoard}>
              <div className="space-y-2">
                <Label htmlFor="boardTitel">Board Title</Label>
                <Input
                  id="boardTitel"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter board title..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boardColor">Board Color</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    "bg-blue-500",
                    "bg-green-500",
                    "bg-yellow-500",
                    "bg-red-500",
                    "bg-purple-500",
                    "bg-pink-500",
                    "bg-indigo-500",
                    "bg-gray-500",
                    "bg-orange-500",
                    "bg-teal-500",
                    "bg-cyan-500",
                    "bg-emerald-500",
                  ].map((color, key) => (
                    <button
                      key={key}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color} ${
                        color === newColor
                          ? "ring-2 ring-offset-2 ring-gray-900"
                          : ""
                      } inline-block cursor-pointer`}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingTitle(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle>Filter Tasks</DialogTitle>
              <p className="text-sm text-gray-600">
                Filter tasks by priority, assignee, and due date.
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {["low", "medium", "high"].map((priority, key) => (
                    <Button
                      onClick={() => {
                        const newPriority = filters.priority.includes(priority)
                          ? filters.priority.filter((p) => p !== priority)
                          : [...filters.priority, priority];
                        handleFilterChange("priority", newPriority);
                      }}
                      key={key}
                      variant={
                        filters.priority.includes(priority)
                          ? "default"
                          : "outline"
                      }
                      size={"sm"}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={filters.dueDate || ""}
                  onChange={(e) =>
                    handleFilterChange("dueDate", e.target.value || null)
                  }
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant={"outline"}
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsFilterOpen(false);
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* board content */}
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 mb-16 md:mb-8">
          {/* Start */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0 ">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-sm  text-gray-600">
                <span className="font-medium">Total Tasks: </span>
                {totalTasks}
              </div>
            </div>
            {/* add task dialog */}

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus />
                  Add task
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                  <p className="text-sm text-gray-600">
                    Create a new task for the board.
                  </p>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateTask}>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      id="titel"
                      name="titel"
                      placeholder="Enter task title..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Enter task description..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Input
                      id="assignee"
                      name="assignee"
                      placeholder="Enter task assignee..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority..." />
                        </SelectTrigger>
                        <SelectContent>
                          {["low", "medium", "high"].map((priority, key) => (
                            <SelectItem key={key} value={priority}>
                              {priority.charAt(0).toUpperCase() +
                                priority.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" id="dueDate" name="dueDate" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit">Create Task</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {/* board columns */}
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex flex-col lg:flex-row lg:space-x-6 lg:overflow-x-auto 
            lg:pb-6 lg:px-2 lg:-mx-2 lg:[&::-webkit-scrollbar]:h-2 
            lg:[&::-webkit-scrollbar-track]:bg-gray-100 
            lg:[&::-webkit-scrollbar-thumb]:bg-gray-300 lg:[&::-webkit-scrollbar-thumb]:rounded-full 
            space-y-4 lg:space-y-0"
            >
              {filteredColumns.map((column, key) => (
                <DroppableColumn
                  key={key}
                  column={column}
                  onCreateTask={handleCreateTask}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                >
                  <SortableContext
                    items={column.tasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 flex-shrink-0">
                      {column.tasks.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[120px] text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                          <div className="text-center">
                            {/* Drop tasks here */}
                            <div className="mb-1">
                              {totalTasks === 0
                                ? "Create a task"
                                : "Drop tasks here"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        column.tasks.map((task, taskIndex) => (
                          <React.Fragment key={task.id}>
                            <DropIndicator
                              isActive={
                                dropPosition?.columnId === column.id &&
                                dropPosition?.index === taskIndex
                              }
                            />
                            <SortableTask
                              task={task}
                              onDeleteTask={handleDeleteTask}
                            />
                          </React.Fragment>
                        ))
                      )}
                      <DropIndicator
                        isActive={
                          dropPosition?.columnId === column.id &&
                          dropPosition?.index === column.tasks.length
                        }
                      />
                    </div>
                  </SortableContext>
                </DroppableColumn>
              ))}

              <div className="w-full lg:w-80 lg:flex-shrink-0">
                <Button
                  variant={"secondary"}
                  className="w-full h-full min-h-[200px] border-dashed border-2 text-gray-500 hover:text-gray-700 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 ease-out group hover:shadow-md"
                  onClick={() => setIsCreatingColumn(true)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="h-6 w-6 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:text-blue-600" />
                    <span className="transition-all duration-300 ease-out group-hover:text-blue-600 font-medium">
                      Add another list
                    </span>
                  </div>
                </Button>
              </div>

              <DragOverlay>
                {activeTask ? <TaskOverlay task={activeTask} /> : null}
              </DragOverlay>
            </div>
          </DndContext>
        </main>

        {/* Mobile Scroll Button - Only visible on mobile */}
        {showScrollButton && (
          <div className="fixed bottom-6 right-6 z-50 md:hidden">
            <div className="flex flex-col space-y-2">
              <button
                onClick={scrollToTop}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 active:scale-95"
                aria-label="Scroll to top"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                onClick={scrollToBottom}
                className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 active:scale-95"
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isCreatingColumn} onOpenChange={setIsCreatingColumn}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Create a new column to organize your tasks.
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateColumn}>
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                placeholder="Enter column title..."
                value={newColumnTitel}
                onChange={(e) => setNewColumnTitel(e.target.value)}
                required
              />
            </div>
            <div className="space-x-4 flex justify-end">
              <Button
                type="button"
                variant={"outline"}
                onClick={() => setIsCreatingColumn(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Column</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <p className="text-sm text-gray-600">Edit the column title.</p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateColumn}>
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                placeholder="Enter column title..."
                value={editingColumnTitel}
                onChange={(e) => setEditingColumnTitel(e.target.value)}
                required
              />
            </div>
            <div className="space-x-4 flex justify-end">
              <Button
                type="button"
                variant={"outline"}
                onClick={() => {
                  setIsEditingColumn(false);
                  setEditingColumnTitel("");
                  setEditingColumn(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Edit Column</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
