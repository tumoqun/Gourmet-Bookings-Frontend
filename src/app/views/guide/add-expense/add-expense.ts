import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Expense, ExpenseForm, ExpenseService } from '../../../services/expense.service';
import { FileService } from '../../../services/file.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-add-expense',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-expense.html',
  styleUrl: './add-expense.css',
})
export class AddExpense {
  @Input() visible = false;
  @Input() id = 0;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<ExpenseForm>();

  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private fileService = inject(FileService);
  private cdr = inject(ChangeDetectorRef);
  selectedFile?: File;
  selectedFileName = '';
  uploading = false;

  expenseForm = this.fb.group({
    name: [''],
    amount: [0],
    notes: [''],
    imageUrl: [''],
  });

  async ngOnInit(): Promise<void> {
    if (this.id) {
      this.getExpenseDetail();
    }
  }

  async getExpenseDetail(): Promise<void> {
    try {
      this.expenseService.getExpenseById(this.id).subscribe({
        next: (data: Expense) => {
          console.log('data', data);
          this.expenseForm.patchValue({
            name: data.name || '',
            amount: data.amount || null,
            notes: data.notes || '',
            imageUrl: data.imageUrl || '',
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Fail to get expense detail', error);
        },
      });
    } catch (error) {
      console.error('Error fetching expense:', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  onFileSelected(event: Event): void {
    this.uploading = true;
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
    }
    this.fileService.uploadFileToSupabase(this.selectedFile!, 'expenses').then((response) => {
      console.log('File uploaded successfully:', response);
      this.uploading = false;
      this.expenseForm.patchValue({
        imageUrl: `${environment.supabaseUrl}/storage/v1/object/public/${response.data.fullPath || ''}`,
      });
    }).catch((error) => {
      console.error('Error uploading file:', error);
      this.uploading = false;
    }).finally(() => {
      this.cdr.detectChanges();
    });
  }

  onCancel() {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }
    const formValue = this.expenseForm.getRawValue();
    const request: ExpenseForm = {
      name: formValue.name?.trim() || '',
      amount: formValue.amount || 0,
      notes: formValue.notes?.trim() || '',
      imageUrl: formValue.imageUrl || '',
    };

    this.submit.emit(request);
  }
}
