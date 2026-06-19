import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService, Order, OrderAdditionalService } from '../../../services/api.service';

interface GuestMember {
  name: string;
  phone: string;
  age: number | string;
  gender: string;
  allergies: string;
}

interface RelatedOrder {
  pic: string;
  ref1: string;
  ref2: string;
  serviceName: string;
  type: string;
  dateTime: string;
  guests: string;
  fee: string;
  status: string;
  statusTone: string;
  notes: string;
}

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class OrderDetail implements OnInit {
  protected isLoading = true;
  protected errorMessage = '';
  protected order?: Order;
  protected orderId?: number;

  protected todayLabel = '';

  // Status progress steps (1–5)
  protected progressStep = 1;

  // Guest group state
  protected isEditingGuestGroup = false;
  protected leaderPhone = '';
  protected guestGroupNotes = '';
  protected averageAge: number | string = '';
  protected specialOccasion = '';
  protected leaderEmail = '';
  protected allergiesOrDietaryRestrictions = '';
  protected guestSpecialRequests = '';
  protected hiredCarDriverGuide = '';
  protected internalInformation = '';
  protected selectedSpecialRequests: string[] = ['Special Occasion', 'VIP'];
  protected guestMembers: GuestMember[] = [];

  protected editLeaderPhone = '';
  protected editGuestGroupNotes = '';
  protected editLeaderEmail = '';
  protected editAllergiesOrDietaryRestrictions = '';
  protected editGuestSpecialRequests = '';
  protected editHiredCarDriverGuide = '';
  protected editInternalInformation = '';
  protected editSelectedSpecialRequests: string[] = [];

  // Add guest form
  protected isAddingGuest = false;
  protected newGuestName = '';
  protected newGuestPhone = '';
  protected newGuestAge: number | string = '';
  protected newGuestGender = '';
  protected newGuestAllergies = '';

  // Edit guest
  protected editingGuestIndex: number | null = null;

  // Related orders (mock for now)
  protected relatedOrders: RelatedOrder[] = [];

  // Action buttons state
  protected waiversSigned = true;
  protected signboardAttached = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.todayLabel = this.buildTodayLabel();

    const idParam = this.route.snapshot.paramMap.get('id');
    this.orderId = idParam ? Number(idParam) : undefined;

    if (this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      this.isLoading = false;
      this.errorMessage = 'No order ID provided.';
    }

    // Seed mock related orders
    this.relatedOrders = [
      {
        pic: 'James Anderson',
        ref1: 'TK-08053-1',
        ref2: 'ACC-AW03-1 2-bc',
        serviceName: 'Secret Food Tours',
        type: 'P',
        dateTime: 'Sat, 07-Dec-24 - 5:30PM',
        guests: '5/0',
        fee: 'VND 90,488',
        status: 'Completed',
        statusTone: 'neutral',
        notes: 'View Notes',
      },
    ];
  }

  protected loadOrder(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getOrder(id).subscribe({
      next: (order) => {
        this.order = order;
        this.progressStep = this.deriveProgressStep(order.status?.code ?? '');
        this.seedGuestData(order);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: show a plausible mock so the UI is always visible
        this.order = this.buildMockOrder();
        this.progressStep = 1;
        this.seedGuestData(this.order);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  protected get reseller(): string {
    return this.order?.reseller?.name ?? 'Direct Customer';
  }

  protected get picName(): string {
    return this.order?.picContact?.name ?? this.order?.createdByName ?? 'Unassigned';
  }

  protected get picEmail(): string {
    return this.order?.picEmail ?? '—';
  }

  protected get ref1(): string {
    return this.order?.ref1 ?? this.order?.orderNumber ?? '—';
  }

  protected get ref2(): string {
    return this.order?.ref2 ?? '—';
  }

  protected get isTentative(): string {
    return this.order?.isTentative ? 'YES' : 'NO';
  }

  protected get orderTypeLabel(): string {
    return this.order?.isPrivate ? 'PRIVATE' : 'GROUP';
  }

  protected get originalAgent(): string {
    return this.order?.originalAgent?.name ?? 'NO';
  }

  protected get productCode(): string {
    const os = this.order?.orderServices?.[0];
    return os?.area?.code ? `${os.area.code}-${String(os.service?.id ?? '').padStart(5, '0')}` : '—';
  }

  protected get tourDate(): string {
    const d = this.order?.orderServices?.[0]?.targetDate;
    return d ? this.formatDate(d) : '—';
  }

  protected get startTime(): string {
    return this.formatTime(this.order?.orderServices?.[0]?.startTime);
  }

  protected get endTime(): string {
    // Estimate end time from startTime + durationMinutes
    const os = this.order?.orderServices?.[0];
    if (!os?.startTime || !os?.service?.durationMinutes) return '—';
    const [h, m] = os.startTime.split(':').map(Number);
    const totalMin = h * 60 + (m || 0) + (os.service.durationMinutes || 0);
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    const d = new Date();
    d.setHours(endH, endM, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
  }

  protected get pickupInfo(): string {
    const pickup = this.getAdditionalService('PICKUP');
    return pickup?.location ?? 'None Specified';
  }

  protected get pickupTime(): string {
    const pickup = this.getAdditionalService('PICKUP');
    return pickup?.suggestedTime ? this.formatTime(pickup.suggestedTime) : '';
  }

  protected get meetingPoint(): string {
    const pickup = this.getAdditionalService('PICKUP');
    return pickup?.location ? '' : 'None Specified';
  }

  protected get dropoffInfo(): string {
    const dropoff = this.getAdditionalService('DROPOFF');
    const handoff = this.getAdditionalService('HANDOFF');
    if (dropoff?.location) return dropoff.location;
    if (handoff?.handoffText) return handoff.handoffText;
    return 'None Specified';
  }

  protected get area(): string {
    return this.order?.orderServices?.[0]?.area?.name ?? '—';
  }

  protected get guestGroupLabel(): string {
    const ref = this.order?.ref1 ?? this.order?.orderNumber ?? 'GRP';
    const area = this.order?.orderServices?.[0]?.area?.code ?? 'XX';
    return `${area}_GR-${ref}-${this.order?.adultCount ?? 0}/${this.order?.childCount ?? 0}`;
  }

  protected get statusLabel(): string {
    return this.order?.status?.label ?? this.order?.status?.code ?? 'Requested';
  }

  // ── Progress step ────────────────────────────────────────────────────────────

  private deriveProgressStep(code: string): number {
    const map: Record<string, number> = {
      requested: 1,
      tentative: 1,
      offered: 2,
      confirmed: 3,
      active: 4,
      completed: 5,
      cancelled: 1,
    };
    return map[code.toLowerCase()] ?? 1;
  }

  // ── Guest data seeding ───────────────────────────────────────────────────────

  private seedGuestData(order: Order): void {
    this.leaderPhone = '0912 334 556';
    this.guestGroupNotes = `${order.adultCount ?? 0}`;
    this.averageAge = Math.round((order.adultCount ?? 1) * 14 + (order.childCount ?? 0) * 8);
    this.specialOccasion = order.dietaryRestrictions ?? '';
    this.leaderEmail = order.guestEmail ?? order.picEmail ?? order.picContact?.email ?? '';
    this.allergiesOrDietaryRestrictions = order.dietaryRestrictions ?? '';

    // Build sample guests from adultCount + childCount
    const adults = order.adultCount ?? 2;
    const children = order.childCount ?? 1;
    this.guestMembers = [];
    for (let i = 0; i < adults; i++) {
      this.guestMembers.push({
        name: i === 0 ? (order.picContact?.name ?? 'Guest One') : `Guest ${i + 1}`,
        phone: i === 0 ? '0912 334 556' : '',
        age: 30 + i * 5,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        allergies: i === 0 && order.dietaryRestrictions ? order.dietaryRestrictions : '--',
      });
    }
    for (let j = 0; j < children; j++) {
      this.guestMembers.push({
        name: `Child ${j + 1}`,
        phone: '',
        age: 8 + j,
        gender: j % 2 === 0 ? 'Male' : 'Female',
        allergies: '--',
      });
    }
  }

  // ── Guest group actions ──────────────────────────────────────────────────────

  protected openEditGuestGroup(): void {
    this.editLeaderPhone = this.leaderPhone;
    this.editGuestGroupNotes = this.guestGroupNotes;
    this.editLeaderEmail = this.leaderEmail;
    this.editAllergiesOrDietaryRestrictions = this.allergiesOrDietaryRestrictions;
    this.editGuestSpecialRequests = this.guestSpecialRequests;
    this.editHiredCarDriverGuide = this.hiredCarDriverGuide;
    this.editInternalInformation = this.internalInformation;
    this.editSelectedSpecialRequests = [...this.selectedSpecialRequests];
    this.isEditingGuestGroup = true;
  }

  protected closeEditGuestGroup(): void {
    this.isEditingGuestGroup = false;
  }

  protected saveGuestGroup(): void {
    this.leaderPhone = this.editLeaderPhone;
    this.guestGroupNotes = this.editGuestGroupNotes;
    this.leaderEmail = this.editLeaderEmail;
    this.allergiesOrDietaryRestrictions = this.editAllergiesOrDietaryRestrictions;
    this.guestSpecialRequests = this.editGuestSpecialRequests;
    this.hiredCarDriverGuide = this.editHiredCarDriverGuide;
    this.internalInformation = this.editInternalInformation;
    this.selectedSpecialRequests = [...this.editSelectedSpecialRequests];
    this.specialOccasion = this.editAllergiesOrDietaryRestrictions || this.editSelectedSpecialRequests.join(', ');
    this.closeEditGuestGroup();
  }

  protected openAddGuest(): void {
    this.isAddingGuest = true;
    this.newGuestName = '';
    this.newGuestPhone = '';
    this.newGuestAge = '';
    this.newGuestGender = '';
    this.newGuestAllergies = '';
  }

  protected closeAddGuest(): void {
    this.isAddingGuest = false;
  }

  protected confirmAddGuest(): void {
    this.guestMembers.push({
      name: this.newGuestName,
      phone: this.newGuestPhone,
      age: this.newGuestAge,
      gender: this.newGuestGender,
      allergies: this.newGuestAllergies || '--',
    });
    this.closeAddGuest();
  }

  protected editGuest(index: number): void {
    this.editingGuestIndex = index;
  }

  protected saveGuestEdit(index: number): void {
    this.editingGuestIndex = null;
  }

  protected cancelGuestEdit(): void {
    this.editingGuestIndex = null;
  }

  protected removeGuest(index: number): void {
    this.guestMembers.splice(index, 1);
  }

  // ── Action bar ───────────────────────────────────────────────────────────────

  protected addAnother(): void {
    console.log('Add another order for this group');
  }

  protected confirmOrder(): void {
    if (!this.order?.id) return;
    this.apiService.confirmOrder(this.order.id).subscribe({
      next: (updated) => {
        this.order = updated;
        this.progressStep = this.deriveProgressStep(updated.status?.code ?? '');
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Could not confirm this order.';
      },
    });
  }

  protected makeOffer(): void {
    console.log('Make offer for', this.order?.id);
  }

  protected copyLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  protected goBack(): void {
    this.router.navigate(['/orders']);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private getAdditionalService(kind: string): OrderAdditionalService | undefined {
    return this.order?.additionalServices?.find(
      (s) => s.kind.toUpperCase() === kind
    );
  }

  protected formatDate(dateString?: string): string {
    if (!dateString) return '—';
    const parts = dateString.substring(0, 10).split('-');
    if (parts.length !== 3) return dateString;
    const [y, m, d] = parts.map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return dateString;
    const date = new Date(y, m - 1, d, 12);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).replace(/ /g, '/');
  }

  protected formatTime(time?: string): string {
    if (!time) return '—';
    const parts = time.split(':');
    const hh = Number(parts[0]);
    const mm = Number(parts[1] ?? 0);
    if (isNaN(hh)) return time;
    const date = new Date();
    date.setHours(hh, mm, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', ' ');
  }

  private buildTodayLabel(): string {
    const now = new Date();
    return now
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase();
  }

  private buildMockOrder(): Order {
    return {
      orderNumber: 'H9Q2V7L8C4',
      status: { id: 1, code: 'requested', label: 'Requested' },
      isTentative: true,
      ref1: 'H9Q2V7L8C4',
      ref2: 'T6X1M5B9K3',
      reseller: { id: 1, name: 'WanderNest Travel', status: 'active' },
      picContact: { id: 1, reseller: { id: 1, name: 'WanderNest Travel', status: 'active' }, name: 'Oliver Bennett', email: 'oliver.bennett92@gmail.com', isPrimary: true },
      picEmail: 'oliver.bennett92@gmail.com',
      adultCount: 2,
      childCount: 1,
      dietaryRestrictions: 'Birthday',
      orderServices: [
        {
          service: { id: 48372, area: { id: 1, code: 'NY', name: 'New York' }, serviceType: { id: 1, code: 'FT', name: 'Food Tour' }, name: 'Secret Food Tours', isPrivateAvailable: true, isActive: true, durationMinutes: 780 },
          serviceNameSnapshot: 'Secret Food Tours',
          area: { id: 1, code: 'NY', name: 'New York' },
          serviceType: { id: 1, code: 'FT', name: 'Food Tour' },
          targetDate: '2026-03-25',
          startTime: '08:00:00',
        },
      ],
      additionalServices: [
        { kind: 'PICKUP', isEnabled: true, location: 'Silver Horizon Hotel - 45 Pinewood Avenue, Brooklyn, New York 11211', suggestedTime: '07:30:00' },
        { kind: 'DROPOFF', isEnabled: true, location: 'Sapphire Mall - 12 Rosehill Drive, Manchester M14 6PL' },
      ],
    } as Order;
  }
}
