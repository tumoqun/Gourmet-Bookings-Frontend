import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReceiptFormData {
  supplierId?: number;
  itineraryStopId?: number;
  fee?: number;
  taxRate?: number;
  totalAmount?: number;
  imageUrl?: string;
  tNumber?: boolean;
  passThrough?: boolean;
  note?: string;
}

export interface ReceiptPayload {
  assignmentId: number;
  supplierId: number;
  itineraryStopId: number;
  amount: number;
  receiptDate: string;
  receiptTime: string;
  fee: number;
  tax: number;
  checkNumber: boolean;
  isVerified: boolean;
  verifiedById?: number;
  verifiedAt?: string;
  submittedBy: string;
  notes: string;
  imageUrl: string;
}

export interface UpdateReceiptPayload {
  supplierId: number;
  itineraryStopId: number;
  amount: number;
  fee: number;
  tax: number;
  checkNumber: boolean;
  isVerified: boolean;
  verifiedById?: number;
  notes: string;
  imageUrl: string;
}

export interface Receipt {
  id: number;
  assignmentId: number;
  supplierId: number;
  supplierName: string;
  supplierType: string;
  itineraryStopId: number;
  receiptType: string;
  description: string;
  amount: number;
  tax: number;
  fee: number;
  currencyCode: string;
  receiptDate: string;
  receiptTime: string;
  receiptNumber: string;
  category: string;
  paymentMethod: string;
  notes: string;
  imageUrl: string;
  isVerified: boolean;
  checkNumber: boolean;
  submittedBy: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private readonly apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  getReceiptsByWork(workId: number): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(
      `${this.apiUrl}/receipts/by-work?workId=${workId}`,
      this.getHttpOptions(),
    );
  }

  createReceipt(data: ReceiptPayload): Observable<any> {
    return this.http.post<void>(`${this.apiUrl}/receipts`, data, this.getHttpOptions());
  }

  getReceiptById(id: number): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.apiUrl}/receipts/${id}`, this.getHttpOptions());
  }

  updateReceipt(id: number, data: UpdateReceiptPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/receipts/${id}`, data, this.getHttpOptions());
  }

  deleteReceipt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/receipts/${id}`, this.getHttpOptions());
  }
}
