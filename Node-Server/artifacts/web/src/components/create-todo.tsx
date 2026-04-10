import { useState } from "react";
import { useCreateTodo, getListTodosQueryKey, getGetTodoStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CreateTodo() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const createMutation = useCreateTodo({
    mutation: {
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setExpanded(false);
        toast.success("Task created");
        queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodoStatsQueryKey() });
      },
      onError: () => toast.error("Failed to create task")
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({
      data: {
        title: title.trim(),
        description: description.trim() || null,
        priority
      }
    });
  };

  if (!expanded) {
    return (
      <button 
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-primary/30 text-primary/70 bg-primary/5 hover:bg-primary/10 transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        <span>Create new task...</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-xl border border-primary/20 bg-card shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-lg">New Task</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2" onClick={() => setExpanded(false)} type="button">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <Input 
          autoFocus
          placeholder="What needs to be done?" 
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="text-base font-medium placeholder:font-normal h-12 bg-transparent border-t-0 border-x-0 rounded-none border-b-2 border-primary focus-visible:ring-0 px-0"
        />

        <Textarea 
          placeholder="Add details (optional)" 
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="resize-none h-20 bg-secondary/30"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Priority:</span>
            <Select value={priority} onValueChange={(v: "low"|"medium"|"high") => setPriority(v)}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || createMutation.isPending} className="min-w-[100px]">
              {createMutation.isPending ? "Saving..." : "Save Task"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
