'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Mail,
  MailCheck,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { UserRole } from '@repo/types';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UsersDataTableProps {
  data: User[];
  selectedUsers: string[];
  onSelectionChange: (selected: string[]) => void;
}

interface EditingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export function UsersDataTable({
  data,
  selectedUsers,
  onSelectionChange,
}: UsersDataTableProps) {
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'USER' as UserRole,
  });
  const { toast } = useToast();

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((user) => user.id));
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  };

  const handleSaveEdit = () => {
    // In real app, this would call API
    toast({
      title: 'User updated',
      description: `${editingUser?.firstName} ${editingUser?.lastName} has been updated.`,
    });
    setEditingUser(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const user = data.find((u) => u.id === userId);
    // In real app, this would call API
    toast({
      title: 'User deleted',
      description: `${user?.firstName} ${user?.lastName} has been deleted.`,
      variant: 'destructive',
    });
  };

  const handleAddUser = () => {
    // In real app, this would call API
    toast({
      title: 'User created',
      description: `${newUser.firstName} ${newUser.lastName} has been created.`,
    });
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      role: 'USER' as UserRole,
    });
    setAddingUser(false);
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      USER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      MODERATOR:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role]}`}
      >
        {role}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Add User Row */}
      {addingUser && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1">
                <div className="h-4 w-4" />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="First Name"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className="h-8"
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Last Name"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className="h-8"
                />
              </div>
              <div className="col-span-3">
                <Input
                  placeholder="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="h-8"
                />
              </div>
              <div className="col-span-2">
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      role: e.target.value as UserRole,
                    }))
                  }
                  className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Button size="sm" onClick={handleAddUser}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingUser(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add User Button */}
      {!addingUser && (
        <Button
          variant="outline"
          onClick={() => setAddingUser(true)}
          className="w-full border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 items-center p-4 bg-muted/50 rounded-lg font-medium text-sm">
        <div className="col-span-1">
          <input
            type="checkbox"
            checked={selectedUsers.length === data.length && data.length > 0}
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
        <div className="col-span-2">First Name</div>
        <div className="col-span-2">Last Name</div>
        <div className="col-span-3">Email</div>
        <div className="col-span-2">Role</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-2">
        {data.map((user) => (
          <Card key={user.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              {editingUser?.id === user.id ? (
                // Edit Mode
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={editingUser.firstName}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev ? { ...prev, firstName: e.target.value } : null,
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={editingUser.lastName}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev ? { ...prev, lastName: e.target.value } : null,
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={editingUser.email}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev ? { ...prev, email: e.target.value } : null,
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev
                            ? { ...prev, role: e.target.value as UserRole }
                            : null,
                        )
                      }
                      className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="USER">User</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex items-center space-x-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <div className="col-span-2 font-medium">{user.firstName}</div>
                  <div className="col-span-2 font-medium">{user.lastName}</div>
                  <div className="col-span-3 text-muted-foreground">
                    {user.email}
                  </div>
                  <div className="col-span-2">{getRoleBadge(user.role)}</div>
                  <div className="col-span-1 flex items-center space-x-1">
                    {user.isEmailVerified ? (
                      <MailCheck
                        className="h-4 w-4 text-green-600"
                        title="Email verified"
                      />
                    ) : (
                      <Mail
                        className="h-4 w-4 text-muted-foreground"
                        title="Email not verified"
                      />
                    )}
                    {user.isTwoFactorEnabled ? (
                      <ShieldCheck
                        className="h-4 w-4 text-green-600"
                        title="2FA enabled"
                      />
                    ) : (
                      <Shield
                        className="h-4 w-4 text-muted-foreground"
                        title="2FA disabled"
                      />
                    )}
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info Row */}
              <div className="mt-2 pt-2 border-t grid grid-cols-12 gap-4 text-xs text-muted-foreground">
                <div className="col-span-1" />
                <div className="col-span-6">
                  ID: {user.id} • Created: {formatDate(user.createdAt)} •
                  Updated: {formatDate(user.updatedAt)}
                </div>
                <div className="col-span-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users found.</p>
        </div>
      )}
    </div>
  );
}
