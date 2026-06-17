import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WorkDetailType, WorkGuide, WorkOrder, WorkService, WorkStatuses } from '../../../services/work.service';
import { AddGuide } from '../add-guide/add-guide';
import { AddStop, ItineraryStatus } from '../add-stop/add-stop';
import { WorkStatusClass } from '../works';
import { ItineraryService, ItineraryStopItem } from '../../../services/itinerary.service';
import { Receipt, ReceiptService } from '../../../services/receipt.service';
import { GuideService } from '../../../services/guide.service';

export type OrderStatus = 'Completed' | 'Active' | 'Scheduled';

export interface StatusOption {
  label: string;
  value: string;
}

export type GuideStatus = 'ACCEPTED' | 'PENDING' | 'DECLINED';

export interface StopService {
  id: number;
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

  isEditNote = false;
  showGuideModal = false;
  showStopModal = false;
  loadingInfo = true;
  loadingOrders = true;
  loadingGuides = true;
  loadingItineraries = true;
  loadingReceipts = true;
  workId = Number(this.route.snapshot.paramMap.get('id'));
  workDetail: WorkDetailType = {} as WorkDetailType;
  stopService: StopService = {
    id: 0,
    name: '',
    startTime: '',
    endTime: '',
  };

  constructor(
    private workService: WorkService,
    private guideService: GuideService,
    private itinerariesService: ItineraryService,
    private receiptService: ReceiptService,
    private cdr: ChangeDetectorRef,
  ) {}

  statusOptions: StatusOption[] = [
    {
      label: 'All Statuses',
      value: 'all',
    },
    {
      label: 'Active',
      value: 'active',
    },
  ];

  selectedStatus = 'all';
  workStatuses = WorkStatuses;

  orders: WorkOrder[] = [];
  guides: WorkGuide[] = [];
  currentGuides: number[] = [];
  itineraryList: ItineraryStopItem[] = [];
  receipts: Receipt[] = [];

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

  getStatusClass(status: string): string {
    return WorkStatusClass[status.toUpperCase() as keyof typeof WorkStatusClass] || '';
  }

  async filteredOrders(status: string): Promise<void> {
    await this.getWorkOrders(Number(this.workId), status);
  }

  async ngOnInit(): Promise<void> {
    console.log('this.workDetail', this.workDetail);
    await Promise.all([
      this.getWorkDetail(Number(this.workId)),
      this.getWorkOrders(Number(this.workId), this.selectedStatus),
      this.getWorkGuides(Number(this.workId)),
      this.getReceiptsByWork(Number(this.workId)),
      this.loadItineraryStops(Number(this.workId)),
    ]);
    this.stopService = {
      id: this.workDetail.serviceId,
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

  async getWorkOrders(workId: number, status: string): Promise<void> {
    try {
      const ordersResponse = await this.workService.getWorkOrders(workId, status).toPromise();
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
      this.currentGuides = guidesResponse?.map((item) => item.guideId) || [];
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
      WorkStatuses.findIndex((status) => status.value === step.toUpperCase()) <=
      WorkStatuses.findIndex((status) => status.value === this.workDetail.status.toUpperCase())
    );
  }

  openGuideModal(): void {
    this.showGuideModal = true;
  }

  closeGuideModal(): void {
    this.showGuideModal = false;
  }

  changeStatusGuide(guide: WorkGuide, newStatus: string): void {
    this.guideService
      .updateAssignment({
        id: guide.id,
        status: newStatus,
      })
      .subscribe({
        next: () => {
          this.getWorkGuides(this.workId);
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  saveNote(guide: WorkGuide): void {
    this.guideService
      .updateAssignment({
        id: guide.id,
        note: guide.note,
      })
      .subscribe({
        next: () => {
          guide.isEditNote = false;
          this.getWorkGuides(this.workId);
        },
        error: (err) => {
          console.error(err);
        },
      });
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

  changeStopStatus(stop: ItineraryStopItem, newStatus: ItineraryStatus): void {
    this.itinerariesService
      .updateItineraryStopStatus(
        stop.id,
        newStatus,
      )
      .subscribe({
        next: () => {
          this.loadItineraryStops(this.workId);
        },
        error: (err) => {
          console.error(err);
        },
      });
  };

  get totalVolume(): number {
    return this.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  }

  formatCurrency(value?: number): string {
    if (value == null) {
      return '--';
    }
    return value.toLocaleString('vi-VN');
  }

  openReceiptPhoto(receipt: Receipt): void {
    console.log('Open photo', receipt);
  }
}
