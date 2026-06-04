import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WorkDetailType, WorkGuide, WorkOrder, WorkService } from '../../../services/work.service';
import { AddGuide } from "../add-guide/add-guide";
import { AddStop } from '../add-stop/add-stop';
import { WorkStatusClass } from '../works';
import { ItineraryService, ItineraryStopItem } from '../../../services/itinerary.service';
import { Receipt, ReceiptService } from '../../../services/receipt.service';

export type OrderStatus = 'Completed' | 'Active' | 'Scheduled';

export interface StatusOption {
  label: string;
  value: string;
}

export type GuideStatus = 'ACCEPTED' | 'PENDING' | 'DECLINED';

export interface StopService {
  name: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-work-detail',
  imports: [CommonModule, FormsModule, AddGuide, AddStop],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class WorkDetail {
  private route = inject(ActivatedRoute);

  showGuideModal = false;
  showStopModal = false;
  loadingInfo = true;
  loadingOrders = true;
  loadingGuides = true;
  loadingItineraries = true;
  loadingReceipts = true;
  workId = this.route.snapshot.paramMap.get('id');
  workDetail: WorkDetailType = {} as WorkDetailType;
  stopService: StopService = {
    name: '',
    startTime: '',
    endTime: '',
  };

  constructor(
    private workService: WorkService,
    private itinerariesService: ItineraryService,
    private receiptService: ReceiptService,
    private cdr: ChangeDetectorRef,
  ) {}

  workSteps: string[] = [
    'SCHEDULED',
    'IN PREP',
    'ACCEPTED',
    'REMINDER',
    'READY',
    'STARTED',
    'ENDED',
    'CLOSED',
    'PAID DATE',
  ];

  statusOptions: StatusOption[] = [
    {
      label: 'All Statuses',
      value: 'ALL',
    },
    {
      label: 'Completed',
      value: 'Completed',
    },
    {
      label: 'Active',
      value: 'Active',
    },
    {
      label: 'Scheduled',
      value: 'Scheduled',
    },
  ];

  selectedStatus = 'ALL';

  orders: WorkOrder[] = [];
  guides: WorkGuide[] = [];
  itineraryList: ItineraryStopItem[] = [];
  receipts: Receipt[] = [];

  getStatusClass(status: string): string {
    return WorkStatusClass[status.toUpperCase() as keyof typeof WorkStatusClass] || '';
  }

  get filteredOrders(): WorkOrder[] {
    if (this.selectedStatus === 'ALL') {
      return this.orders;
    }

    return this.orders.filter((order) => order.status === this.selectedStatus);
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.getWorkDetail(Number(this.workId)),
      this.getWorkOrders(Number(this.workId)),
      this.getWorkGuides(Number(this.workId)),
      this.getReceiptsByWork(Number(this.workId)),
      this.loadItineraryStops(Number(this.workId)),
    ]);
    this.stopService = {
      name: this.workDetail.serviceName,
      startTime: this.workDetail.tourStartTime,
      endTime: this.workDetail.tourEndTime,
    };
  }

  async getWorkDetail(workId: number): Promise<void> {
    try {
      const workResponse = await this.workService.getWorkDetail(workId).toPromise();
      this.workDetail = workResponse || ({} as WorkDetailType);
    } catch (error) {
      console.error('Error fetching work details:', error);
    } finally {
      this.loadingInfo = false;
      this.cdr.detectChanges();
    }
  }

  async getWorkOrders(workId: number): Promise<void> {
    try {
      const ordersResponse = await this.workService.getWorkOrders(workId).toPromise();
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

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  isStepActive(step: string): boolean {
    return (
      this.workSteps.indexOf(step) <= this.workSteps.indexOf(this.workDetail.status.toUpperCase())
    );
  }

  openGuideModal(): void {
    this.showGuideModal = true;
  }

  closeGuideModal(): void {
    this.showGuideModal = false;
  }

  approveGuide(guide: WorkGuide): void {
    console.log('Approve', guide);
  }

  rejectGuide(guide: WorkGuide): void {
    console.log('Reject', guide);
  }

  removeGuide(guide: WorkGuide): void {
    console.log('Remove', guide);
  }

  copyItinerary(): void {
    console.log('Copy itinerary');
  }

  openTourNotes(): void {
    console.log('Open tour notes');
  }

  openStopModal(): void {
    this.showStopModal = true;
  }

  closeStopModal(): void {
    this.showStopModal = false;
  }

  addStop(): void {
    console.log('Add stop');
  }

  approveItineraryItem(item: ItineraryStopItem): void {
    console.log('Approve', item);
  }

  removeItineraryItem(item: ItineraryStopItem): void {
    console.log('Remove', item);
  }

  get totalVolume(): number {
    return this.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(value);
  }

  openReceiptPhoto(receipt: Receipt): void {
    console.log('Open photo', receipt);
  }
}
