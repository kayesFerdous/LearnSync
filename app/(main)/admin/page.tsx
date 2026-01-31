'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Shield,
  Crown,
  Mail,
  Calendar,
  AlertCircle,
  X,
  RefreshCw,
  UserX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getUsers, 
  deleteUser, 
  type User, 
  type SortByField, 
  type SortOrder,
  AdminApiError 
} from '@/lib/api/admin';

export default function AdminPage() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  
  // Search & Sort
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortByField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUsers({
        skip: page * limit,
        limit,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      
      setUsers(response.users);
      setTotal(response.total);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.detail);
      } else {
        setError('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0); // Reset to first page on search
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle sort
  const handleSort = (field: SortByField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(0);
  };

  // Handle delete
  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.user_id);
      await fetchUsers();
      closeDeleteDialog();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.detail);
      } else {
        setError('Failed to delete user');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination helpers
  const totalPages = Math.ceil(total / limit);
  const canGoBack = page > 0;
  const canGoForward = page < totalPages - 1;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const SortIcon = ({ field }: { field: SortByField }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Admin Panel</h1>
              <p className="text-muted-foreground text-sm">Manage users and permissions</p>
            </div>
          </div>
          
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 border border-border theme-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-5 border border-border theme-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.is_admin).length}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-5 border border-border theme-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.subscribed).length}
                </p>
                <p className="text-sm text-muted-foreground">Subscribed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(0);
            }}
            className="px-4 py-2.5 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border theme-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('username')}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      User
                      <SortIcon field="username" />
                    </button>
                  </th>
                  <th className="text-left p-4 hidden md:table-cell">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      Email
                      <SortIcon field="email" />
                    </button>
                  </th>
                  <th className="text-left p-4 hidden lg:table-cell">
                    <span className="text-sm font-semibold text-foreground">Status</span>
                  </th>
                  <th className="text-left p-4 hidden xl:table-cell">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      Created
                      <SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="text-right p-4">
                    <span className="text-sm font-semibold text-foreground">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted" />
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-3 w-16 bg-muted rounded md:hidden" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="h-4 w-40 bg-muted rounded" />
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-muted rounded-full" />
                        </div>
                      </td>
                      <td className="p-4 hidden xl:table-cell">
                        <div className="h-4 w-32 bg-muted rounded" />
                      </td>
                      <td className="p-4">
                        <div className="h-8 w-8 bg-muted rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-muted">
                          <UserX className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-foreground">No users found</p>
                          <p className="text-sm text-muted-foreground">
                            {search ? 'Try adjusting your search terms' : 'No users have been created yet'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // User rows
                  users.map((user) => (
                    <tr 
                      key={user.user_id} 
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                            user.is_admin 
                              ? "bg-amber-500/10 text-amber-500 ring-2 ring-amber-500/20" 
                              : "bg-primary/10 text-primary"
                          )}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">{user.username}</p>
                              {user.is_admin && (
                                <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-2">
                          {user.is_admin && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              Admin
                            </span>
                          )}
                          {user.subscribed ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Subscribed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              Free
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden xl:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => openDeleteDialog(user)}
                            disabled={user.is_admin}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              user.is_admin 
                                ? "text-muted-foreground/50 cursor-not-allowed" 
                                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            )}
                            title={user.is_admin ? "Cannot delete admin users" : "Delete user"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{page * limit + 1}</span> to{' '}
                <span className="font-medium text-foreground">{Math.min((page + 1) * limit, total)}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span> users
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={!canGoBack}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    canGoBack
                      ? "bg-card border border-border hover:bg-accent text-foreground"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (page < 2) {
                      pageNum = i;
                    } else if (page > totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "h-9 w-9 rounded-lg text-sm font-medium transition-colors",
                          page === pageNum
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border hover:bg-accent text-foreground"
                        )}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!canGoForward}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    canGoForward
                      ? "bg-card border border-border hover:bg-accent text-foreground"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && userToDelete && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeDeleteDialog}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-md mx-4 rounded-2xl bg-card border border-border theme-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-description"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-border/50">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-red-500/10">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 id="delete-dialog-title" className="text-lg font-semibold text-foreground">
                      Delete User?
                    </h2>
                    <p id="delete-dialog-description" className="text-sm text-muted-foreground mt-1">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDeleteDialog}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {userToDelete.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{userToDelete.username}</p>
                    <p className="text-sm text-muted-foreground truncate">{userToDelete.email}</p>
                  </div>
                </div>
                
                <p className="mt-4 text-sm text-muted-foreground">
                  All data associated with this user will be permanently removed, including their conversations, courses, and settings.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50">
                <button
                  onClick={closeDeleteDialog}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
