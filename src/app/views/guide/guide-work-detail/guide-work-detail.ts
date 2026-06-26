import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Expense, OrderGuestGroup, WorkDetailForGuideType, WorkDetailType, WorkGuide, WorkOrderForGuide, WorkService } from '../../../services/work.service';
import { CommonModule } from '@angular/common';
import { WorkStatusClass } from '../../works/works';
import { Receipt, ReceiptService } from '../../../services/receipt.service';
import { ItineraryService, ItineraryStopItem } from '../../../services/itinerary.service';

@Component({
  selector: 'app-guide-work-detail',
  imports: [CommonModule],
  templateUrl: './guide-work-detail.html',
  styleUrl: './guide-work-detail.css',
})
export class GuideWorkDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loadingInfo = true;
  loadingGuest = true;
  loadingOrders = true;
  loadingGuides = true;
  loadingItineraries = true;
  loadingReceipts = true;
  loadingOtherExpenses = false;
  workId = Number(this.route.snapshot.paramMap.get('id'));
  workDetail: WorkDetailForGuideType = {} as WorkDetailForGuideType;

  orders: WorkOrderForGuide[] = [];
  guides: WorkGuide[] = [];
  receipts: Receipt[] = [];
  itineraryList: ItineraryStopItem[] = [];
  orderGuests: OrderGuestGroup[] = [];
  otherExpenses: Expense[] = []

  constructor(
    private workService: WorkService,
    private itinerariesService: ItineraryService,
    private receiptService: ReceiptService,
    private cdr: ChangeDetectorRef,
  ) { }

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.getWorkDetail(Number(this.workId)),
      this.getWorkOrdersForGuide(Number(this.workId)),
      this.getWorkGuides(Number(this.workId)),
      this.getReceiptsByWork(Number(this.workId)),
      this.loadItineraryStops(Number(this.workId)),
      this.getOrderGuests(Number(this.workId))
    ]);
  }

  goBack(): void {
    this.router.navigate(['/works']);
  }

  goToOrderDetails(id: number): void {
    console.log('Go To Order Details', id)
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
      hour12: true
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

  openReceiptPhoto(receipt: Receipt): void {
    console.log('Open photo', receipt);
  }

  openExpensesPhoto(expense: Expense): void {
    console.log('Open photo', expense);
  }
}
