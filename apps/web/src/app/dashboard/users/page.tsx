'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UsersDataTable } from '@/components/dashboard/users-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Search, Filter, Download, Users } from 'lucide-react';

// Mock data - in real app this would come from API
const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'USER' as const,
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    role: 'ADMIN' as const,
    isEmailVerified: true,
    isTwoFactorEnabled: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    role: 'MODERATOR' as const,
    isEmailVerified: false,
    isTwoFactorEnabled: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    role: 'USER' as const,
    isEmailVerified: true,
    isTwoFactorEnabled: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@example.com',
    role: 'USER' as const,
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-15'),
  },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = [
    {
      title: 'Total Users',
      value: mockUsers.length.toString(),
      description: 'All registered users',
      icon: Users,
    },
    {
      title: 'Verified Users',
      value: mockUsers.filter((u) => u.isEmailVerified).length.toString(),
      description: 'Email verified',
      icon: Users,
    },
    {
      title: '2FA Enabled',
      value: mockUsers.filter((u) => u.isTwoFactorEnabled).length.toString(),
      description: 'Two-factor authentication',
      icon: Users,
    },
    {
      title: 'Admins',
      value: mockUsers.filter((u) => u.role === 'ADMIN').length.toString(),
      description: 'Administrator accounts',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage your application users and their permissions.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Search, filter, and manage user accounts
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {selectedUsers.length > 0 && (
                <Button variant="destructive" size="sm">
                  Delete Selected ({selectedUsers.length})
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          <UsersDataTable
            data={filteredUsers}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
