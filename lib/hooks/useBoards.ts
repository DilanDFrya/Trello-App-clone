"use client";

import { useUser } from "@clerk/nextjs";
import {
  boardDataService,
  boardService,
  columnService,
  taskService,
} from "../services";
import { useCallback, useEffect, useState } from "react";
import { Board, ColumnWithTasks, Task } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useBoards() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsWithTaskCount, setBoardsWithTaskCount] = useState<
    (Board & { taskCount: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoards = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getBoards(supabase!, user.id);
      setBoards(data);

      // Also load boards with task count
      const dataWithTaskCount = await boardDataService.getBoardsWithTaskCount(
        supabase!,
        user.id
      );
      setBoardsWithTaskCount(dataWithTaskCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      loadBoards();
    }
  }, [user, loadBoards]);

  async function createBoard(boardData: {
    titel: string;
    description?: string;
    color?: string;
  }) {
    if (!user) throw new Error("User not Authenticated");

    setLoading(true);
    try {
      const newBoard = await boardDataService.createBoardWithDefaultColumn(
        supabase!,
        {
          ...boardData,
          userId: user.id,
        }
      );
      setBoards((prev) => [newBoard, ...prev]);
      setBoardsWithTaskCount((prev) => [
        { ...newBoard, taskCount: 0 },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create board.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBoard(boardId: string) {
    if (!user) throw new Error("User not authenticated");

    try {
      await boardService.deleteBoard(supabase!, boardId);
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
      setBoardsWithTaskCount((prev) =>
        prev.filter((board) => board.id !== boardId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete board.");
    }
  }

  return {
    boards,
    boardsWithTaskCount,
    loading,
    error,
    createBoard,
    deleteBoard,
  };
}

export function useBoard(boardId: string) {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardDataService.getBoardWithColumns(
        supabase!,
        boardId
      );
      setBoard(data.board);
      setColumns(data.columnsWithTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  }, [boardId, supabase]);

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId, loadBoard]);

  async function updateBoard(boardId: string, updates: Partial<Board>) {
    try {
      const updatedBoard = await boardService.updateBoard(
        supabase!,
        boardId,
        updates
      );
      setBoard(updatedBoard);
      return updatedBoard;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update the board."
      );
    }
  }

  async function createRealTask(
    columnId: string,
    taskData: {
      titel: string;
      description?: string;
      assignee?: string;
      due_date?: string;
      pirority: "low" | "medium" | "high";
    }
  ) {
    try {
      const newTask = await taskService.createTask(supabase!, {
        titel: taskData.titel,
        description: taskData.description || null,
        assignee: taskData.assignee || null,
        due_date: taskData.due_date || null,
        pirority: taskData.pirority || "medium",
        columns_id: columnId,
        sort_order:
          columns.find((column) => column.id === columnId)?.tasks.length || 0,
      });
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? { ...column, tasks: [...column.tasks, newTask] }
            : column
        )
      );
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setLoading(false);
    }
  }

  async function moveTask(
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) {
    try {
      await taskService.moveTask(supabase!, taskId, newColumnId, newOrder);
      setColumns((prev) => {
        const newColumns = [...prev];
        //find and remove the task from the old column
        let taskToMove: Task | null = null;
        for (const col of newColumns) {
          const taskIndex = col.tasks.findIndex((task) => task.id === taskId);
          if (taskIndex !== -1) {
            taskToMove = col.tasks[taskIndex];
            col.tasks.splice(taskIndex, 1);
            break;
          }
        }

        if (taskToMove) {
          // add the task to the new column
          const targetColumn = newColumns.find((col) => col.id === newColumnId);
          if (targetColumn) {
            targetColumn.tasks.splice(newOrder, 0, taskToMove);
          }
        }
        return newColumns;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move task.");
    } finally {
      setLoading(false);
    }
  }

  async function createColumn(title: string) {
    if (!board || !user) throw new Error("Board not Loaded");
    try {
      const newColumn = await columnService.createColumn(supabase!, {
        titel: title,
        board_id: board.id,
        sort_order: columns.length,
        user_id: user?.id,
      });

      setColumns((prev) => [...prev, { ...newColumn, tasks: [] }]);
      return newColumn;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create column.");
    }
  }

  async function updateColumn(columnId: string, title: string) {
    try {
      const updatedColumn = await columnService.updateColumnTitle(
        supabase!,
        columnId,
        title
      );
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? { ...column, titel: updatedColumn.titel }
            : column
        )
      );
      return updatedColumn;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update column.");
    }
  }

  async function deleteColumn(columnId: string) {
    try {
      await columnService.deleteColumn(supabase!, columnId);
      setColumns((prev) => prev.filter((column) => column.id !== columnId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete column.");
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await taskService.deleteTask(supabase!, taskId);
      setColumns((prev) =>
        prev.map((column) => ({
          ...column,
          tasks: column.tasks.filter((task) => task.id !== taskId),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  }
  return {
    board,
    columns,
    loading,
    error,
    updateBoard,
    createRealTask,
    setColumns,
    moveTask,
    createColumn,
    updateColumn,
    deleteColumn,
    deleteTask,
  };
}
