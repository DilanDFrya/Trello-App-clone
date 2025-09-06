
export interface Board{
    id:string;
    titel:string;
    description:string | null;
    color:string;
    user_id:string;
    created_at:string;
    update_at:string;
}

export interface Column{
    id:string;
    board_id:string;
    titel:string;
    sort_order:number;
    created_at:string;
    user_id:string;
}

export type ColumnWithTasks = Column & {
    tasks: Task[];
}

export interface Task{
    id:string;
    columns_id:string;
    titel:string;
    description:string | null;
    assignee:string | null;
    due_date:string | null;
    pirority:"low" | "medium" | "high";
    sort_order:number;
    created_at:string;
    
}