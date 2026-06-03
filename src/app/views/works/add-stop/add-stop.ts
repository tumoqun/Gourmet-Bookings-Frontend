import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimePickerComponent } from '../../../components/common/time-picker/time-picker';
import { StopService } from '../detail/detail';
import { ItineraryStopItem, ItineraryService } from '../../../services/itinerary.service';
import { ActivatedRoute } from '@angular/router';

type StopTab = 'standard' | 'other' | 'additional';

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
    name: '',
    startTime: '',
    endTime: '',
  };

  @Output() close = new EventEmitter<void>();

  stopForm!: FormGroup;
  activeTab: StopTab = 'standard';
  showTimePicker = false;
  private route = inject(ActivatedRoute);
  workId = this.route.snapshot.paramMap.get('id');
  stopList: ItineraryStopItem[] = [];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private itinerariesService: ItineraryService,
  ) {}

  ngOnInit(): void {
    this.setActiveTab('standard');
  }

  updateTime(selectedTime: string): void {
    this.stopForm.get('scheduleTime')?.setValue(selectedTime);
    this.showTimePicker = false;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  setActiveTab(tab: StopTab): void {
    this.activeTab = tab;
    if (tab === 'additional') {
      this.stopForm = this.fb.group({
        scheduleTime: ['', Validators.required],
        note: [''],
      });
    } else {
      this.stopForm = this.fb.group({
        stopLocation: ['', Validators.required],
        scheduleTime: ['', Validators.required],
        note: [''],
      });
    }
  }

  onSubmit(): void {
    if (this.stopForm.valid) {
      console.log('Form Submitted Data:', {
        tab: this.activeTab,
        ...this.stopForm.value,
      });
    }
  }

  onCancel(): void {
    this.stopForm.reset();
    this.close.emit();
  }
}
