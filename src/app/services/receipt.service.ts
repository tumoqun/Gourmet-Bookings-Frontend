import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Receipt {
  id: number;
  assignmentId: number;
  supplierId: number;
  supplierName: string;
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
}
