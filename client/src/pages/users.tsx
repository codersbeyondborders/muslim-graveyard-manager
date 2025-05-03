import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

// User interface
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function Users() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  
  // Simulated user data - in production this would come from an API
  const users: User[] = [
    {
      id: 1,
      name: "Admin User",
      email: "admin@intizamia-sonwar.org",
      role: "Administrator",
      status: "active",
      createdAt: "2025-01-01"
    },
    {
      id: 2,
      name: "Fund Collector",
      email: "collector@intizamia-sonwar.org",
      role: "Staff",
      status: "active",
      createdAt: "2025-01-05"
    },
    {
      id: 3,
      name: "Data Entry",
      email: "data@intizamia-sonwar.org",
      role: "Data Entry",
      status: "active",
      createdAt: "2025-03-10"
    }
  ];

  // Define table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className={`px-2 py-1 rounded-full text-xs inline-block ${
          row.original.status === "active" 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {row.original.status === "active" ? "Active" : "Inactive"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEditUser(row.original.id)}
          >
            <span className="material-icons text-sm mr-1">edit</span>
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeleteUser(row.original.id)}
          >
            <span className="material-icons text-sm mr-1">delete</span>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleAddUser = () => {
    setIsAddUserOpen(true);
  };

  const handleEditUser = (userId: number) => {
    toast({
      title: "Edit User",
      description: `Editing user with ID: ${userId}`,
    });
  };

  const handleDeleteUser = (userId: number) => {
    toast({
      title: "Delete User",
      description: `User with ID: ${userId} would be deleted`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage system users and permissions
              </CardDescription>
            </div>
            <Button className="mt-4 sm:mt-0" onClick={() => setLocation("/users/add")}>
              <span className="material-icons text-sm mr-2">add</span>
              Add New User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input 
              placeholder="Search users..."
              className="max-w-md"
            />
          </div>
          <DataTable
            columns={columns}
            data={users}
            searchColumn="name"
            searchPlaceholder="Search by name..."
          />
        </CardContent>
      </Card>
    </div>
  );
}