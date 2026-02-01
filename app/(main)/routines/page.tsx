'use client';

import { useState, useCallback } from 'react';
import { Calendar, Plus, Trash2, RefreshCw, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoutine, type RoutineClass, type CreateClassRequest, type CreateRoutineRequest } from './_lib';
import {
  WeeklyTimetable,
  EmptyState,
  ClassFormModal,
  CreateRoutineModal,
  DeleteConfirmationDialog,
} from './_components';

export default function RoutinesPage() {
  const {
    routine,
    isLoading,
    isSyncing,
    error,
    createRoutine,
    deleteRoutine,
    addClass,
    updateClass,
    deleteClass,
    clearError,
  } = useRoutine();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isDeleteRoutineDialogOpen, setIsDeleteRoutineDialogOpen] = useState(false);
  const [isDeleteClassDialogOpen, setIsDeleteClassDialogOpen] = useState(false);
  
  // Selected class for editing/deleting
  const [selectedClass, setSelectedClass] = useState<RoutineClass | null>(null);

  // Handlers
  const handleCreateRoutine = useCallback(async (data: CreateRoutineRequest) => {
    const success = await createRoutine(data);
    if (success) {
      setIsCreateModalOpen(false);
    }
  }, [createRoutine]);

  const handleDeleteRoutine = useCallback(async () => {
    const success = await deleteRoutine();
    if (success) {
      setIsDeleteRoutineDialogOpen(false);
    }
  }, [deleteRoutine]);

  const handleAddClass = useCallback(async (data: CreateClassRequest) => {
    await addClass(data);
    setIsClassModalOpen(false);
    setSelectedClass(null);
  }, [addClass]);

  const handleUpdateClass = useCallback(async (data: CreateClassRequest) => {
    if (!selectedClass) return;
    await updateClass(selectedClass.id, data);
    setIsClassModalOpen(false);
    setSelectedClass(null);
  }, [selectedClass, updateClass]);

  const handleDeleteClass = useCallback(async () => {
    if (!selectedClass) return;
    const success = await deleteClass(selectedClass.id);
    if (success) {
      setIsDeleteClassDialogOpen(false);
      setSelectedClass(null);
    }
  }, [selectedClass, deleteClass]);

  const handleEditClass = useCallback((classItem: RoutineClass) => {
    setSelectedClass(classItem);
    setIsClassModalOpen(true);
  }, []);

  const handleDeleteClassClick = useCallback((classItem: RoutineClass) => {
    setSelectedClass(classItem);
    setIsDeleteClassDialogOpen(true);
  }, []);

  const openAddClassModal = useCallback(() => {
    setSelectedClass(null);
    setIsClassModalOpen(true);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {routine?.title || 'Class Schedule'}
                </h1>
                {routine && (
                  <p className="text-xs text-muted-foreground">
                    {routine.classes.length} class{routine.classes.length !== 1 ? 'es' : ''} this week
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Sync indicator */}
              {isSyncing && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Syncing with Google Calendar...</span>
                  <span className="sm:hidden">Syncing...</span>
                </div>
              )}

              {routine && (
                <>
                  <button
                    onClick={openAddClassModal}
                    disabled={isSyncing}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                      isSyncing
                        ? "bg-primary/50 text-primary-foreground/70 cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground theme-shadow"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Class</span>
                  </button>

                  <button
                    onClick={() => setIsDeleteRoutineDialogOpen(true)}
                    disabled={isSyncing}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete schedule"
                    title="Delete entire schedule"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={clearError}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {!routine ? (
            <EmptyState onCreateSchedule={() => setIsCreateModalOpen(true)} />
          ) : routine.classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-muted mb-6">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No Classes Yet
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Your schedule is empty. Add your first class to get started.
              </p>
              <button
                onClick={openAddClassModal}
                disabled={isSyncing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors theme-shadow disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                Add Your First Class
              </button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <WeeklyTimetable
                classes={routine.classes}
                onEditClass={handleEditClass}
                onDeleteClass={handleDeleteClassClick}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateRoutineModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoutine}
        isLoading={isSyncing}
      />

      <ClassFormModal
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false);
          setSelectedClass(null);
        }}
        onSubmit={selectedClass ? handleUpdateClass : handleAddClass}
        initialData={selectedClass}
        isLoading={isSyncing}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteRoutineDialogOpen}
        title="Delete Schedule?"
        description="This will remove all classes from your schedule."
        itemName={routine?.title || 'Class Schedule'}
        isDeleting={isSyncing}
        onConfirm={handleDeleteRoutine}
        onCancel={() => setIsDeleteRoutineDialogOpen(false)}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteClassDialogOpen}
        title="Delete Class?"
        description="This class will be removed from your schedule."
        itemName={selectedClass?.course_name || 'Class'}
        isDeleting={isSyncing}
        onConfirm={handleDeleteClass}
        onCancel={() => {
          setIsDeleteClassDialogOpen(false);
          setSelectedClass(null);
        }}
      />
    </div>
  );
}
