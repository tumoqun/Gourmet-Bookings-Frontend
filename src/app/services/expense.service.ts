import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Expense {
  id: number;
  assignmentId: number;
  name: string;
  amount: number;
  notes: string;
  imageUrl: string;
  submittedBy: string;
  createdAt: string;
}

export interface ExpenseForm {
  name: string;
  amount: number;
  notes: string;
  imageUrl: string;
}

export interface ExpensePayload {
  name: string;
  amount: number;
  notes: string;
  assignmentId: number;
  expenseDate: string;
  expenseTime: string;
  submittedBy: string;
  imageUrl: string;
}

export interface UpdateExpensePayload {
  name: string;
  amount: number;
  notes: string;
  assignmentId: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  getExpensesByWork(workId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(
      `${this.apiUrl}/expenses/by-work?workId=${workId}`,
      this.getHttpOptions(),
    );
  }

  createExpense(data: ExpensePayload): Observable<any> {
    return this.http.post<void>(`${this.apiUrl}/expenses`, data, this.getHttpOptions());
  }

  getExpenseById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/expenses/${id}`, this.getHttpOptions());
  }

  updateExpense(id: number, data: UpdateExpensePayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/expenses/${id}`, data, this.getHttpOptions());
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/expenses/${id}`, this.getHttpOptions());
  }
}
