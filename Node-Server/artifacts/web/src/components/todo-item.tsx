import { format } from "date-fns";
import { Check, Clock, Trash2, Edit2, AlertCircle } from "lucide-react";
import { Todo, useDeleteTodo, useToggleTodo, getListTodosQueryKey, getGetTodoStatsQueryKey, useUpdateTodo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || "");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(todo.priority);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTodoStatsQueryKey() });
  };

  const toggleMutation = useToggleTodo({
    mutation: {
      onSuccess: () => invalidateQueries(),
      onError: () => toast.error("Failed to toggle todo")
    }
  });

  const deleteMutation = useDeleteTodo({
    mutation: {
      onSuccess: () => {
        toast.success("Todo deleted");
        invalidateQueries();
      },
      onError: () => toast.error("Failed to delete todo")
    }
  });

  const updateMutation = useUpdateTodo({
    mutation: {
      onSuccess: () => {
        toast.success("Todo updated");
        setIsEditing(false);
        invalidateQueries();
      },
      onError: () => toast.error("Failed to update todo")
    }
  });

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    updateMutation.mutate({
      id: todo.id,
      data: {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
      }
    });
  };

  const priorityColors = {
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  return (
    <div className={cn(
      "group flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border transition-all duration-200",
      todo.completed ? "bg-secondary/30 border-transparent opacity-70" : "bg-card border-border hover:shadow-sm hover:border-primary/20"
    )}>
      {/* Checkbox / Toggle */}
      <button
        onClick={() => toggleMutation.mutate({ id: todo.id })}
        className={cn(
          "shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors",
          todo.completed 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {todo.completed && <Check className="w-3.5 h-3.5" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={cn(
            "font-semibold text-base truncate",
            todo.completed && "line-through text-muted-foreground"
          )}>
            {todo.title}
          </h3>
          <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider px-2 py-0 h-5 font-semibold", priorityColors[todo.priority])}>
            {todo.priority}
          </Badge>
        </div>
        
        {todo.description && (
          <p className={cn(
            "text-sm text-muted-foreground line-clamp-2 mb-3",
            todo.completed && "line-through"
          )}>
            {todo.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground/70 font-mono mt-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(todo.createdAt), "MMM d, h:mm a")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Edit2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input 
                  id="edit-title" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea 
                  id="edit-desc" 
                  value={editDescription} 
                  onChange={e => setEditDescription(e.target.value)} 
                  className="resize-none h-24"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={editPriority} onValueChange={(v: "low"|"medium"|"high") => setEditPriority(v)}>
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={!editTitle.trim() || updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            if(confirm("Delete this task?")) {
              deleteMutation.mutate({ id: todo.id });
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
