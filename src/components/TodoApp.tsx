"use client";

import React, { useState, useEffect } from "react";
import { useClientSide } from "@/hooks/useClientSide";
import {
  Container,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import {
  DndContext,
  DragOverEvent,
  useSensors,
  useSensor,
  PointerSensor,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// Types
interface Todo {
  id: string;
  text: string;
  status: Status;
  createdAt: string;
}

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

// Card statuses
const STATUSES = ["Todo", "In Progress", "Done"] as const;
type Status = (typeof STATUSES)[number];

// Draggable Todo Item Component
const TodoItem: React.FC<TodoItemProps> = ({ todo, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: todo.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Paper ref={setNodeRef} style={style} className="p-3 mb-2 hover:bg-gray-50">
      <div
        className="flex justify-between items-start"
        {...attributes}
        {...listeners}
      >
        <div className="flex-grow cursor-grab">
          <Typography className="font-medium">{todo.text}</Typography>
          <Typography variant="caption" className="text-gray-500">
            {new Date(todo.createdAt).toLocaleDateString()}
          </Typography>
        </div>
        <div className="flex space-x-1 ml-2">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(todo);
            }}
          >
            <EditIcon fontSize="small" color="primary" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(todo.id);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </div>
      </div>
    </Paper>
  );
};

// Column Component
const Column: React.FC<{
  status: Status;
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}> = ({ status, todos, onEdit, onDelete }) => {
  const { setNodeRef } = useSortable({
    id: status,
    data: {
      type: "container",
      status,
    },
  });

  return (
    <Grid item xs={12} md={4}>
      <Paper
        ref={setNodeRef}
        className="p-4"
        sx={{
          minHeight: "200px",
          backgroundColor:
            status === "Done"
              ? "#f0f7f0"
              : status === "In Progress"
              ? "#fff7e6"
              : "#ffffff",
        }}
      >
        <Typography variant="h6" className="mb-3">
          {status} ({todos.length})
        </Typography>
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </Paper>
    </Grid>
  );
};

// Main App Component
const TodoApp: React.FC = () => {
  const isClient = useClientSide();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/todos");
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      console.error("Failed to fetch todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchTodos();
    }
  }, [isClient]);

  const handleAddTodo = async () => {
    if (!inputText.trim()) return;

    try {
      setError(null);
      if (editingTodo) {
        const response = await fetch("/api/todos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTodo.id,
            text: inputText.trim(),
            status: editingTodo.status,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update todo");
        }

        const updatedTodo = await response.json();
        setTodos(
          todos.map((todo) => (todo.id === editingTodo.id ? updatedTodo : todo))
        );
      } else {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText.trim(),
            status: "Todo",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create todo");
        }

        const newTodo = await response.json();
        setTodos((prevTodos) => [...prevTodos, newTodo]);
      }

      setInputText("");
      setOpen(false);
      setEditingTodo(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      console.error("Failed to save todo:", error);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setInputText(todo.text);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setTodoToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (todoToDelete) {
      try {
        setError(null);
        const response = await fetch(`/api/todos?id=${todoToDelete}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete todo");
        }

        setTodos((prevTodos) =>
          prevTodos.filter((todo) => todo.id !== todoToDelete)
        );
        setDeleteConfirmOpen(false);
        setTodoToDelete(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Failed to delete todo:", error);
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isValidColumn = STATUSES.includes(overId as Status);

    if (isValidColumn) {
      try {
        setError(null);
        const todoToUpdate = todos.find((todo) => todo.id === activeId);
        if (!todoToUpdate) return;

        const response = await fetch("/api/todos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeId,
            text: todoToUpdate.text,
            status: overId as Status,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update todo status");
        }

        const updatedTodo = await response.json();
        setTodos((currentTodos) =>
          currentTodos.map((todo) =>
            todo.id === activeId ? updatedTodo : todo
          )
        );
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Failed to update todo status:", error);
      }
    }
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTodo(null);
    setInputText("");
  };

  if (!isClient) {
    return (
      <Container maxWidth="lg" className="mt-8">
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" className="mt-8">
        <Typography>Loading todos...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="mt-8">
      {error && (
        <Paper className="p-4 mb-4 bg-red-50">
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        className="mb-4"
      >
        Add Todo
      </Button>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={3}>
          {STATUSES.map((status) => (
            <SortableContext
              key={status}
              id={status}
              items={todos.filter((t) => t.status === status).map((t) => t.id)}
            >
              <Column
                status={status}
                todos={todos.filter((t) => t.status === status)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </SortableContext>
          ))}
        </Grid>

        <DragOverlay>
          {activeId && (
            <Paper className="p-3">
              <Typography>
                {todos.find((t) => t.id === activeId)?.text}
              </Typography>
            </Paper>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingTodo ? "Edit Todo" : "Add Todo"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Todo Text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddTodo} variant="contained">
            {editingTodo ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this todo?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TodoApp;
