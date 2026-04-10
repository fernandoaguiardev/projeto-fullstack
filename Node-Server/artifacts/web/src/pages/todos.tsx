import { useState } from "react";
import { useListTodos, getListTodosQueryKey } from "@workspace/api-client-react";
import TodoItem from "@/components/todo-item";
import CreateTodo from "@/components/create-todo";
import { ListTodo, Filter } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

type FilterStatus = "all" | "pending" | "completed";

export default function TodosPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const { data: todos, isLoading } = useListTodos(
    { status: filter },
    { query: { queryKey: getListTodosQueryKey({ status: filter }) } }
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">All Tasks</h1>
            <p className="text-muted-foreground">Manage and organize your workload.</p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
            <Filter className="w-4 h-4 text-muted-foreground ml-2" />
            <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as FilterStatus)}>
              <ToggleGroupItem value="all" className="h-8 px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="pending" className="h-8 px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
                Pending
              </ToggleGroupItem>
              <ToggleGroupItem value="completed" className="h-8 px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
                Completed
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <CreateTodo />

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-xl bg-card flex gap-4">
                <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))
          ) : todos?.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border bg-card/30">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <ListTodo className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-xl mb-2">No tasks found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {filter === "all" 
                  ? "Your task list is empty. Create one above to get started."
                  : `You have no ${filter} tasks at the moment.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 animate-in fade-in duration-300">
              {todos?.map(todo => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
