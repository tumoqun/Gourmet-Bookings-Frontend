import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OrderGuestGroup,
  WorkDetailForGuideType,
  WorkDetailType,
  WorkGuide,
  WorkOrderForGuide,
  WorkService,
} from '../../../services/work.service';
import { CommonModule } from '@angular/common';
import { WorkStatusClass } from '../../works/works';
import { Receipt, ReceiptService, UpdateReceiptPayload } from '../../../services/receipt.service';
import { ItineraryService, ItineraryStopItem, ItineraryNote } from '../../../services/itinerary.service';
import { AddReceipt } from '../add-receipt/add-receipt';
import { AddExpense } from '../add-expense/add-expense';
import { AuthService } from '../../../services/auth.service';
import { ReceiptFormData, ReceiptPayload } from '../../../services/receipt.service';
import { ToastService } from '../../../services/toast.service';
import {
  Expense,
  ExpenseForm,
  ExpensePayload,
  ExpenseService,
  UpdateExpensePayload,
} from '../../../services/expense.service';
import { ConfirmDialog } from '../../../components/common/confirm-dialog/confirm-dialog';
import { ApiService, SpecialRequestType, Order } from '../../../services/api.service';

@Component({
  selector: 'app-guide-work-detail',
  imports: [CommonModule, AddReceipt, AddExpense, ConfirmDialog],
  templateUrl: './guide-work-detail.html',
  styleUrl: './guide-work-detail.css',
})
export class GuideWorkDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  openAddReceipt = false;
  openAddExpense = false;
  openConfirmDeleteReceipt = false;
  openConfirmDeleteExpense = false;
  loadingInfo = true;
  loadingGuest = true;
  loadingOrders = true;
  loadingGuides = true;
  loadingItineraries = true;
  loadingReceipts = true;
  loadingOtherExpenses = false;
  workId = Number(this.route.snapshot.paramMap.get('id'));
  workDetail: WorkDetailForGuideType = {} as WorkDetailForGuideType;
  private readonly auth = inject(AuthService);
  readonly currentUser = this.auth.currentUser;
  private readonly toast = inject(ToastService);
  private readonly apiService = inject(ApiService);

  orders: WorkOrderForGuide[] = [];
  guides: WorkGuide[] = [];
  receipts: Receipt[] = [];
  itineraryList: ItineraryStopItem[] = [];
  itineraryNotes: ItineraryNote[] = [];
  showNotesModal = false;
  loadingItineraryNotes = false;
  
  showGroupNotesModal = false;
  selectedOrderForNotes: Order | null = null;
  loadingOrderNotes = false;

  orderGuests: OrderGuestGroup[] = [];
  otherExpenses: Expense[] = [];
  selectedReceiptId: number = 0;
  selectedExpenseId: number = 0;
  expandedGuestGroups = new Set<number>();
  expandedOrderGroups = new Set<number>();
  ordersSectionOpen = false;
  guidesSectionOpen = false;
  itinerarySectionOpen = false;
  receiptsSectionOpen = false;
  expensesSectionOpen = false;
  selectedImageUrl: string | null = null;
  isImageModalOpen = false;

  constructor(
    private workService: WorkService,
    private itinerariesService: ItineraryService,
    private receiptService: ReceiptService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.getWorkDetail(Number(this.workId)),
      this.getWorkOrdersForGuide(Number(this.workId)),
      this.getWorkGuides(Number(this.workId)),
      this.getReceiptsByWork(Number(this.workId)),
      this.loadItineraryStops(Number(this.workId)),
      this.getOrderGuests(Number(this.workId)),
      this.getExpensesByWork(Number(this.workId)),
    ]);
  }

  goBack(): void {
    this.router.navigate(['/works']);
  }

  goToOrderDetails(id: number): void {
    this.router.navigate(['/orders', id]);
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  formatTourDateTime(date?: string, time?: string): string {
    if (!date || !time) {
      return '--';
    }
    const dateTime = new Date(`${date}T${time}`);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(dateTime)
      .replace(',', '')
      .replace(/ (\d{2})$/, '-$1');
  }

  formatCurrency(value?: number): string {
    if (value == null) {
      return '--';
    }
    return value.toLocaleString('vi-VN');
  }

  getStatusClass(status: string): string {
    return WorkStatusClass[status.toUpperCase() as keyof typeof WorkStatusClass] || '';
  }

  getSpecialRequestIcon(code: string): string {
    const iconMap: Record<string, string> = {
      vip: '/ui-icons/vip-guest.svg',
      bag: '/ui-icons/baggage-handling.svg',
      eye: '/ui-icons/eye-contact.svg',
      fork: '/ui-icons/fork-and-spoon.svg',
      link: '/ui-icons/linked-orders.svg',
      wheel: '/ui-icons/wheelchair-access.svg',
      h: '/ui-icons/wheelchair-access.svg',
      child: '/ui-icons/child-care.svg',
      diet: '/ui-icons/dietary-requirements.svg',
    };
    return iconMap[code.toLowerCase()] || '';
  }

  async getWorkDetail(workId: number): Promise<void> {
    try {
      const workResponse = await this.workService.getWorkDetailForGuide(workId).toPromise();
      this.workDetail = workResponse || ({} as WorkDetailForGuideType);
      if (this.workDetail && this.workDetail.status && this.workDetail.status.toUpperCase() === 'SCHEDULED') {
        this.workDetail.status = 'OFFERED';
      }
    } catch (error) {
      console.error('Error fetching work details:', error);
    } finally {
      this.loadingInfo = false;
      this.cdr.detectChanges();
    }
  }

  async getWorkOrdersForGuide(workId: number): Promise<void> {
    try {
      const ordersResponse = await this.workService.getWorkOrdersForGuide(workId).toPromise();
      this.orders = ordersResponse || [];
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      this.loadingOrders = false;
      this.cdr.detectChanges();
    }
  }

  async getWorkGuides(workId: number): Promise<void> {
    try {
      const guidesResponse = await this.workService.getWorkGuides(workId).toPromise();
      this.guides = guidesResponse || [];
    } catch (error) {
      console.error('Error fetching work guides:', error);
    } finally {
      this.loadingGuides = false;
      this.cdr.detectChanges();
    }
  }

  async loadItineraryStops(workId: number): Promise<void> {
    try {
      const itineraries = await this.itinerariesService
        .getItineraryStopsByWorkId(workId)
        .toPromise();
      this.itineraryList = itineraries || [];
    } catch (error) {
      console.error('Error fetching itinerary stops:', error);
    } finally {
      this.loadingItineraries = false;
      this.cdr.detectChanges();
    }
  }

  openNotesModal(): void {
    this.showNotesModal = true;
    this.loadingItineraryNotes = true;
    this.itinerariesService.getNotesByWorkId(this.workId).subscribe({
      next: (notes) => {
        this.itineraryNotes = notes || [];
        this.loadingItineraryNotes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.showError('Failed to load itinerary notes.');
        this.loadingItineraryNotes = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  closeNotesModal(): void {
    this.showNotesModal = false;
  }

  downloadNote(note: ItineraryNote): void {
    if (!note.noteUrl) return;

    this.toast.showSuccess(`Downloading "${note.noteName}"...`);
    
    fetch(note.noteUrl)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = note.noteName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.toast.showSuccess(`"${note.noteName}" downloaded successfully.`);
      })
      .catch(err => {
        console.error('Failed to download PDF:', err);
        window.open(note.noteUrl, '_blank');
      });
  }

  openGroupNotesModal(orderRow: WorkOrderForGuide): void {
    this.showGroupNotesModal = true;
    this.loadingOrderNotes = true;
    this.selectedOrderForNotes = null;
    this.cdr.detectChanges();

    // this.loadSpecialRequestTypesIfNeeded();

    this.apiService.getOrder(orderRow.orderId).subscribe({
      next: (order) => {
        this.selectedOrderForNotes = order;
        this.loadingOrderNotes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.showError('Failed to load group notes information.');
        this.loadingOrderNotes = false;
        this.showGroupNotesModal = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  closeGroupNotesModal(): void {
    this.showGroupNotesModal = false;
    this.selectedOrderForNotes = null;
  }

  async getReceiptsByWork(workId: number): Promise<void> {
    try {
      const receiptsResponse = await this.receiptService.getReceiptsByWork(workId).toPromise();
      this.receipts = receiptsResponse || [];
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      this.loadingReceipts = false;
      this.cdr.detectChanges();
    }
  }

  async getExpensesByWork(workId: number): Promise<void> {
    try {
      const expensesResponse = await this.expenseService.getExpensesByWork(workId).toPromise();
      this.otherExpenses = expensesResponse || [];
    } catch (error) {
      console.error('Error fetching expense:', error);
    } finally {
      this.loadingOtherExpenses = false;
      this.cdr.detectChanges();
    }
  }

  async getOrderGuests(workId: number): Promise<void> {
    try {
      const orderGuestsResponse = await this.workService.getOrderGuests(workId).toPromise();
      this.orderGuests = orderGuestsResponse || [];
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      this.loadingGuest = false;
      this.cdr.detectChanges();
    }
  }

  get totalVolume(): number {
    return this.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  }

  get totalExpenseVolume(): number {
    return this.otherExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  isGuestGroupOpen(group: OrderGuestGroup): boolean {
    return this.expandedGuestGroups.has(group.orderId);
  }

  toggleGuestGroup(group: OrderGuestGroup): void {
    if (this.expandedGuestGroups.has(group.orderId)) {
      this.expandedGuestGroups.delete(group.orderId);
    } else {
      this.expandedGuestGroups.add(group.orderId);
    }
  }

  isOrderOpen(order: WorkOrderForGuide): boolean {
    return this.expandedOrderGroups.has(order.orderId);
  }

  toggleOrder(order: WorkOrderForGuide): void {
    if (this.expandedOrderGroups.has(order.orderId)) {
      this.expandedOrderGroups.delete(order.orderId);
    } else {
      this.expandedOrderGroups.add(order.orderId);
    }
  }

  isOrdersOpen(): boolean {
    return this.ordersSectionOpen;
  }

  toggleOrdersGroup(): void {
    this.ordersSectionOpen = !this.ordersSectionOpen;
  }

  isGuidesOpen(): boolean {
    return this.guidesSectionOpen;
  }

  toggleGuidesGroup(): void {
    this.guidesSectionOpen = !this.guidesSectionOpen;
  }

  isItineraryOpen(): boolean {
    return this.itinerarySectionOpen;
  }

  toggleItineraryGroup(): void {
    this.itinerarySectionOpen = !this.itinerarySectionOpen;
  }

  isReceiptsOpen(): boolean {
    return this.receiptsSectionOpen;
  }

  toggleReceiptsGroup(): void {
    this.receiptsSectionOpen = !this.receiptsSectionOpen;
  }

  isExpensesOpen(): boolean {
    return this.expensesSectionOpen;
  }

  toggleExpensesGroup(): void {
    this.expensesSectionOpen = !this.expensesSectionOpen;
  }

  openReceiptModal(): void {
    this.openAddReceipt = true;
  }

  closeReceiptModal(): void {
    this.openAddReceipt = false;
  }

  openExpenseModal(): void {
    this.openAddExpense = true;
  }

  closeExpenseModal(): void {
    this.openAddExpense = false;
  }

  onClickEditReceipt(id: number): void {
    this.openAddReceipt = true;
    this.selectedReceiptId = id;
  }

  onClickDeleteReceipt(id: number): void {
    this.openConfirmDeleteReceipt = true;
    this.selectedReceiptId = id;
  }

  onClickEditExpense(id: number): void {
    this.openAddExpense = true;
    this.selectedExpenseId = id;
  }

  onClickDeleteExpense(id: number): void {
    this.openConfirmDeleteExpense = true;
    this.selectedExpenseId = id;
  }

  onSubmitReceipt(data: ReceiptFormData): void {
    const assignmentId = this.guides.find(
      (guide) => guide.guideId === this.currentUser()?.guideId,
    )?.id;
    const now = new Date();
    const receiptDate = now.toISOString().split('T')[0]; // yyyy-MM-dd
    const receiptTime = now.toTimeString().split(' ')[0]; // HH:mm:ss
    if (this.selectedReceiptId) {
      // edit receipt
      const payload: UpdateReceiptPayload = {
        supplierId: data.supplierId || 0,
        itineraryStopId: Number(data.itineraryStopId),
        amount: Number(data.totalAmount),
        fee: Number(data.fee),
        tax: Number(data.taxRate),
        estimatedTax: Number(data.estimatedTax),
        checkNumber: data.tNumber ?? false,
        isVerified: data.passThrough ?? false,
        verifiedById: data.passThrough ? this.currentUser()?.id : undefined,
        notes: data.note ?? '',
        imageUrl: data.imageUrl || '',
      };
      this.receiptService.updateReceipt(this.selectedReceiptId, payload).subscribe({
        next: () => {
          this.toast.showSuccess('Receipt updated successfully!');
          this.closeReceiptModal();
          this.getReceiptsByWork(Number(this.workId));
        },
        error: (err) => {
          this.toast.showError(err?.error?.message || 'Failed to update receipt.');
          console.error(err);
        }
      });
    } else {
      // add receipt
      const payload: ReceiptPayload = {
        assignmentId: assignmentId || 0,
        supplierId: data.supplierId || 0,
        itineraryStopId: Number(data.itineraryStopId),
        amount: Number(data.totalAmount),
        receiptDate,
        receiptTime,
        fee: Number(data.fee),
        tax: Number(data.taxRate),
        estimatedTax: Number(data.estimatedTax),
        checkNumber: data.tNumber ?? false,
        isVerified: data.passThrough ?? false,
        verifiedById: data.passThrough ? this.currentUser()?.id : undefined,
        verifiedAt: data.passThrough ? now.toISOString() : undefined,
        submittedBy: this.currentUser()?.fullName || '',
        notes: data.note ?? '',
        imageUrl: data.imageUrl || '',
      };
      this.receiptService.createReceipt(payload).subscribe({
        next: () => {
          this.toast.showSuccess('Receipt created successfully!');
          this.closeReceiptModal();
          this.getReceiptsByWork(Number(this.workId));
        },
        error: (err) => {
          this.toast.showError(err?.error?.message || 'Failed to create receipt.');
          console.error(err);
        }
      });
    }
  }

  onCancelDeleteReceipt() {
    this.selectedReceiptId = 0;
    this.openConfirmDeleteReceipt = false;
  }

  onConfirmDeleteReceipt() {
    this.receiptService.deleteReceipt(this.selectedReceiptId).subscribe({
      next: () => {
        this.toast.showSuccess('Receipt deleted successfully!');
        this.openConfirmDeleteReceipt = false;
        this.getReceiptsByWork(Number(this.workId));
      },
      error: (err) => {
        this.toast.showError(err?.error?.message || 'Failed to delete receipt.');
        console.error(err);
      }
    });
  }

  onSubmitExpense(data: ExpenseForm): void {
    const assignmentId = this.guides.find(
      (guide) => guide.guideId === this.currentUser()?.guideId,
    )?.id;
    const now = new Date();
    const expenseDate = now.toISOString().split('T')[0]; // yyyy-MM-dd
    const expenseTime = now.toTimeString().split(' ')[0]; // HH:mm:ss
    if (this.selectedExpenseId) {
      // edit expense
      const payload: UpdateExpensePayload = {
        name: data.name || '',
        amount: data.amount || 0,
        notes: data.notes || '',
        imageUrl: data.imageUrl || '',
        assignmentId: assignmentId || 0,
      };
      this.expenseService.updateExpense(this.selectedExpenseId, payload).subscribe({
        next: () => {
          this.toast.showSuccess('Expense updated successfully!');
          this.closeExpenseModal();
          this.getExpensesByWork(Number(this.workId));
        },
        error: (err) => {
          this.toast.showError(err?.error?.message || 'Failed to update expense.');
          console.error(err);
        }
      });
    } else {
      // add expense
      const payload: ExpensePayload = {
        name: data.name || '',
        amount: data.amount || 0,
        notes: data.notes || '',
        imageUrl: data.imageUrl || '',
        assignmentId: assignmentId || 0,
        expenseDate,
        expenseTime,
        submittedBy: this.currentUser()?.fullName || '',
      };
      this.expenseService.createExpense(payload).subscribe({
        next: () => {
          this.toast.showSuccess('Expense created successfully!');
          this.closeExpenseModal();
          this.getExpensesByWork(Number(this.workId));
        },
        error: (err) => {
          this.toast.showError(err?.error?.message || 'Failed to create expense.');
          console.error(err);
        }
      });
    }
  }

  onConfirmDeleteExpense() {
    this.expenseService.deleteExpense(this.selectedExpenseId).subscribe({
      next: () => {
        this.toast.showSuccess('Expense deleted successfully!');
        this.openConfirmDeleteExpense = false;
        this.getExpensesByWork(Number(this.workId));
      },
      error: (err) => {
        this.toast.showError(err?.error?.message || 'Failed to delete expense.');
        console.error(err);
      }
    });
  }

  onCancelDeleteExpense() {
    this.selectedExpenseId = 0;
    this.openConfirmDeleteExpense = false;
  }

  openPhoto(item: any) {
    this.selectedImageUrl = item.imageUrl;
    this.isImageModalOpen = true;
  }

  closeExpensesPhoto() {
    this.isImageModalOpen = false;
    this.selectedImageUrl = null;
  }
}
