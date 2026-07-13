import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, Role } from '../../services/user.service';
import { ApiService, Reseller } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-management-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './management.html',
  styleUrl: './management.css',
})
export class ManagementView implements OnInit {
  private readonly userService = inject(UserService);
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Tabs layout
  protected readonly tabs = [
    { id: 'Users', label: 'Users' },
    { id: 'Resellers', label: 'Resellers' },
    { id: 'Services', label: 'Services' },
    { id: 'Suppliers', label: 'Suppliers' },
  ];
  protected activeTab = 'Users';

  // Filters & State
  protected searchQuery = '';
  protected isLoading = false;
  protected errorMessage: string | null = null;

  // Pagination State
  protected pageNumber = 0;
  protected pageSize = 5;
  protected readonly pageSizeOptions = [5, 10, 20, 50, 100];
  protected serverTotalElements = 0;
  protected serverTotalPages = 1;

  // Data collections
  protected users: User[] = [];
  protected filteredUsers: User[] = [];
  protected roles: Role[] = [];
  protected resellers: Reseller[] = [];
  protected salaryScales: any[] = [];

  // Modal Dialog Form Controls
  protected isModalOpen = false;
  protected modalTitle = 'Add User';
  protected isEditMode = false;
  protected editingUserId: number | null = null;
  protected saving = false;

  // Form Fields
  protected fullName = '';
  protected email = '';
  protected role = '';
  protected resellerId: number | null = null;
  protected salaryScaleKey = '';

  // Delete Confirmation Dialog Control
  protected isDeleteConfirmOpen = false;
  protected userToDelete: User | null = null;

  ngOnInit(): void {
    this.loadCatalogData();
    this.loadUsers();
  }

  protected get todayLabel(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected setTab(tabId: string): void {
    this.activeTab = tabId;
    this.searchQuery = '';
    this.pageNumber = 0;
    if (tabId === 'Users') {
      this.loadUsers();
    }
  }

  private loadCatalogData(): void {
    this.userService.getRoles().subscribe({
      next: (data) => (this.roles = data),
      error: () => this.toast.showError('Failed to load user roles catalog.'),
    });

    this.apiService.getResellers().subscribe({
      next: (data) => (this.resellers = data),
      error: () => this.toast.showError('Failed to load resellers catalog.'),
    });

    this.userService.getSalaryScales().subscribe({
      next: (data) => (this.salaryScales = data),
      error: () => this.toast.showError('Failed to load salary scales catalog.'),
    });
  }

  protected loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;
    const searchParam = this.searchQuery.trim() ? this.searchQuery.trim() : undefined;
    this.userService.getUsers(this.pageNumber, this.pageSize, searchParam).subscribe({
      next: (page) => {
        this.users = page.content;
        this.filteredUsers = page.content;
        this.serverTotalElements = page.totalElements;
        this.serverTotalPages = page.totalPages;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to load users list.';
        this.toast.showError(this.errorMessage!);
        this.cdr.detectChanges();
      },
    });
  }

  protected applyFilters(): void {
    this.pageNumber = 0;
    this.loadUsers();
  }

  // Pagination Getters and Methods
  protected get totalElements(): number {
    return this.serverTotalElements;
  }

  protected get totalPages(): number {
    return this.serverTotalPages;
  }

  protected get paginatedUsers(): User[] {
    return this.users;
  }

  protected get visiblePages(): number[] {
    if (this.totalPages <= 1) {
      return [0];
    }
    if (this.pageNumber === 0) {
      return [0, 1];
    }
    if (this.pageNumber === this.totalPages - 1) {
      return [this.pageNumber - 1, this.pageNumber];
    }
    return [this.pageNumber, this.pageNumber + 1];
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.pageNumber = page;
    this.loadUsers();
  }

  protected goToFirstPage(): void {
    this.goToPage(0);
  }

  protected goToPreviousPage(): void {
    this.goToPage(this.pageNumber - 1);
  }

  protected goToNextPage(): void {
    this.goToPage(this.pageNumber + 1);
  }

  protected goToLastPage(): void {
    this.goToPage(this.totalPages - 1);
  }

  protected onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSize = value;
    this.pageNumber = 0;
    this.loadUsers();
  }

  // Modal Actions
  protected openAddModal(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.modalTitle = 'Add User';
    
    // Clear inputs
    this.fullName = '';
    this.email = '';
    this.role = '';
    this.resellerId = null;
    this.salaryScaleKey = '';
    
    this.isModalOpen = true;
  }

  protected openEditModal(user: User): void {
    this.isEditMode = true;
    this.editingUserId = user.id || null;
    this.modalTitle = 'Edit User Information';

    this.fullName = user.fullName;
    this.email = user.email;
    this.role = user.role?.code || '';
    this.salaryScaleKey = user.salaryScaleKey || '';
    this.resellerId = user.resellerId || null;

    this.isModalOpen = true;
  }

  protected closeModal(): void {
    this.isModalOpen = false;
  }

  protected isFormValid(): boolean {
    if (!this.fullName.trim() || !this.email.trim() || !this.role) {
      return false;
    }
    if (this.role === 'GUIDE' && !this.salaryScaleKey) {
      return false;
    }
    if (this.role === 'AGENT' && !this.resellerId) {
      return false;
    }
    return true;
  }

  protected saveUser(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.saving = true;
    const payload = {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      role: this.role,
      salaryScaleKey: this.role === 'GUIDE' ? this.salaryScaleKey : undefined,
      resellerId: this.role === 'AGENT' ? Number(this.resellerId) : undefined,
    };

    if (this.isEditMode && this.editingUserId != null) {
      this.userService.updateUser(this.editingUserId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.showSuccess('User updated successfully!');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Failed to update user.';
          this.toast.showError(msg);
        },
      });
    } else {
      this.userService.createUser(payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.showSuccess('User created successfully and password confirmation email sent!');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Failed to create user.';
          this.toast.showError(msg);
        },
      });
    }
  }

  // Delete Action Flow
  protected confirmDelete(user: User): void {
    this.userToDelete = user;
    this.isDeleteConfirmOpen = true;
  }

  protected closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen = false;
    this.userToDelete = null;
  }

  protected deleteUser(): void {
    if (!this.userToDelete || this.userToDelete.id == null) {
      return;
    }

    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.toast.showSuccess('User deleted successfully.');
        this.closeDeleteConfirm();
        this.loadUsers();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to delete user.';
        this.toast.showError(msg);
      },
    });
  }
}
