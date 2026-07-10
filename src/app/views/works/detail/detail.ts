import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkDetailType, WorkGuide, WorkOrder, WorkService, WorkStatuses } from '../../../services/work.service';
import { AddGuide } from '../add-guide/add-guide';
import { AddStop, ItineraryStatus } from '../add-stop/add-stop';
import { WorkStatusClass } from '../works';
import { ItineraryService, ItineraryStopItem, Itinerary, ItineraryNote } from '../../../services/itinerary.service';
import { Receipt, ReceiptService } from '../../../services/receipt.service';
import { GuideService } from '../../../services/guide.service';
import { ConfirmDialog } from '../../../components/common/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../services/toast.service';
import { FileService } from '../../../services/file.service';
import { environment } from '../../../../environments/environment';

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
  standalone: true,
  selector: 'app-work-detail',
  imports: [CommonModule, FormsModule, AddGuide, AddStop, ConfirmDialog],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class WorkDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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

  openConfirmGuide: boolean = false;
  guideSelectedId: number = 0;
  newGuideStatus: string = '';
  confirmTextGuide: string = '';

  openConfirmStop: boolean = false;
  stopSelectedId: number = 0;
  newStopStatus: ItineraryStatus = 'SCHEDULED';
  confirmTextStop: string = '';

  openConfirmWork: boolean = false;
  newWorkStatus: string = '';
  confirmTextWork: string = '';

  selectedImageUrl: string | null = null;
  isImageModalOpen = false;
  private toast = inject(ToastService);
  private fileService = inject(FileService);

  itinerary: Itinerary | null = null;
  isUploadingPdf = false;

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
    await Promise.all([
      this.getWorkDetail(Number(this.workId)),
      this.getWorkOrders(Number(this.workId), this.selectedStatus),
      this.getWorkGuides(Number(this.workId)),
      this.getReceiptsByWork(Number(this.workId)),
      this.loadItineraryStops(Number(this.workId)),
    ]);
    this.loadItinerary(Number(this.workId));
    this.stopService = {
      id: this.workDetail.serviceId,
      name: this.workDetail.serviceName,
      startTime: this.workDetail.tourStartTime,
      endTime: this.workDetail.tourEndTime,
    };
  }

  goBack(): void {
    this.router.navigate(['/works']);
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
    if (!time) return '';
    const [hourStr, minute] = time.split(':');
    const hour = Number(hourStr);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${period}`;
  }

  formatDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    const dateTime = new Date(`${date}T${time}`);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const dayOfWeek = weekdays[dateTime.getDay()];
    const day = dateTime.getDate().toString().padStart(2, '0');
    const month = months[dateTime.getMonth()];
    const year = dateTime.getFullYear().toString().slice(-2);
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;

    return `${dayOfWeek}, ${day}-${month}-${year} - ${displayHour}:${minutes}${period}`;
  }

  isStepActive(step: string): boolean {
    return (
      WorkStatuses.findIndex((status) => status.value === step.toUpperCase()) <=
      WorkStatuses.findIndex((status) => status.value === this.workDetail.status.toUpperCase())
    );
  }

  getCurrentStepIndex(): number {
    return this.workStatuses.findIndex((s) => s.value === this.workDetail.status);
  }

  onClickStep(status: string): void {
    this.openConfirmWork = true;
    this.newWorkStatus = status;
    this.confirmTextWork = `Do you want to change assignment status to ${status.toLocaleLowerCase()}?`;
  }

  onCloseConfirmWork(): void {
    this.openConfirmWork = false;
    this.newWorkStatus = '';
    this.confirmTextWork = '';
  }

  changeWorkStatus(): void {
    this.workService.updateWorkStatus(this.workId, this.newWorkStatus).subscribe({
      next: () => {
        this.toast.showSuccess('Work status updated successfully!');
        (this.getWorkDetail(Number(this.workId)), this.onCloseConfirmWork());
      },
      error: (err) => {
        this.toast.showError(err?.error?.message || 'Failed to update work status.');
        console.error(err);
      },
    });
  }

  goToOrderDetails(id: number): void {
    this.router.navigate(['/orders', id]);
  }

  openGuideModal(): void {
    this.showGuideModal = true;
  }

  closeGuideModal(): void {
    this.showGuideModal = false;
  }

  onClickGuideAction(guideId: number, newStatus: string): void {
    this.openConfirmGuide = true;
    this.guideSelectedId = guideId;
    this.newGuideStatus = newStatus;
    switch (newStatus) {
      case 'ACCEPTED':
        this.confirmTextGuide = 'Do you want to change assignment status to accepted?';
        break;
      case 'REJECTED':
        this.confirmTextGuide = 'Do you want to change assignment status to rejected?';
        break;
      case 'REMOVED':
        this.confirmTextGuide = 'Do you want to removed this guide?';
        break;
      case 'PENDING':
        this.confirmTextGuide = 'Do you want to re-assign this guide?';
        break;
      default:
        break;
    }
  }

  closeGuideConfirm(): void {
    this.openConfirmGuide = false;
    this.guideSelectedId = 0;
    this.newGuideStatus = '';
    this.confirmTextGuide = '';
  }

  changeStatusGuide(): void {
    this.guideService
      .updateAssignment({
        id: this.guideSelectedId,
        status: this.newGuideStatus,
      })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Guide assignment updated successfully!');
          (this.getWorkDetail(Number(this.workId)), this.getWorkGuides(this.workId));
          this.closeGuideConfirm();
        },
        error: (err) => {
          this.toast.showError(err?.error?.message || 'Failed to update guide assignment.');
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
          this.toast.showSuccess("Manager's note saved successfully!");
          guide.isEditNote = false;
          this.getWorkGuides(this.workId);
        },
        error: (err) => {
          this.toast.showError(err?.error?.message || "Failed to save manager's note.");
          console.error(err);
        },
      });
  }

  loadItinerary(workId: number): void {
    this.itinerariesService.getOrCreateItinerary(workId).subscribe({
      next: (itinerary) => {
        this.itinerary = itinerary;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching/creating itinerary:', err);
      },
    });
  }

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.itinerary) {
      return;
    }

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.toast.showError('Please select a valid PDF file.');
      return;
    }

    this.isUploadingPdf = true;
    this.cdr.detectChanges();

    const folder = `work-notes/${this.workId}`;
    this.fileService
      .uploadFileToSupabase(file, folder)
      .then((response) => {
        if (response.error) {
          throw response.error;
        }
        const fullPath = response.data.fullPath || '';
        const noteUrl = `${environment.supabaseUrl}/storage/v1/object/public/${fullPath}`;
        const noteName = file.name;

        this.itinerariesService.addItineraryNote(this.itinerary!.id, noteUrl, noteName).subscribe({
          next: (newNote) => {
            this.toast.showSuccess('Tour Notes PDF uploaded successfully!');
            if (!this.itinerary!.notes) {
              this.itinerary!.notes = [];
            }
            this.itinerary!.notes.push(newNote);
            this.isUploadingPdf = false;
            input.value = '';
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.toast.showError('Failed to save Tour Notes PDF file.');
            this.isUploadingPdf = false;
            this.cdr.detectChanges();
            console.error(err);
          },
        });
      })
      .catch((error) => {
        this.toast.showError('Failed to upload PDF file to storage.');
        this.isUploadingPdf = false;
        this.cdr.detectChanges();
        console.error(error);
      });
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

  onClickStopAction(stopId: number, newStatus: ItineraryStatus): void {
    this.openConfirmStop = true;
    this.stopSelectedId = stopId;
    this.newStopStatus = newStatus;
    switch (newStatus) {
      case 'CONFIRMED':
        this.confirmTextStop = 'Do you want to confirm this itinerary?';
        break;
      case 'CANCELLED':
        this.confirmTextStop = 'Do you want to cancel this itinerary?';
        break;
      default:
        break;
    }
  }

  closeStopConfirm(): void {
    this.openConfirmStop = false;
    this.stopSelectedId = 0;
    this.newStopStatus = 'SCHEDULED';
    this.confirmTextStop = '';
  }

  changeStopStatus(): void {
    this.itinerariesService
      .updateItineraryStopStatus(this.stopSelectedId, this.newStopStatus)
      .subscribe({
        next: () => {
          this.toast.showSuccess('Stop status updated successfully!');
          this.loadItineraryStops(this.workId);
          this.closeStopConfirm();
        },
        error: (err) => {
          this.toast.showError(err?.error?.message || 'Failed to update stop status.');
          console.error(err);
        },
      });
  }

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
    this.selectedImageUrl = receipt.imageUrl;
    this.isImageModalOpen = true;
  }

  closeReceiptPhoto(): void {
    this.isImageModalOpen = false;
    this.selectedImageUrl = null;
  }
}
