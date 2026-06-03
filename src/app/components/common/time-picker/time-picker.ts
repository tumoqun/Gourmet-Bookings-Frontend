import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.css',
})
export class TimePickerComponent implements OnInit {
  @Input() initialTime: string = '';
  @Output() timeSelected = new EventEmitter<string>();
  @Output() closePicker = new EventEmitter<void>();

  timeForm!: FormGroup;
  activePeriod: 'AM' | 'PM' = 'AM';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    let hour = '';
    let minute = '00';

    if (this.initialTime) {
      const match = this.initialTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        hour = match[1];
        minute = match[2];
        this.activePeriod = match[3].toUpperCase() as 'AM' | 'PM';
      }
    }

    this.timeForm = this.fb.group({
      hour: [hour, [Validators.required, Validators.min(1), Validators.max(12)]],
      minute: [minute, [Validators.required, Validators.min(0), Validators.max(59)]],
    });
  }

  setPeriod(period: 'AM' | 'PM'): void {
    this.activePeriod = period;
  }

  onApply(): void {
    if (this.timeForm.valid) {
      const h = String(this.timeForm.value.hour).padStart(2, '0');
      const m = String(this.timeForm.value.minute).padStart(2, '0');
      const formattedTime = `${h}:${m} ${this.activePeriod}`;
      this.timeSelected.emit(formattedTime);
    }
  }

  onCancel(): void {
    this.closePicker.emit();
  }
}
