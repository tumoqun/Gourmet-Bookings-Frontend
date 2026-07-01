import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SupplierSelectOption, SupplierService } from '../../../services/supplier.service';
import { ActivatedRoute } from '@angular/router';
import { Receipt, ReceiptFormData, ReceiptService } from '../../../services/receipt.service';
import { FileService } from '../../../services/file.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-add-receipt',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-receipt.html',
  styleUrl: './add-receipt.css',
})
export class AddReceipt {
  @Input() visible = false;
  @Input() id = 0;

  @Output() submit = new EventEmitter<ReceiptFormData>();
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private supplierService = inject(SupplierService);
  private receiptService = inject(ReceiptService);
  private fileService = inject(FileService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  workId = this.route.snapshot.paramMap.get('id');
  suppliers: SupplierSelectOption[] = [];
  selectedFile?: File;
  selectedFileName = '';
  uploading = false;

  receiptForm = this.fb.group({
    itineraryStopId: [''],
    fee: [0],
    taxRate: [0],
    totalAmount: [{ value: 0, disabled: true }],
    overrideCalculation: [false],
    tNumber: [false],
    passThrough: [false],
    notes: [''],
    imageUrl: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.getSuppliers(Number(this.workId));
    if (this.id) {
      this.getReceiptDetail();
    }
    this.listenOverrideCalculation();
    this.listenAutoCalculation();
    this.updateTotalAmount();
  }

  listenOverrideCalculation(): void {
    this.receiptForm.get('overrideCalculation')?.valueChanges.subscribe((override) => {
      const totalControl = this.receiptForm.get('totalAmount');
      if (override) {
        totalControl?.enable();
      } else {
        totalControl?.disable();
        this.updateTotalAmount();
      }
    });
  }

  listenAutoCalculation(): void {
    this.receiptForm.get('fee')?.valueChanges.subscribe(() => {
      if (!this.receiptForm.get('overrideCalculation')?.value) {
        this.updateTotalAmount();
      }
    });
    this.receiptForm.get('taxRate')?.valueChanges.subscribe(() => {
      if (!this.receiptForm.get('overrideCalculation')?.value) {
        this.updateTotalAmount();
      }
    });
  }

  calculateTotalAmount(): number {
    const fee = Number(this.receiptForm.get('fee')?.value) || 0;
    const taxRate = Number(this.receiptForm.get('taxRate')?.value) || 0;
    const tax = (fee * taxRate) / 100;
    return Number((fee + tax).toFixed(2));
  }

  updateTotalAmount(): void {
    const total = this.calculateTotalAmount();
    this.receiptForm.get('totalAmount')?.setValue(total, {
      emitEvent: false,
    });
  }

  get estimatedTax(): number {
    const fee = Number(this.receiptForm.get('fee')?.value) || 0;
    const taxRate = Number(this.receiptForm.get('taxRate')?.value) || 0;
    return Number(((fee * taxRate) / 100).toFixed(2));
  }

  async getSuppliers(workId: number): Promise<void> {
    try {
      const suppliersResponse = await this.supplierService
        .getSuppliersNoReceiptByWork(workId)
        .toPromise();
      this.suppliers = suppliersResponse || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async getReceiptDetail(): Promise<void> {
    try {
      this.receiptService.getReceiptById(this.id).subscribe({
        next: (data: Receipt) => {
          console.log('data', data);
          const expectedAmount = Number((data.fee + (data.fee * data.tax) / 100).toFixed(2));
          const isOverrideCalculation = Number(data.amount.toFixed(2)) !== expectedAmount;
          this.receiptForm.patchValue({
            itineraryStopId: data.itineraryStopId?.toString() ?? '',
            fee: data.fee ?? 0,
            taxRate: data.tax ?? 0,
            totalAmount: data.amount ?? 0,
            overrideCalculation: isOverrideCalculation,
            tNumber: data.checkNumber ?? false,
            passThrough: data.isVerified ?? false,
            notes: data.notes ?? '',
            imageUrl: data.imageUrl ?? '',
          });
          const totalAmountControl = this.receiptForm.get('totalAmount');
          if (isOverrideCalculation) {
            totalAmountControl?.enable({ emitEvent: false });
          } else {
            totalAmountControl?.disable({ emitEvent: false });
          }
          this.suppliers.unshift({
            id: data.supplierId,
            name: data.supplierName,
            supplierType: data.supplierType,
            itineraryStopId: data.itineraryStopId,
          });

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Fail to get receipt detail', error);
        },
      });
    } catch (error) {
      console.error('Error fetching receipt:', error);
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
    this.fileService
      .uploadFileToSupabase(this.selectedFile!, 'receipts')
      .then((response) => {
        console.log('File uploaded successfully:', response);
        this.uploading = false;
        this.receiptForm.patchValue({
          imageUrl: `${environment.supabaseUrl}/storage/v1/object/public/${response.data.fullPath || ''}`,
        });
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        this.uploading = false;
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  onCancel() {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.receiptForm.invalid) {
      this.receiptForm.markAllAsTouched();
      return;
    }
    const formValue = this.receiptForm.getRawValue();
    const selectedSupplierId = this.suppliers.find(
      (supplier) => supplier.itineraryStopId === Number(formValue.itineraryStopId),
    )?.id;
    const request: ReceiptFormData = {
      supplierId: selectedSupplierId,
      itineraryStopId: formValue.itineraryStopId ? Number(formValue.itineraryStopId) : undefined,
      fee: formValue.fee ?? 0,
      taxRate: formValue.taxRate ?? 0,
      totalAmount: formValue.totalAmount ?? 0,
      tNumber: formValue.tNumber ?? false,
      passThrough: formValue.passThrough ?? false,
      note: formValue.notes?.trim() || undefined,
      imageUrl: formValue.imageUrl || undefined,
    };

    this.submit.emit(request);
  }
}
