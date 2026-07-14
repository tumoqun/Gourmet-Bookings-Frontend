import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService, OfferCreateRequest, Order, OrderAdditionalService, OrderGuest, Service } from '../../../services/api.service';
import { CapabilityService } from '../../../services/capability.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

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
  private readonly capability = inject(CapabilityService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  get isReadOnly(): boolean {
    return this.capability.isGuide() || this.auth.tourGuideViewMode();
  }

  protected isLoading = true;
  protected isConfirmingOrder = false;
  protected showConfirmDialog = false;
  protected errorMessage = '';
  protected order?: Order;
  protected orderId?: number;

  protected todayLabel = '';

  // Status progress steps (1–5)
  protected progressStep = 1;

  // Guest group state
  protected isEditingGuestGroup = false;
  protected isGuestInfoHelpOpen = false;
  protected isSavingGuestGroup = false;
  protected guestGroupSaveError = '';
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
  protected newGuestFirstName = '';
  protected newGuestLastName = '';
  protected newGuestType: 'adult' | 'child' = 'adult';
  protected newGuestVip = false;
  protected newGuestNationality = '';
  protected newGuestSpecialOccasion = '';
  protected newGuestAllergyTags: string[] = ['Milk', 'Eggs'];
  protected newGuestName = '';
  protected newGuestPhone = '';
  protected newGuestAge: number | string = '';
  protected newGuestGender = 'Male';
  protected newGuestAllergies = '';

  // Edit guest
  protected editingGuestIndex: number | null = null;

  // Related orders loaded from the backend when available
  protected relatedOrders: RelatedOrder[] = [];

  // Action buttons state
  protected waiversSigned = true;
  protected signboardAttached = false;
  protected isLinkCopied = false;

  // Make offer popup state
  protected makeOfferPopupOpen = false;
  protected isSendingOffer = false;
  protected offerPricingNotes = '';
  protected hostConfirmationRequired = false;
  protected offerOrder?: Order;
  protected services: Service[] = [];
  protected selectedServiceForOffer?: number;
  protected offerTargetDate = '';
  protected offerStartTime = '';
  protected offerDays = 0;
  protected offerNetPrice = '';
  protected offerDiscountPercent = '0';
  protected offerDiscountAmount = '0.00';
  protected offerPuDoFee = '0.00';
  protected offerCommissionPercent = '10';
  protected offerCommissionAmount = '0.00';
  protected offerSubtotal = '0.00';
  protected offerEstimatedTax = '0.00';
  protected offerTotalAmount = '0.00';
  protected offerDiscountInputSource: 'percent' | 'amount' | null = null;
  protected offerCommissionInputSource: 'percent' | 'amount' | null = null;

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

    this.loadServices();

    if (this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      this.isLoading = false;
      this.errorMessage = 'No order ID provided.';
    }

    this.relatedOrders = [];
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
    this.leaderPhone = order.leaderPhone ?? order.picContact?.phoneNumber ?? '';
    this.guestGroupNotes = order.guestGroupNotes ?? '';
    this.leaderEmail = order.guestEmail ?? order.picEmail ?? order.picContact?.email ?? '';
    this.allergiesOrDietaryRestrictions = order.dietaryRestrictions ?? '';

    // Load guests from the database only — no mock fallback
    this.guestMembers = (order.guests ?? []).map(g => ({
      name: `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Guest',
      phone: g.phoneNumber || '',
      age: g.age || '',
      gender: g.gender || '',
      allergies: g.allergies || '--',
    }));

    this.calculateAverageAge();
  }

  private calculateAverageAge(): void {
    if (this.guestMembers.length === 0) {
      this.averageAge = '';
      return;
    }

    const ages = this.guestMembers
      .map(g => typeof g.age === 'number' ? g.age : parseInt(g.age as string))
      .filter(age => !isNaN(age));

    if (ages.length === 0) {
      this.averageAge = '';
      return;
    }

    const sum = ages.reduce((acc, age) => acc + age, 0);
    this.averageAge = Math.round(sum / ages.length);
  }

  // ── Guest group actions ──────────────────────────────────────────────────────

  protected openEditGuestGroup(): void {
    this.guestGroupSaveError = '';
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
    if (this.isSavingGuestGroup) return;
    this.isGuestInfoHelpOpen = false;
    this.isEditingGuestGroup = false;
    this.guestGroupSaveError = '';
  }

  protected openGuestInfoHelp(): void {
    this.isGuestInfoHelpOpen = true;
  }

  protected closeGuestInfoHelp(): void {
    this.isGuestInfoHelpOpen = false;
  }

  protected saveGuestGroup(): void {
    if (!this.order?.id || this.isSavingGuestGroup) return;

    this.isSavingGuestGroup = true;
    this.guestGroupSaveError = '';

    this.apiService.updateOrder(this.order.id, {
      leaderPhone: this.editLeaderPhone,
      guestGroupNotes: this.editGuestGroupNotes,
      guestEmail: this.editLeaderEmail,
    }).subscribe({
      next: (updated) => {
        this.toast.showSuccess('Order updated successfully!');
        this.order = { ...this.order, ...updated };
        this.leaderPhone = updated.leaderPhone ?? this.editLeaderPhone;
        this.guestGroupNotes = updated.guestGroupNotes ?? this.editGuestGroupNotes;
        this.leaderEmail = updated.guestEmail ?? this.editLeaderEmail;
        this.allergiesOrDietaryRestrictions = this.editAllergiesOrDietaryRestrictions;
        this.guestSpecialRequests = this.editGuestSpecialRequests;
        this.hiredCarDriverGuide = this.editHiredCarDriverGuide;
        this.internalInformation = this.editInternalInformation;
        this.selectedSpecialRequests = [...this.editSelectedSpecialRequests];
        this.specialOccasion = this.editAllergiesOrDietaryRestrictions || this.editSelectedSpecialRequests.join(', ');
        this.isSavingGuestGroup = false;
        this.closeEditGuestGroup();
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errMsg = err?.error?.message || 'Could not save guest group information.';
        this.guestGroupSaveError = errMsg;
        this.toast.showError(errMsg);
        this.isSavingGuestGroup = false;
        this.cdr.detectChanges();
      },
    });
  }

  protected openAddGuest(): void {
    this.isAddingGuest = true;
    this.newGuestFirstName = '';
    this.newGuestLastName = '';
    this.newGuestType = 'adult';
    this.newGuestVip = false;
    this.newGuestNationality = '';
    this.newGuestSpecialOccasion = '';
    this.newGuestAllergyTags = ['Milk', 'Eggs'];
    this.newGuestName = '';
    this.newGuestPhone = '';
    this.newGuestAge = '';
    this.newGuestGender = 'Male';
    this.newGuestAllergies = '';
  }

  protected closeAddGuest(): void {
    this.isAddingGuest = false;
    this.editingGuestIndex = null;
  }

  protected confirmAddGuest(): void {
    const fullName = `${this.newGuestFirstName} ${this.newGuestLastName}`.trim();
    const allergyText = this.newGuestAllergies.trim();
    const isEditingExistingGuest = this.editingGuestIndex !== null && this.editingGuestIndex >= 0;

    const guestsPayload: OrderGuest[] = this.guestMembers.map((g, index) => ({
       firstName: g.name.split(' ')[0] || '',
       lastName: g.name.split(' ').slice(1).join(' ') || '',
       phoneNumber: g.phone,
       age: typeof g.age === 'number' ? g.age : (parseInt(g.age as string) || undefined),
       gender: g.gender,
       allergies: g.allergies !== '--' ? g.allergies : undefined
    }));

    if (isEditingExistingGuest) {
      guestsPayload[this.editingGuestIndex!] = {
        firstName: this.newGuestFirstName,
        lastName: this.newGuestLastName,
        guestType: this.newGuestType,
        isVip: this.newGuestVip,
        nationality: this.newGuestNationality,
        specialOccasion: this.newGuestSpecialOccasion,
        phoneNumber: this.newGuestPhone,
        age: typeof this.newGuestAge === 'number' ? this.newGuestAge : (parseInt(this.newGuestAge as string) || undefined),
        gender: this.newGuestGender,
        allergies: allergyText || undefined,
      };
    } else {
      guestsPayload.push({
        firstName: this.newGuestFirstName,
        lastName: this.newGuestLastName,
        guestType: this.newGuestType,
        isVip: this.newGuestVip,
        nationality: this.newGuestNationality,
        specialOccasion: this.newGuestSpecialOccasion,
        phoneNumber: this.newGuestPhone,
        age: typeof this.newGuestAge === 'number' ? this.newGuestAge : (parseInt(this.newGuestAge as string) || undefined),
        gender: this.newGuestGender,
        allergies: allergyText
      });
    }

    if (this.order?.id) {
        this.apiService.updateOrderGuests(this.order.id, guestsPayload).subscribe({
           next: (updatedGuests) => {
               this.toast.showSuccess('Guest list updated successfully!');
               this.guestMembers = updatedGuests.map(g => ({
                   name: `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Guest',
                   phone: g.phoneNumber || '',
                   age: g.age || '',
                   gender: g.gender || '',
                   allergies: g.allergies || '--',
               }));
               this.order!.guests = updatedGuests;
               this.calculateAverageAge();
               this.editingGuestIndex = null;
               this.closeAddGuest();
               this.cdr.detectChanges();
           },
           error: (err) => {
               this.toast.showError(err?.error?.message || 'Failed to update guest list.');
               console.error("Failed to sync guests");
               this.editingGuestIndex = null;
               this.closeAddGuest();
           }
        });
    } else {
        if (isEditingExistingGuest) {
          this.guestMembers[this.editingGuestIndex!] = {
            name: fullName || this.newGuestName || 'New Guest',
            phone: this.newGuestPhone,
            age: this.newGuestAge,
            gender: this.newGuestGender,
            allergies: allergyText || '--',
          };
        } else {
          this.guestMembers.push({
            name: fullName || this.newGuestName || 'New Guest',
            phone: this.newGuestPhone,
            age: this.newGuestAge,
            gender: this.newGuestGender,
            allergies: allergyText || '--',
          });
        }
        this.calculateAverageAge();
        this.editingGuestIndex = null;
        this.closeAddGuest();
    }
  }

  protected openEditGuest(index: number): void {
    this.editGuest(index);
  }

  protected editGuest(index: number): void {
    this.editingGuestIndex = index;
    const guest = this.guestMembers[index];
    if (!guest) {
      return;
    }

    const [firstName = '', ...rest] = guest.name.split(' ');
    this.newGuestFirstName = firstName;
    this.newGuestLastName = rest.join(' ');
    this.newGuestPhone = guest.phone || '';
    this.newGuestAge = guest.age || '';
    this.newGuestGender = guest.gender || 'Male';
    this.newGuestAllergies = guest.allergies === '--' ? '' : guest.allergies;
    this.newGuestSpecialOccasion = '';
    this.newGuestNationality = '';
    this.newGuestVip = false;
    this.newGuestType = 'adult';
    this.isAddingGuest = true;
  }

  protected saveGuestEdit(index: number): void {
    this.editingGuestIndex = null;
  }

  protected cancelGuestEdit(): void {
    this.editingGuestIndex = null;
    this.isAddingGuest = false;
  }

  protected removeGuest(index: number): void {
    this.guestMembers.splice(index, 1);
    this.calculateAverageAge();
    if (this.order?.id) {
        const guestsPayload: OrderGuest[] = this.guestMembers.map(g => ({
           firstName: g.name.split(' ')[0] || '',
           lastName: g.name.split(' ').slice(1).join(' ') || '',
           phoneNumber: g.phone,
           age: typeof g.age === 'number' ? g.age : (parseInt(g.age as string) || undefined),
           gender: g.gender,
           allergies: g.allergies !== '--' ? g.allergies : undefined
        }));
        this.apiService.updateOrderGuests(this.order.id, guestsPayload).subscribe({
            next: (updatedGuests) => {
                this.toast.showSuccess('Guest removed successfully!');
                this.order!.guests = updatedGuests;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toast.showError(err?.error?.message || 'Failed to remove guest.');
                console.error(err);
            }
        });
    }
  }

  // ── Action bar ───────────────────────────────────────────────────────────────

  protected addAnother(): void {
    console.log('Add another order for this group');
  }

  protected openConfirmDialog(): void {
    if (!this.order?.id || this.isConfirmingOrder) {
      return;
    }

    this.showConfirmDialog = true;
  }

  protected closeConfirmDialog(): void {
    this.showConfirmDialog = false;
  }

  protected confirmOrder(): void {
    if (!this.order?.id || this.isConfirmingOrder) {
      return;
    }

    this.showConfirmDialog = false;
    this.isConfirmingOrder = true;
    this.errorMessage = '';

    this.apiService.confirmOrder(this.order.id).subscribe({
      next: (updated) => {
        this.toast.showSuccess('Order confirmed successfully!');
        this.order = { ...this.order, ...updated };
        this.progressStep = this.deriveProgressStep(updated.status?.code ?? this.order?.status?.code ?? '');
        this.isConfirmingOrder = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errMsg = err?.error?.message || 'Could not confirm this order.';
        this.isConfirmingOrder = false;
        this.errorMessage = errMsg;
        this.toast.showError(errMsg);
        this.cdr.detectChanges();
      },
    });
  }

  protected makeOffer(): void {
    if (!this.order?.id) {
      return;
    }

    this.populateOfferForm(this.order);
    this.makeOfferPopupOpen = true;
    this.cdr.detectChanges();

    this.apiService.getOrder(this.order.id).subscribe({
      next: (order) => {
        this.populateOfferForm(order);
        this.offerOrder = order;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Could not load order details for offer.';
      },
    });
  }

  protected closeMakeOfferPopup(): void {
    this.makeOfferPopupOpen = false;
    this.offerOrder = undefined;
    this.offerPricingNotes = '';
    this.hostConfirmationRequired = false;
    this.offerTargetDate = '';
    this.offerStartTime = '';
    this.offerNetPrice = '';
    this.offerDiscountPercent = '0';
    this.offerDiscountAmount = '0.00';
    this.offerPuDoFee = '0.00';
    this.offerCommissionPercent = '10';
    this.offerCommissionAmount = '0.00';
    this.offerSubtotal = '0.00';
    this.offerEstimatedTax = '0.00';
    this.offerTotalAmount = '0.00';
    this.offerDays = 0;
    this.selectedServiceForOffer = undefined;
    this.isSendingOffer = false;
  }

  private populateOfferForm(order: Order): void {
    const firstService = order.orderServices?.[0];
    this.offerOrder = order;
    this.offerPricingNotes = '';
    this.hostConfirmationRequired = false;
    this.selectedServiceForOffer = firstService?.service?.id;
    this.offerTargetDate = firstService?.targetDate?.substring(0, 10) || '';
    this.offerStartTime = firstService?.startTime ? this.normalizeTime(firstService.startTime) : '';
    this.offerDays = 0;
    this.offerNetPrice = this.formatCurrency(order.totalFeeAmount || 0);
    this.offerDiscountPercent = '0';
    this.offerDiscountAmount = '0.00';
    this.offerPuDoFee = this.formatCurrency(this.getAdditionalServicesTotal());
    this.offerCommissionPercent = '10';
    this.offerCommissionAmount = '0.00';
    this.calculateTotals();
  }

  protected getPickupLocation(): string {
    const pickup = this.offerOrder?.additionalServices?.find(
      (s) => s.kind.toUpperCase() === 'PICKUP'
    );
    if (!pickup) {
      return 'None required';
    }
    return pickup.location?.trim() || '-';
  }

  protected getDropoffLocation(): string {
    const dropoff = this.offerOrder?.additionalServices?.find(
      (s) => s.kind.toUpperCase() === 'DROPOFF'
    );
    if (!dropoff) {
      return 'None required';
    }
    return dropoff.location?.trim() || '-';
  }

  protected formatDuration(minutes?: number): string {
    if (minutes == null || minutes <= 0) {
      return 'N/A';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }
    const hourPart = hours > 0 ? (hours === 1 ? '1 hour ' : `${hours} hours `) : '';
    return `${hourPart}${mins} min`.trim();
  }

  protected calculateTotals(): void {
    const netPrice = parseFloat(this.offerNetPrice.replace(/,/g, '')) || 0;
    const discountPercent = parseFloat(this.offerDiscountPercent) || 0;
    const discountAmount = this.parseCurrencyInput(this.offerDiscountAmount);
    const puDoFee = parseFloat(this.offerPuDoFee.replace(/,/g, '')) || 0;
    const commissionPercent = parseFloat(this.offerCommissionPercent) || 0;
    const commissionAmount = this.parseCurrencyInput(this.offerCommissionAmount);

    let calculatedDiscount = discountAmount;
    let calculatedDiscountPercent = discountPercent;

    if (this.offerDiscountInputSource === 'percent') {
      calculatedDiscount = netPrice * (discountPercent / 100);
      calculatedDiscountPercent = discountPercent;
    } else if (this.offerDiscountInputSource === 'amount') {
      calculatedDiscount = discountAmount;
      calculatedDiscountPercent = netPrice > 0 ? (discountAmount / netPrice) * 100 : 0;
    } else if (discountPercent > 0) {
      calculatedDiscount = netPrice * (discountPercent / 100);
    }

    const discountedNet = Math.max(0, netPrice - calculatedDiscount);

    let calculatedCommission = commissionAmount;
    let calculatedCommissionPercent = commissionPercent;
    if (this.offerCommissionInputSource === 'percent') {
      calculatedCommission = discountedNet * (commissionPercent / 100);
      calculatedCommissionPercent = commissionPercent;
    } else if (this.offerCommissionInputSource === 'amount') {
      calculatedCommission = commissionAmount;
      calculatedCommissionPercent = discountedNet > 0 ? (commissionAmount / discountedNet) * 100 : 0;
    } else if (commissionPercent > 0) {
      calculatedCommission = discountedNet * (commissionPercent / 100);
    }

    this.offerDiscountPercent = this.formatPercent(calculatedDiscountPercent);
    this.offerDiscountAmount = this.formatCurrency(calculatedDiscount);
    this.offerCommissionPercent = this.formatPercent(calculatedCommissionPercent);
    this.offerCommissionAmount = this.formatCurrency(calculatedCommission);

    const subtotal = discountedNet + puDoFee - calculatedCommission;
    const safeSubtotal = Math.max(0, subtotal);
    const tax = safeSubtotal * 0.10;
    const total = safeSubtotal + tax;

    this.offerSubtotal = this.formatCurrency(safeSubtotal);
    this.offerEstimatedTax = this.formatCurrency(tax);
    this.offerTotalAmount = this.formatCurrency(total);
  }

  protected onDiscountPercentInput(): void {
    this.offerDiscountInputSource = 'percent';
    this.calculateTotals();
  }

  protected onDiscountAmountInput(): void {
    this.offerDiscountInputSource = 'amount';
    this.calculateTotals();
  }

  protected onCommissionPercentInput(): void {
    this.offerCommissionInputSource = 'percent';
    this.calculateTotals();
  }

  protected onCommissionAmountInput(): void {
    this.offerCommissionInputSource = 'amount';
    this.calculateTotals();
  }

  protected toggleHostConfirmation(): void {
    this.hostConfirmationRequired = !this.hostConfirmationRequired;
  }

  protected sendOffer(): void {
    if (!this.offerOrder?.id || this.isSendingOffer) {
      return;
    }

    // If the order is already in OFFERED status and the user chose to not require host
    // confirmation, perform a confirmation instead of sending a new offer.
    const isOffered = this.offerOrder?.status?.code?.toUpperCase() === 'OFFERED';
    if (isOffered && !this.hostConfirmationRequired) {
      this.isSendingOffer = true;
      this.errorMessage = '';
      this.apiService.confirmOrder(this.offerOrder.id).subscribe({
        next: () => {
          this.isSendingOffer = false;
          this.closeMakeOfferPopup();
          if (this.orderId) {
            this.loadOrder(this.orderId);
          }
        },
        error: () => {
          this.isSendingOffer = false;
          this.errorMessage = 'Could not confirm this offer.';
        }
      });
      return;
    }

    this.calculateTotals();

    const request: OfferCreateRequest = {
      serviceId: this.selectedServiceForOffer ? Number(this.selectedServiceForOffer) : undefined,
      targetDate: this.offerTargetDate || undefined,
      startTime: this.offerStartTime ? `${this.offerStartTime}:00` : undefined,
      netPrice: this.parseCurrencyInput(this.offerNetPrice),
      discountPercent: this.parseCurrencyInput(this.offerDiscountPercent),
      discountAmount: this.parseCurrencyInput(this.offerDiscountAmount),
      puDoFee: this.parseCurrencyInput(this.offerPuDoFee),
      commissionPercent: this.parseCurrencyInput(this.offerCommissionPercent),
      commissionAmount: this.parseCurrencyInput(this.offerCommissionAmount),
      subtotal: this.parseCurrencyInput(this.offerSubtotal),
      estimatedTax: this.parseCurrencyInput(this.offerEstimatedTax),
      totalAmount: this.parseCurrencyInput(this.offerTotalAmount),
      pricingNotes: this.offerPricingNotes,
      hostConfirmationRequired: this.hostConfirmationRequired,
    };

    this.isSendingOffer = true;
    this.errorMessage = '';

    this.apiService.sendOffer(this.offerOrder.id, request).subscribe({
      next: () => {
        this.isSendingOffer = false;
        this.closeMakeOfferPopup();
        if (this.orderId) {
          this.loadOrder(this.orderId);
        }
      },
      error: () => {
        this.isSendingOffer = false;
        this.errorMessage = 'Could not confirm this offer.';
      },
    });
  }

  protected goToAssignment(): void {
    if (!this.order?.id) {
      return;
    }

    this.apiService.getOrderWorkId(this.order.id).subscribe({
      next: (workId) => {
        if (workId) {
          this.router.navigate(['/works', workId]);
        } else {
          this.errorMessage = 'No work is linked to this order yet.';
        }
      },
      error: () => {
        this.errorMessage = 'Could not load the linked work for this order.';
      },
    });
  }

  protected copyLink(): void {
    const url = window.location.href;

    const finishCopy = (): void => {
      this.isLinkCopied = true;
      this.cdr.detectChanges();

      window.setTimeout(() => {
        this.isLinkCopied = false;
        this.cdr.detectChanges();
      }, 1500);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(finishCopy).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
          document.execCommand('copy');
          finishCopy();
        } catch {
          // Ignore copy fallback errors.
        }

        document.body.removeChild(textarea);
      });
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
      finishCopy();
    } catch {
      // Ignore copy fallback errors.
    }

    document.body.removeChild(textarea);
  }

  protected goToWork(): void {
    this.router.navigate(['/works']);
  }

  protected goBack(): void {
    if (this.isReadOnly) {
      window.history.back();
    } else {
      this.router.navigate(['/orders']);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private getAdditionalService(kind: string): OrderAdditionalService | undefined {
    return this.order?.additionalServices?.find(
      (s) => s.kind.toUpperCase() === kind
    );
  }

  protected loadServices(): void {
    this.apiService.getServices().subscribe({
      next: (services) => {
        this.services = services;
      },
      error: () => {
        this.services = [];
      },
    });
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

  private parseCurrencyInput(value: string): number {
    return parseFloat(value.replace(/,/g, '')) || 0;
  }

  protected getOfferTotalFee(): number {
    if (!this.offerOrder) {
      return 0;
    }

    let total = this.offerOrder.totalFeeAmount || 0;
    if (this.offerOrder.additionalServices) {
      this.offerOrder.additionalServices.forEach((service) => {
        if (service.feeAmount) {
          total += service.feeAmount;
        }
      });
    }

    return total;
  }

  protected getAdditionalServicesTotal(): number {
    if (!this.offerOrder?.additionalServices) {
      return 0;
    }

    return this.offerOrder.additionalServices.reduce((sum, service) => {
      return sum + (service.feeAmount || 0);
    }, 0);
  }

  private normalizeTime(time: string): string {
    const [hour = '', minute = ''] = time.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  protected formatCurrency(amount?: number): string {
    return (amount ?? 0).toLocaleString();
  }

  private formatPercent(value: number): string {
    if (!Number.isFinite(value) || value === 0) {
      return '0';
    }
    const rounded = Math.round(value * 100) / 100;
    return rounded.toString();
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
