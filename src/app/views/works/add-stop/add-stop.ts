import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimePickerComponent } from '../../../components/common/time-picker/time-picker';
import { StopService } from '../detail/detail';
import { ItineraryStopItem, ItineraryService, CreateItineraryStopRequest } from '../../../services/itinerary.service';
import { ActivatedRoute } from '@angular/router';
import { SupplierSelectOption, SupplierService, SupplierTypes } from '../../../services/supplier.service';
import { AuthService } from '../../../services/auth.service';

type StopTab = 'standard' | 'other' | 'additional';

export type ItineraryStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED';

export const ItineraryStatuses = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
};

@Component({
  selector: 'app-add-stop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TimePickerComponent],
  templateUrl: './add-stop.html',
  styleUrl: './add-stop.css',
})
export class AddStop {
  @Input() visible = false;
  @Input() serviceInfo: StopService = {
    id: 0,
    name: '',
    startTime: '',
    endTime: '',
  };

  @Output() close = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();

  stopForm!: FormGroup;
  activeTab: StopTab = 'standard';
  showTimePicker = false;
  isCustomStop = false;
  private route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  readonly currentUser = this.auth.currentUser;
  workId = this.route.snapshot.paramMap.get('id');
  supplierList: SupplierSelectOption[] = [];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private supplierService: SupplierService,
    private itineraryService: ItineraryService,
  ) {}

  ngOnInit(): void {
    this.setActiveTab('standard');
    this.loadSuppliers(SupplierTypes.STANDARD);
  }

  async loadSuppliers(type: string): Promise<void> {
    try {
      const suppliers = await this.supplierService
        .getSuppliersForService(this.serviceInfo.id, type)
        .toPromise();
      this.supplierList = suppliers || [];
      console.log('Loaded Suppliers:', suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  onStopLocationChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'CUSTOM_STOP') {
      this.isCustomStop = true;
      this.stopForm.patchValue({
        stopLocation: '',
      });
    }
  }

  updateTime(selectedTime: string): void {
    this.stopForm.get('scheduleTime')?.setValue(selectedTime);
    this.showTimePicker = false;
  }

  formatTime(time?: string): string {
    if (!time) return '--';

    return time.substring(0, 5);
  }

  setActiveTab(tab: StopTab): void {
    this.activeTab = tab;
    if (tab === 'additional') {
      this.stopForm = this.fb.group({
        scheduleTime: ['', Validators.required],
        note: [''],
      });
    } else {
      if (tab === 'standard') {
        this.loadSuppliers(SupplierTypes.STANDARD);
      } else {
        this.loadSuppliers(SupplierTypes.OTHER);
      }
      this.stopForm = this.fb.group({
        stopLocation: ['', Validators.required],
        scheduleTime: ['', Validators.required],
        note: [''],
      });
    }
    this.cdr.detectChanges();
  }

  convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') {
      hours = String(Number(hours) + 12);
    }
    if (modifier === 'AM' && hours === '12') {
      hours = '00';
    }
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  }

  onSubmit(): void {
    if (this.stopForm.valid) {
      console.log('Form Submitted Data:', {
        tab: this.activeTab,
        ...this.stopForm.value,
      });
      const payload: CreateItineraryStopRequest = {
        workId: Number(this.workId),
        serviceId: this.serviceInfo.id,
        supplierId: !this.isCustomStop ? Number(this.stopForm.get('stopLocation')?.value) : null,
        scheduledTime: this.convertTo24Hour(this.stopForm.get('scheduleTime')?.value),
        specialNotes: this.stopForm.get('note')?.value,
        status: ItineraryStatuses.SCHEDULED,
        stopType: this.activeTab,
        addedBy: this.currentUser()?.fullName || '',
        otherName: this.isCustomStop ? this.stopForm.get('stopLocation')?.value : ''
      };
      this.itineraryService.createItineraryStop(payload).subscribe(() => {
        this.close.emit();
        this.stopForm.reset();
        this.reload.emit();
      });
    }
  }

  onCancel(): void {
    this.stopForm.reset();
    this.close.emit();
  }
}
