import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ─── DTOs matching AccountingItemResponse / AccountingPageResponse ────────────

/**
 * One row from GET /api/accounting — flat structure,
 * all guide names pre-aggregated by the backend.
 */
export interface AccountingItem {
  workId: number;
  workNumber: string;
  status: string;
  /** ISO date, e.g. "2024-12-07" */
  tourDate: string;
  /** ISO time, e.g. "17:30:00" — null if not yet scheduled */
  tourStartTime: string | null;
  notes: string | null;
  /** All guide full names for this work */
  guideNames: string[];
  /** ref1 from the first linked order */
  ref1: string | null;
  /** Reseller name from the first linked order */
  resellerName: string | null;
  isPrivate: boolean;
  adultCount: number;
  childCount: number;
  /** Service name from the first order_service */
  serviceName: string | null;
}

export interface AccountingPageResponse {
  content: AccountingItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AccountingFilter {
  resellerId?: number;
  ref?: string;
  guideName?: string;
  serviceName?: string;
  /** yyyy-MM-dd */
  tourDate?: string;
  /** Exact work status, e.g. "SCHEDULED" — leave empty for all */
  status?: string;
  isPrivate?: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private readonly apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  /**
   * Calls GET /api/accounting — dedicated endpoint separate from /api/works.
   */
  getAccounting(
    filter: AccountingFilter,
    page: number,
    size: number,
  ): Observable<AccountingPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filter.resellerId) {
      params = params.set('resellerId', filter.resellerId.toString());
    }
    if (filter.ref?.trim()) {
      params = params.set('ref', filter.ref.trim());
    }
    if (filter.guideName?.trim()) {
      params = params.set('guideName', filter.guideName.trim());
    }
    if (filter.serviceName?.trim()) {
      params = params.set('serviceName', filter.serviceName.trim());
    }
    if (filter.tourDate?.trim()) {
      params = params.set('tourDate', filter.tourDate.trim());
    }
    if (filter.status && filter.status !== 'All Statuses') {
      // Backend compares case-insensitively, but send uppercase for clarity
      params = params.set('status', filter.status.toUpperCase().replace(/ /g, '_'));
    }
    if (filter.isPrivate != null) {
      params = params.set('isPrivate', filter.isPrivate.toString());
    }

    return this.http.get<AccountingPageResponse>(
      `${this.apiUrl}/accounting`,
      { params },
    );
  }
}
