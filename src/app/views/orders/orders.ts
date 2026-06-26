import { Component, OnInit, ChangeDetectorRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ApiService,
  Allotment,
  Area,
  Order,
  OfferCreateRequest,
  OrderAdditionalServiceRequest,
  Service,
  ServiceType,
  Reseller,
  ResellerContact,
  Agent,
  SpecialRequestType,
  DistanceBand,
} from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CapabilityService } from '../../services/capability.service';

interface OrderRow {
  id?: number;
  resellerId?: number;
  reseller: string;
  pic: string;
  ref1: string;
  ref2: string;
  requestedDate: string;
  requestedAtRaw?: string;
  offeredDateRaw?: string;
  area: string;
  service: string[];
  type: string;
  targetDate: string[];
  pickup: string;
  guests: string;
  special: string[];
  tr: string;
  fee: string;
  status: string;
  statusTone: string;
  statusCode: string;
  guide: string;
  isPrivate?: boolean;
}

interface StatusFilter {
  label: string;
  count: string;
  active: boolean;
}

@Component({
  selector: 'app-orders-view',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersView implements OnInit {
  protected readonly capability = inject(CapabilityService);

  protected isNewOrderOpen = false;
  protected currentNewOrderStep = 1;
  protected adultGuests = 2;
  protected childGuests = 1;
  protected isLoading = false;
  protected errorMessage = '';
  protected selectedRows = 5;
  protected totalAdults = 0;
  protected totalChildren = 0;
  protected totalVolume = 0;
  protected actionPopupOpen = false;
  protected orderForAction?: number;
  protected actionPopupPosition = { top: 0, left: 0 };
  protected makeOfferPopupOpen = false;
  protected confirmOrderPromptOpen = false;
  protected actionConfirmPromptOpen = false;
  protected actionConfirmMode: 'confirm' | 'cancel' | 'delete' | null = null;
  protected isSendingOffer = false;
  protected offerPricingNotes = '';
  protected hostConfirmationRequired = false;
  protected offerOrder?: Order;
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

  protected readonly timeSlots = ['Any', 'Morning', 'Daytime', 'Evening', 'Night'];
  protected selectedTimeSlot = 'Any';
  protected selectedService?: Service;
  protected selectedArea?: Area;
  protected selectedServiceType?: ServiceType;
  protected services: Service[] = [];
  protected filteredServices: Service[] = [];
  protected serviceAllotments: Allotment[] = [];
  protected dateAllotments: Allotment[] = [];
  protected isLoadingDateAllotments = false;
  protected isLoadingServiceTimes = false;
  protected serviceTimesMessage = 'Select a target date and service to see start times.';
  protected areas: Area[] = [];
  protected serviceTypes: ServiceType[] = [];
  protected distanceBands: DistanceBand[] = [];
  protected vehicleTypes = ['Taxi', 'Hired Car', 'Grabbike'];

  protected resellers: Reseller[] = [];
  protected contacts: ResellerContact[] = [];
  protected agents: Agent[] = [];
  protected filteredContacts: ResellerContact[] = [];
  protected filteredAgents: Agent[] = [];

  protected selectedFilterReseller = '';
  protected selectedFilterPic = '';
  protected selectedFilterRef = '';
  protected selectedFilterService = '';
  protected selectedFilterStatus = 'all';
  protected selectedFilterRequestedDate = '';
  protected selectedFilterOfferedDate = '';
  protected filterPrivateOnly = false;
  protected activeCalendarField: 'requested' | 'offered' | null = null;
  protected calendarMonth = new Date().getMonth();
  protected calendarYear = new Date().getFullYear();
  protected calendarMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  protected calendarWeekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  protected resellerOptions: string[] = [];
  protected picOptions: string[] = [];
  protected serviceOptions: string[] = [];
  protected statusOptions: { code: string; label: string }[] = [{ code: 'all', label: 'All Statuses' }];

  protected selectedResellerId?: number;
  protected selectedContactId?: number;
  protected selectedAgentId?: number;

  protected isTentativeNewOrder = false;
  protected createdByNameNewOrder = '';
  protected picEmailNewOrder = '';
  protected copyEmailNewOrder = '';
  protected guestEmailNewOrder = '';
  protected targetDateNewOrder = '';
  protected minTargetDate = this.toDateInputValue(new Date());
  protected startTimeNewOrder = '';
  protected selectedAllotmentId?: number;
  protected voucherNumberNewOrder = '';
  protected pickupEnabled = false;
  protected pickupLocationNewOrder = '';
  protected pickupVehicleType?: string;
  protected pickupDistanceId?: number;
  protected dropoffLocationNewOrder = '';
  protected dropoffVehicleType?: string;
  protected dropoffDistanceId?: number;
  protected dietaryRestrictionsNewOrder = '';
  protected specialRequestTypes: SpecialRequestType[] = [];
  protected selectedSpecialRequestIds: number[] = [];
  protected handoffTextNewOrder = '';
  protected selectedAreaId?: number;
  protected selectedServiceTypeId?: number;
  protected dropoffSelected: 'DROP' | 'HAND' = 'DROP';
  protected isPrivateNewOrder = true;
  protected ref1NewOrder = '';
  protected ref2NewOrder = '';

  protected filters: StatusFilter[] = [
    { label: 'All Orders', count: '0', active: true },
    { label: 'Guide Changes', count: '0', active: false },
    { label: 'Problem Reports', count: '0', active: false },
    { label: 'Tour Reports', count: '0', active: false },
    { label: 'Tentative', count: '0', active: false },
    { label: 'Offered', count: '0', active: false },
    { label: 'Requests', count: '0', active: false },
  ];

  protected orders: OrderRow[] = [];
  protected allOrders: OrderRow[] = [];
  protected filteredOrders: OrderRow[] = [];
  protected currentPage = 1;
  protected totalPages = 1;

  constructor(
    private apiService: ApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadServices();
    this.loadAreas();
    this.loadServiceTypes();
    this.loadDistanceBands();
    this.loadResellersData();
    this.loadSpecialRequestTypes();
  }

  protected loadSpecialRequestTypes(): void {
    this.apiService.getSpecialRequestTypes().subscribe({
      next: (types) => this.specialRequestTypes = types,
      error: () => this.specialRequestTypes = []
    });
  }

  protected loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getOrders().subscribe({
      next: (orders) => {
        Promise.resolve().then(() => {
          this.allOrders = orders.map((order) => this.mapOrderToRow(order));
          this.buildFilterOptions();
          this.applySearchFilters();
          this.updateFilterCounts();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        Promise.resolve().then(() => {
          this.errorMessage = 'Could not load orders from the backend.';
          this.allOrders = [];
          this.orders = [];
          this.filteredOrders = [];
          this.buildFilterOptions();
          this.updateFilterCounts();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  private buildFilterOptions(): void {
    const resellers = new Set<string>();
    const pics = new Set<string>();
    const services = new Set<string>();
    const statuses = new Map<string, string>();

    this.allOrders.forEach((order) => {
      if (order.reseller) {
        resellers.add(order.reseller);
      }
      if (order.pic) {
        pics.add(order.pic);
      }
      order.service.forEach((service) => {
        const normalizedService = service.startsWith('[modified]') ? service.slice(10) : service;
        services.add(normalizedService);
      });
      if (order.statusCode) {
        const code = order.statusCode.toLowerCase();
        statuses.set(code, order.status || order.statusCode);
      }
    });

    this.resellerOptions = [...resellers].sort((a, b) => a.localeCompare(b));
    this.picOptions = [...pics].sort((a, b) => a.localeCompare(b));
    this.serviceOptions = [...services].sort((a, b) => a.localeCompare(b));
    this.statusOptions = [
      { code: 'all', label: 'All Statuses' },
      ...Array.from(statuses.entries()).map(([code, label]) => ({ code, label })),
    ];
  }

  protected applySearchFilters(): void {
    let filtered = [...this.allOrders];
    const activeFilter = this.filters.find((filter) => filter.active);

    if (activeFilter && activeFilter.label !== 'All Orders') {
      filtered = filtered.filter((order) => {
        switch (activeFilter.label) {
          case 'Tentative':
            return false;
          case 'Offered':
            return order.statusCode.toLowerCase() === 'offered';
          case 'Requests':
            return order.statusCode.toLowerCase() === 'requested';
          case 'Guide Changes':
          case 'Problem Reports':
          case 'Tour Reports':
            return false;
          default:
            return true;
        }
      });
    }

    if (this.selectedFilterReseller) {
      filtered = filtered.filter((order) => order.reseller === this.selectedFilterReseller);
    }

    if (this.selectedFilterPic) {
      filtered = filtered.filter((order) => order.pic === this.selectedFilterPic);
    }

    if (this.selectedFilterRef.trim()) {
      const refQuery = this.selectedFilterRef.trim().toLowerCase();
      filtered = filtered.filter((order) => {
        const refs = [order.ref1, order.ref2].filter((value): value is string => Boolean(value));
        return refs.some((ref) => ref.toLowerCase().includes(refQuery));
      });
    }

    if (this.selectedFilterService) {
      filtered = filtered.filter((order) =>
        order.service.some((service) => {
          const normalizedService = service.startsWith('[modified]') ? service.slice(10) : service;
          return normalizedService === this.selectedFilterService;
        }),
      );
    }

    if (this.selectedFilterStatus && this.selectedFilterStatus !== 'all') {
      filtered = filtered.filter(
        (order) => order.statusCode.toLowerCase() === this.selectedFilterStatus.toLowerCase(),
      );
    }

    if (this.selectedFilterRequestedDate) {
      filtered = filtered.filter((order) =>
        this.matchesDate(order.requestedAtRaw, this.selectedFilterRequestedDate),
      );
    }

    if (this.selectedFilterOfferedDate) {
      filtered = filtered.filter((order) =>
        this.matchesDate(order.offeredDateRaw, this.selectedFilterOfferedDate),
      );
    }

    if (this.filterPrivateOnly) {
      filtered = filtered.filter((order) => order.type === "P");
    }

    this.filteredOrders = filtered;
    this.currentPage = 1;
    this.applyPagination();
    this.updateTotals();
  }

  private matchesDate(rawValue: string | undefined, filterValue: string): boolean {
    if (!rawValue) {
      return false;
    }

    const rawDate = rawValue.substring(0, 10);
    const normalizedFilter = filterValue.trim();
    return rawDate === normalizedFilter;
  }

  protected clearSearchFilters(): void {
    this.selectedFilterReseller = '';
    this.selectedFilterPic = '';
    this.selectedFilterRef = '';
    this.selectedFilterService = '';
    this.selectedFilterStatus = 'all';
    this.selectedFilterRequestedDate = '';
    this.selectedFilterOfferedDate = '';
    this.filterPrivateOnly = false;
    this.activeCalendarField = null;
    this.applySearchFilters();
  }

  protected openDateCalendar(field: 'requested' | 'offered', event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeCalendarField === field) {
      this.activeCalendarField = null;
      return;
    }

    this.activeCalendarField = field;
    const selected = field === 'requested' ? this.selectedFilterRequestedDate : this.selectedFilterOfferedDate;
    if (selected) {
      const [year, month] = selected.split('-').map(Number);
      if (!Number.isNaN(year) && !Number.isNaN(month)) {
        this.calendarYear = year;
        this.calendarMonth = month - 1;
      }
    }
  }

  protected changeCalendarMonth(monthDelta: number, event: MouseEvent): void {
    event.stopPropagation();
    const newMonth = this.calendarMonth + monthDelta;
    if (newMonth < 0) {
      this.calendarMonth = 11;
      this.calendarYear -= 1;
    } else if (newMonth > 11) {
      this.calendarMonth = 0;
      this.calendarYear += 1;
    } else {
      this.calendarMonth = newMonth;
    }
  }

  protected buildCalendarDays(year: number, month: number): number[] {
    const firstDay = new Date(year, month, 1).getDay();
    const length = new Date(year, month + 1, 0).getDate();
    const days: number[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(0);
    }
    for (let day = 1; day <= length; day++) {
      days.push(day);
    }
    while (days.length % 7 !== 0) {
      days.push(0);
    }
    return days;
  }

  protected selectCalendarDate(field: 'requested' | 'offered', date: number, event: MouseEvent): void {
    event.stopPropagation();
    if (date <= 0) {
      return;
    }
    const formatted = `${this.calendarYear.toString().padStart(4, '0')}-${(this.calendarMonth + 1).toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
    if (field === 'requested') {
      this.selectedFilterRequestedDate = formatted;
    } else {
      this.selectedFilterOfferedDate = formatted;
    }
    this.activeCalendarField = null;
  }

  protected isSelectedCalendarDate(field: 'requested' | 'offered', date: number): boolean {
    if (date <= 0) {
      return false;
    }
    const selected = field === 'requested' ? this.selectedFilterRequestedDate : this.selectedFilterOfferedDate;
    return selected === `${this.calendarYear.toString().padStart(4, '0')}-${(this.calendarMonth + 1).toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
  }

  protected togglePrivateFilter(): void {
    this.filterPrivateOnly = !this.filterPrivateOnly;
    this.applySearchFilters();
  }

  protected onRowsChange(value: number): void {
    this.selectedRows = value || 5;
    this.currentPage = 1; // Reset to first page when rows per page changes
    this.applyPagination();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.applyPagination();
  }

  protected goToFirstPage(): void {
    this.goToPage(1);
  }

  protected goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  protected goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  protected goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  protected getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  protected loadServices(): void {
    this.apiService.getServices().subscribe({
      next: (services) => {
        this.services = services;
        this.applyServiceFilters();
      },
      error: () => {
        this.errorMessage = this.errorMessage || 'Could not load services from the backend.';
        this.services = [];
        this.filteredServices = [];
        this.areas = [];
        this.serviceTypes = [];
      },
    });
  }

  protected loadAreas(): void {
    this.apiService.getAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
      },
      error: () => {
        this.areas = this.uniqueById(this.services.map((service) => service.area).filter(Boolean));
      },
    });
  }

  protected loadServiceTypes(): void {
    this.apiService.getServiceTypes().subscribe({
      next: (serviceTypes) => {
        this.serviceTypes = serviceTypes;
      },
      error: () => {
        this.serviceTypes = this.uniqueById(this.services.map((service) => service.serviceType).filter(Boolean));
      },
    });
  }

  protected loadDistanceBands(): void {
    this.apiService.getDistanceBands().subscribe({
      next: (distanceBands) => {
        this.distanceBands = distanceBands;
      },
      error: () => {
        this.distanceBands = [];
      },
    });
  }

  protected loadResellersData(): void {
    this.apiService.getResellers().subscribe({
      next: (resellers) => {
        this.resellers = resellers;
        this.cdr.detectChanges();
      },
      error: () => {
        this.resellers = [];
      }
    });
    this.apiService.getResellerContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        // Show all contacts by default until a reseller is selected
        if (!this.selectedResellerId) {
          this.filteredContacts = contacts;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.contacts = [];
        this.filteredContacts = [];
      }
    });
    this.apiService.getAgents().subscribe({
      next: (agents) => {
        this.agents = agents;
        // Show all agents by default until a reseller is selected
        if (!this.selectedResellerId) {
          this.filteredAgents = agents;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.agents = [];
        this.filteredAgents = [];
      }
    });
  }

  protected onResellerChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const resellerId = Number(select.value);
    this.selectedResellerId = resellerId || undefined;

    if (resellerId) {
      // Filter to only the selected reseller's contacts and agents
      this.filteredContacts = this.contacts.filter(c => Number(c.reseller?.id) === resellerId);
      this.filteredAgents = this.agents.filter(a => Number(a.reseller?.id) === resellerId);
    } else {
      // No reseller selected — show all
      this.filteredContacts = [...this.contacts];
      this.filteredAgents = [...this.agents];
    }
    this.selectedContactId = undefined;
    this.selectedAgentId = undefined;
    this.picEmailNewOrder = '';
    this.cdr.detectChanges();
  }

  protected onContactChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const contactId = Number(select.value);
    this.selectedContactId = contactId || undefined;

    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      this.picEmailNewOrder = contact.email;
    } else {
      this.picEmailNewOrder = '';
    }
  }

  protected onAgentChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const agentId = Number(select.value);
    this.selectedAgentId = agentId || undefined;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected onTargetDateChange(value: string): void {
    this.targetDateNewOrder = value;
    this.startTimeNewOrder = '';
    this.selectedAllotmentId = undefined;
    this.dateAllotments = [];
    this.loadDateAllotments();
    this.loadServiceTimes();
  }

  protected onAreaChange(value: any): void {
    const id = Number(value);
    this.selectedAreaId = id || undefined;
    this.selectedArea = this.areas.find(a => a.id === id);
    this.selectedService = undefined;
    this.startTimeNewOrder = '';
    this.selectedAllotmentId = undefined;
    this.serviceAllotments = [];
    this.loadServiceTimes();
    this.applyServiceFilters();
  }

  protected onServiceTypeChange(value: any): void {
    const id = Number(value);
    this.selectedServiceTypeId = id || undefined;
    this.selectedServiceType = this.serviceTypes.find(st => st.id === id);
    this.selectedService = undefined;
    this.startTimeNewOrder = '';
    this.selectedAllotmentId = undefined;
    this.serviceAllotments = [];
    this.loadServiceTimes();
    this.applyServiceFilters();
  }

  protected onDropoffSelectionChange(value: string): void {
    this.dropoffSelected = value === 'HAND' ? 'HAND' : 'DROP';

    if (this.dropoffSelected === 'HAND') {
      this.dropoffLocationNewOrder = '';
      this.dropoffVehicleType = undefined;
      this.dropoffDistanceId = undefined;
      return;
    }

    this.handoffTextNewOrder = '';
  }

  protected openNewOrderModal(): void {
    this.isNewOrderOpen = true;
    this.currentNewOrderStep = 1;
    this.errorMessage = '';
    this.isTentativeNewOrder = false;
    this.createdByNameNewOrder = this.getDefaultNewOrderCreator();
    this.picEmailNewOrder = '';
    this.copyEmailNewOrder = '';
    this.guestEmailNewOrder = '';
    this.dietaryRestrictionsNewOrder = '';
    this.selectedSpecialRequestIds = [];
    this.voucherNumberNewOrder = '';
    this.pickupEnabled = false;
    this.pickupLocationNewOrder = '';
    this.pickupVehicleType = undefined;
    this.pickupDistanceId = undefined;
    this.dropoffLocationNewOrder = '';
    this.dropoffVehicleType = undefined;
    this.dropoffDistanceId = undefined;
    this.handoffTextNewOrder = '';
    this.dropoffSelected = 'DROP';
    this.isPrivateNewOrder = true;
    this.ref1NewOrder = '';
    this.ref2NewOrder = '';
    this.selectedResellerId = undefined;
    this.selectedContactId = undefined;
    this.selectedAgentId = undefined;
    this.targetDateNewOrder = '';
    this.startTimeNewOrder = '';
    this.selectedTimeSlot = 'Any';
    this.selectedService = undefined;
    this.selectedArea = undefined;
    this.selectedServiceType = undefined;
    this.selectedAreaId = undefined;
    this.selectedServiceTypeId = undefined;
    this.selectedAllotmentId = undefined;
    this.serviceAllotments = [];
    this.dateAllotments = [];
    this.isLoadingDateAllotments = false;
    this.serviceTimesMessage = 'Select a target date and service to see start times.';
    // Reset to show all when modal is re-opened
    this.filteredContacts = [...this.contacts];
    this.filteredAgents = [...this.agents];
    this.applyServiceFilters();
  }

  protected closeNewOrderModal(): void {
    this.isNewOrderOpen = false;
    this.currentNewOrderStep = 1;
  }

  protected togglePickupEnabled(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.pickupEnabled = target.checked;
    if (!this.pickupEnabled) {
      this.pickupLocationNewOrder = '';
      this.pickupVehicleType = undefined;
      this.pickupDistanceId = undefined;
    }
  }

  private getDefaultNewOrderCreator(): string {
    const user = this.auth.currentUser();
    if (!user) {
      return '';
    }

    if (this.capability.isAdmin()) {
      return 'Tour Admin';
    }

    if (this.capability.isAgent()) {
      const agent = this.agents.find((a) => a.email === user.email);
      return agent?.reseller?.name ?? user.fullName;
    }

    return user.fullName;
  }

  protected setNewOrderStep(step: number): void {
    if (step < 1 || step > 4 || !this.canAccessNewOrderStep(step)) {
      return;
    }

    this.currentNewOrderStep = step;
  }

  protected canAccessNewOrderStep(step: number): boolean {
    if (step <= this.currentNewOrderStep) {
      return true;
    }

    for (let currentStep = 1; currentStep < step; currentStep += 1) {
      if (!this.isNewOrderStepValid(currentStep)) {
        return false;
      }
    }

    return true;
  }

  protected getNewOrderPrimaryActionLabel(): string {
    return this.currentNewOrderStep === 4 ? 'Request Order' : 'Next';
  }

  protected handleNewOrderPrimaryAction(): void {
    if (!this.isCurrentNewOrderStepValid()) {
      return;
    }

    if (this.currentNewOrderStep < 4) {
      this.currentNewOrderStep += 1;
      return;
    }

    this.createOrder();
  }

  protected isCurrentNewOrderStepValid(): boolean {
    return this.isNewOrderStepValid(this.currentNewOrderStep);
  }

  private isNewOrderStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.isStepOneValid();
      case 2:
        return this.isStepTwoValid();
      case 3:
        return this.isStepThreeValid();
      case 4:
        return this.isStepFourValid();
      default:
        return false;
    }
  }

  private isStepOneValid(): boolean {
    return this.hasValue(this.createdByNameNewOrder)
      && this.hasValue(this.picEmailNewOrder)
      && this.hasValue(this.ref1NewOrder)
      && this.selectedResellerId != null
      && this.selectedAgentId != null
      && this.selectedContactId != null;
  }

  private isStepTwoValid(): boolean {
    return this.hasValue(this.targetDateNewOrder)
      && this.selectedAreaId != null
      && this.selectedServiceTypeId != null
      && this.selectedService != null
      && this.selectedAllotmentId != null
      && this.hasValue(this.startTimeNewOrder);
  }

  private isStepThreeValid(): boolean {
    if (this.pickupEnabled) {
      if (!this.hasValue(this.pickupLocationNewOrder) || !this.pickupVehicleType || this.pickupDistanceId == null) {
        return false;
      }
    }

    if (this.dropoffSelected === 'HAND') {
      return true;
    }

    return true;
  }

  private isStepFourValid(): boolean {
    return this.adultGuests >= 0
      && this.childGuests >= 0;
  }

  private hasValue(value?: string): boolean {
    return !!value?.trim();
  }

  protected adjustGuestCount(type: 'adult' | 'child', change: number): void {
    if (type === 'adult') {
      this.adultGuests = Math.max(0, this.adultGuests + change);
      return;
    }

    this.childGuests = Math.max(0, this.childGuests + change);
  }

  protected formatGuestCount(count: number): string {
    return count.toString().padStart(2, '0');
  }

  protected toggleSpecialRequest(id: number): void {
    const index = this.selectedSpecialRequestIds.indexOf(id);
    if (index > -1) {
      this.selectedSpecialRequestIds.splice(index, 1);
    } else {
      this.selectedSpecialRequestIds.push(id);
    }
  }

  protected getSpecialRequestTableIcon(code: string): string {
    const normalizedCode = code.toLowerCase();
    const iconMap: Record<string, string> = {
      vip: 'VIP',
      child: '12',
      diet: 'D',
    };

    return iconMap[normalizedCode] ?? '';
  }

  protected formatSpecialRequestLabel(code: string): string {
    const normalizedCode = code.toLowerCase();
    const labelMap: Record<string, string> = {
      vip: 'VIP Guest',
      bag: 'Baggage Handling',
      eye: 'Eye Contact',
      fork: 'Fork & Spoon',
      link: 'Linked Orders',
      wheel: 'Wheelchair Access',
      child: 'Child Care',
      diet: 'Dietary Restriction',
    };

    return labelMap[normalizedCode] ?? code.toUpperCase();
  }

  protected selectTimeSlot(slot: string): void {
    this.selectedTimeSlot = slot;
    this.selectedService = undefined;
    this.startTimeNewOrder = '';
    this.selectedAllotmentId = undefined;
    this.serviceAllotments = [];
    this.applyServiceFilters();
  }

  protected togglePrivateGroup(): void {
    this.isPrivateNewOrder = !this.isPrivateNewOrder;
  }

  private applyServiceFilters(): void {
    let filtered = [...this.services];

    // Filter by area
    if (this.selectedAreaId) {
      filtered = filtered.filter(s => s.area?.id === this.selectedAreaId);
    }

    // Filter by service type
    if (this.selectedServiceTypeId) {
      filtered = filtered.filter(s => s.serviceType?.id === this.selectedServiceTypeId);
    }

    // Filter by time slot: keep services that support private if slot is selected,
    // or simply narrow by a future hook; for now all services are shown per slot
    // (the DB does not store per-service time slots — slot is stored on order_services)
    // The slot selection mainly sets startTime; no further service exclusion needed.

    if (this.selectedTimeSlot !== 'Any') {
      if (!this.targetDateNewOrder) {
        filtered = [];
      } else {
        const serviceIdsWithMatchingTime = new Set(
          this.dateAllotments
            .filter((allotment) => this.isAllotmentInSelectedSlot(allotment))
            .map((allotment) => allotment.serviceId),
        );
        filtered = filtered.filter((service) => serviceIdsWithMatchingTime.has(service.id));
      }
    }

    this.filteredServices = filtered;
  }

  protected selectService(service: Service): void {
    this.selectedService = service;
    this.selectedArea = service.area;
    this.selectedServiceType = service.serviceType;
    this.selectedAreaId = service.area.id;
    this.selectedServiceTypeId = service.serviceType.id;
    this.startTimeNewOrder = '';
    this.selectedAllotmentId = undefined;
    this.applyServiceFilters();
    this.loadServiceTimes();
  }

  protected selectServiceTime(allotment: Allotment): void {
    this.selectedAllotmentId = allotment.id;
    this.startTimeNewOrder = this.normalizeTime(allotment.startTime);
    this.selectedTimeSlot = 'Any';
  }

  protected formatAllotmentTime(time?: string): string {
    return this.formatTime(time);
  }

  private loadServiceTimes(): void {
    this.serviceAllotments = [];

    if (!this.selectedService || !this.targetDateNewOrder) {
      this.isLoadingServiceTimes = false;
      this.serviceTimesMessage = 'Select a target date and service to see start times.';
      return;
    }

    this.isLoadingServiceTimes = true;
    this.serviceTimesMessage = '';

    this.apiService.getAllotmentsByServiceAndDate(this.selectedService.id, this.targetDateNewOrder).subscribe({
      next: (allotments) => {
        this.serviceAllotments = allotments;
        this.isLoadingServiceTimes = false;
        this.serviceTimesMessage = allotments.length ? '' : 'No start times for this service on the selected date.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.serviceAllotments = [];
        this.isLoadingServiceTimes = false;
        this.serviceTimesMessage = 'Could not load start times for this service.';
        this.cdr.detectChanges();
      },
    });
  }

  private loadDateAllotments(): void {
    if (!this.targetDateNewOrder) {
      this.dateAllotments = [];
      this.isLoadingDateAllotments = false;
      this.applyServiceFilters();
      return;
    }

    this.isLoadingDateAllotments = true;

    this.apiService.getAllotmentsByDate(this.targetDateNewOrder).subscribe({
      next: (allotments) => {
        this.dateAllotments = allotments;
        this.isLoadingDateAllotments = false;
        this.applyServiceFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.dateAllotments = [];
        this.isLoadingDateAllotments = false;
        this.applyServiceFilters();
        this.cdr.detectChanges();
      },
    });
  }

  private isAllotmentInSelectedSlot(allotment: Allotment): boolean {
    const minutes = this.timeToMinutes(allotment.startTime);

    switch (this.selectedTimeSlot) {
      case 'Morning':
        return minutes >= 5 * 60 && minutes < 12 * 60;
      case 'Daytime':
        return minutes >= 12 * 60 && minutes < 17 * 60;
      case 'Evening':
        return minutes >= 17 * 60 && minutes < 21 * 60;
      case 'Night':
        return minutes >= 21 * 60 || minutes < 5 * 60;
      default:
        return true;
    }
  }

  protected setActiveFilter(filterLabel: string): void {
    this.filters = this.filters.map((filter) => ({
      ...filter,
      active: filter.label === filterLabel,
    }));
    this.applySearchFilters();
  }

  private applyActiveFilter(): void {
    const activeFilter = this.filters.find(f => f.active);
    if (!activeFilter) {
      this.filteredOrders = [...this.allOrders];
    } else {
      switch (activeFilter.label) {
        case 'All Orders':
          this.filteredOrders = [...this.allOrders];
          break;
        case 'Tentative':
          this.filteredOrders = this.allOrders.filter(order => false);
          break;
        case 'Offered':
          this.filteredOrders = this.allOrders.filter(order => {
            const code = order.statusCode.toLowerCase();
            return code === 'offered';
          });
          break;
        case 'Requests':
          this.filteredOrders = this.allOrders.filter(order => {
            const code = order.statusCode.toLowerCase();
            return code === 'requested';
          });
          break;
        case 'Guide Changes':
        case 'Problem Reports':
        case 'Tour Reports':
          this.filteredOrders = [];
          break;
        default:
          this.filteredOrders = [...this.allOrders];
      }
    }

    this.currentPage = 1;
    this.applyPagination();
    this.updateTotals();
  }

  private applyPagination(): void {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.selectedRows) || 1;

    // Ensure currentPage is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.selectedRows;
    const endIndex = startIndex + this.selectedRows;
    this.orders = this.filteredOrders.slice(startIndex, endIndex);
  }

  private updateTotals(): void {
    this.totalAdults = this.orders.reduce((sum, order) => {
      const adults = parseInt(order.guests.split('/')[0], 10) || 0;
      return sum + adults;
    }, 0);

    this.totalChildren = this.orders.reduce((sum, order) => {
      const children = parseInt(order.guests.split('/')[1], 10) || 0;
      return sum + children;
    }, 0);

    this.totalVolume = this.orders.reduce((sum, order) => {
      const fee = parseFloat(order.fee.replace(/,/g, '')) || 0;
      return sum + fee;
    }, 0);
  }

  protected createOrder(): void {
    this.errorMessage = '';

    const orderData = {
      orderNumber: `ORD-${Date.now()}`,
      orderChannel: 'frontend',
      isTentative: this.isTentativeNewOrder,
      isPrivate: this.isPrivateNewOrder,
      createdByName: this.createdByNameNewOrder || 'Alexander Pierce',
      resellerId: this.selectedResellerId,
      picContactId: this.selectedContactId,
      picEmail: this.picEmailNewOrder,
      copyEmail: this.copyEmailNewOrder,
      guestEmail: this.guestEmailNewOrder,
      dietaryRestrictions: this.dietaryRestrictionsNewOrder,
      specialRequestTypeIds: this.selectedSpecialRequestIds,
      originalAgentId: this.selectedAgentId,
      voucherNumber: this.voucherNumberNewOrder,
      additionalServices: this.buildAdditionalServices(),
      ref1: this.ref1NewOrder,
      ref2: this.ref2NewOrder,
      adultCount: this.adultGuests,
      childCount: this.childGuests,
      currencyCode: 'JPY',
      requestedAt: new Date().toISOString().slice(0, 19),
      orderServices: this.selectedService
        ? [
            {
              serviceId: this.selectedService.id,
              serviceNameSnapshot: this.selectedService.name,
              areaId: this.selectedService.area.id,
              serviceTypeId: this.selectedService.serviceType.id,
              targetDate: this.targetDateNewOrder || undefined,
              startTime: this.startTimeNewOrder || undefined,
              timeSlotCode: this.selectedTimeSlot === 'Any' ? undefined : this.selectedTimeSlot.toUpperCase(),
              timezone: 'Asia/Tokyo',
            },
          ]
        : undefined,
    };

    this.isLoading = true;
    this.apiService.createOrder(orderData).subscribe({
      next: (createdOrder) => {
        this.closeNewOrderModal();
        this.router.navigate(['/orders', createdOrder.id]);
      },
      error: () => {
        this.errorMessage = 'Could not create the order in the backend.';
        this.isLoading = false;
      },
    });
  }

  protected submitOrder(orderId?: number): void {
    if (!orderId) {
      return;
    }

    this.apiService.submitOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'Could not submit this order.';
      },
    });
  }

  protected cancelOrder(orderId?: number): void {
    if (!orderId) {
      return;
    }

    this.apiService.cancelOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'Could not cancel this order.';
      },
    });
  }

  protected confirmActionDeletion(): void {
    if (!this.orderForAction) {
      this.closeActionConfirmDialog();
      return;
    }

    if (this.actionConfirmMode === 'cancel') {
      this.cancelOrder(this.orderForAction);
    } else if (this.actionConfirmMode === 'delete') {
      this.deleteOrder();
    }

    this.closeActionConfirmDialog();
  }

  protected showActionPopup(event: Event, orderId?: number): void {
    if (!orderId) {
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const popupWidth = 220;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let left = rect.left;
    let top = rect.bottom + 5;

    if (left + popupWidth > screenWidth) {
      left = screenWidth - popupWidth - 10;
    }

    left = Math.max(10, left);

    this.orderForAction = orderId;
    this.actionPopupOpen = true;
    this.cdr.detectChanges();

    window.requestAnimationFrame(() => {
      const menuElement = document.querySelector('.menu') as HTMLElement | null;
      const menuHeight = menuElement?.offsetHeight ?? 320;
      const spaceBelow = screenHeight - rect.bottom - 10;
      const spaceAbove = rect.top - 10;

      if (spaceBelow < menuHeight && spaceAbove >= menuHeight) {
        top = rect.top - menuHeight - 5;
      } else if (spaceBelow < menuHeight) {
        top = Math.max(10, screenHeight - menuHeight - 10);
      }

      this.actionPopupPosition = { top: Math.max(10, top), left };
      this.cdr.detectChanges();
    });
  }

  protected makeOffer(): void {
    if (this.orderForAction) {
      // Load the order details for the offer popup
      this.apiService.getOrder(this.orderForAction).subscribe({
        next: (order) => {
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
          this.makeOfferPopupOpen = true;
          this.closeActionPopup();
        },
        error: () => {
          this.errorMessage = 'Could not load order details for offer.';
        }
      });
    }
  }

  protected closeActionPopup(): void {
    this.actionPopupOpen = false;
    if (!this.confirmOrderPromptOpen && !this.actionConfirmPromptOpen) {
      this.orderForAction = undefined;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (this.actionPopupOpen && !target.closest('.menu') && !target.closest('.more-action')) {
      this.closeActionPopup();
    }

    if (this.activeCalendarField && !target.closest('.calendar-popover') && !target.closest('.date-field')) {
      this.activeCalendarField = null;
    }
  }

  protected addAnother(): void {
    // TODO: Implement add another functionality
    console.log('Add another for order:', this.orderForAction);
  }

  protected viewGuestDetails(): void {
    if (this.orderForAction) {
      this.router.navigate(['/orders', this.orderForAction]);
    }
  }

  protected editOrder(): void {
    // TODO: Implement edit order functionality
    console.log('Edit order:', this.orderForAction);
  }

  protected requestChange(): void {
    // TODO: Implement request change functionality
    console.log('Request change for order:', this.orderForAction);
  }

  protected editFees(): void {
    // TODO: Implement edit fees functionality
    console.log('Edit fees for order:', this.orderForAction);
  }

  protected goToAssignment(): void {
    // TODO: Implement go to assignment functionality
    console.log('Go to assignment for order:', this.orderForAction);
  }

  protected openConfirmOrderDialog(): void {
    this.confirmOrderPromptOpen = true;
  }

  protected openActionConfirmDialog(mode: 'cancel' | 'delete'): void {
    this.actionConfirmMode = mode;
    this.actionConfirmPromptOpen = true;
    this.actionPopupOpen = false;
  }

  protected closeActionConfirmDialog(): void {
    this.actionConfirmPromptOpen = false;
    this.actionConfirmMode = null;
  }

  protected closeConfirmOrderDialog(): void {
    this.confirmOrderPromptOpen = false;
    this.orderForAction = undefined;
  }

  protected confirmOrder(): void {
    if (!this.orderForAction) {
      this.closeConfirmOrderDialog();
      return;
    }

    this.confirmOrderPromptOpen = false;
    const orderId = this.orderForAction;
    this.orderForAction = undefined;
    this.apiService.confirmOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'Could not confirm this order.';
      },
    });
  }

  protected copyLink(): void {
    // TODO: Implement copy link functionality
    console.log('Copy link for order:', this.orderForAction);
  }

  protected deleteOrder(): void {
    if (!this.orderForAction) {
      return;
    }

    this.apiService.deleteOrder(this.orderForAction).subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'Could not delete this order.';
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

  protected findMatch(): void {
    // TODO: Implement find match logic
    console.log('Find match for', this.offerDays, 'days');
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
    const tax = safeSubtotal * 0.08; // 8% tax rate
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
        this.loadOrders();
      },
      error: () => {
        this.isSendingOffer = false;
        this.errorMessage = 'Could not confirm this offer.';
      },
    });
  }

  private parseCurrencyInput(value: string): number {
    return parseFloat(value.replace(/,/g, '')) || 0;
  }

  protected getOfferTotalFee(): number {
    if (!this.offerOrder) {
      return 0;
    }

    let total = this.offerOrder.totalFeeAmount || 0;

    // Add additional services fees
    if (this.offerOrder.additionalServices) {
      this.offerOrder.additionalServices.forEach(service => {
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

  protected getPickupFee(distanceId?: number): string {
    return this.getAdditionalServiceFee(distanceId, this.pickupVehicleType);
  }

  protected getDropoffFee(distanceId?: number): string {
    return this.getAdditionalServiceFee(distanceId, this.dropoffVehicleType);
  }

  private getAdditionalServiceFee(distanceId?: number, vehicleType?: string): string {
    if (!distanceId || !vehicleType) {
      return '-';
    }

    const band = this.distanceBands.find((b) => b.id === distanceId);
    if (!band) {
      return '-';
    }

    const multiplier = this.getVehicleTypeMultiplier(vehicleType);
    const fee = Math.round((band.feeAmount || 0) * multiplier);
    return fee.toString();
  }

  private getVehicleTypeMultiplier(vehicleType: string): number {
    switch (vehicleType) {
      case 'Hired Car':
        return 1.5;
      case 'Grabbike':
        return 0.75;
      default:
        return 1;
    }
  }

  protected trackByOrder(index: number, order: OrderRow): number | undefined {
    return order.id ?? index;
  }

  private mapOrderToRow(order: Order): OrderRow {
    const orderServices = order.orderServices ?? [];
    const targetDates = orderServices.length
      ? orderServices.map((orderService) =>
          orderService.targetDate
            ? `${this.formatDate(orderService.targetDate)}${orderService.startTime ? ` - ${this.formatTime(orderService.startTime)}` : ''}`
            : 'Not scheduled',
        )
      : ['Not scheduled'];

    return {
      id: order.id,
      reseller: order.reseller?.name ?? 'Direct Customer',
      pic: order.picContact?.name ?? order.createdByName ?? 'Unassigned',
      ref1: order.ref1 ?? order.orderNumber,
      ref2: order.ref2 ?? '',
      requestedDate: this.formatDate(order.requestedAt ?? order.createdAt),
      requestedAtRaw: order.requestedAt ?? order.createdAt,
      offeredDateRaw: order.submittedAt ?? order.updatedAt ?? order.createdAt,
      area: orderServices[0]?.area?.code ?? '-',
      service: orderServices.length
        ? orderServices.map((os) => {
            const name = os.service?.name ?? os.serviceNameSnapshot ?? 'Service';
            return os.isAdminModified ? `[modified]${name}` : name;
          })
        : ['Order only'],
      type: order.isPrivate ? 'P' : 'S',
      targetDate: targetDates,
      pickup: this.getPickupInfo(order),
      guests: this.formatGuests(order.adultCount, order.childCount),
      special: this.getSpecialRequests(order),
      tr: this.getStatusIcon(order.status?.code ?? ''),
      fee: this.formatCurrency(order.totalFeeAmount),
      status: order.status?.label ?? order.status?.code ?? 'Requested',
      statusTone: this.getStatusTone(order.status?.code ?? ''),
      statusCode: order.status?.code ?? '',
      guide: order.guide ?? 'Unassigned',
    };
  }

  protected formatDate(dateString?: string): string {
    if (!dateString) {
      return '-';
    }

    // Extract YYYY-MM-DD to avoid timezone shifting issues
    const parts = dateString.substring(0, 10).split('-');
    if (parts.length !== 3) {
      return dateString;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return dateString;
    }

    const date = new Date(year, month, day, 12, 0, 0); // Noon local time to avoid daylight saving issues

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  }

  protected formatTime(time?: string): string {
    if (!time) {
      return '';
    }
    // time expected as "HH:MM:SS" or "HH:MM"
    const parts = time.split(':');
    const hh = Number(parts[0]);
    const mm = Number(parts[1] ?? 0);
    if (Number.isNaN(hh)) {
      return time;
    }
    const date = new Date();
    date.setHours(hh, mm, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
  }

  private normalizeTime(time: string): string {
    const [hour = '', minute = ''] = time.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  private timeToMinutes(time: string): number {
    const [hour = '0', minute = '0'] = time.split(':');
    return Number(hour) * 60 + Number(minute);
  }

  private formatGuests(adults?: number, children?: number): string {
    return `${adults ?? 0}/${children ?? 0}`;
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

  private getPickupInfo(order: Order): string {
    const pickup = order.additionalServices?.find((service) => service.kind.toUpperCase() === 'PICKUP');
    const dropoff = order.additionalServices?.find((service) => service.kind.toUpperCase() === 'DROPOFF');
    const handoff = order.additionalServices?.find((service) => service.kind.toUpperCase() === 'HANDOFF');

    const formatTime = (time?: string) => {
      if (!time) return '';
      const [h, m] = time.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m}${ampm}`;
    };

    if (!pickup && !dropoff && !handoff) return '-/-';

    // Get tour start time and service duration from order service
    const tourStartTime = order.orderServices?.[0]?.startTime;
    const serviceDuration = order.orderServices?.[0]?.service?.durationMinutes || 0;

    // Calculate time offset based on distance band
    const getTimeOffset = (distanceBandId?: number): number => {
      const offsetMap: Record<number, number> = {
        1: 15,   // <5km
        2: 30,   // 5km-10km
        3: 45,   // >10km-15km
        4: 60,   // >15km
        5: 75,   // 15km-20km
      };
      return offsetMap[distanceBandId || 0] || 0;
    };

    // Calculate adjusted time
    const calculateAdjustedTime = (baseTime: string, offsetMinutes: number, isSubtract: boolean): string => {
      if (!baseTime) return '';
      const [h, m] = baseTime.split(':');
      let totalMinutes = parseInt(h, 10) * 60 + parseInt(m || '0', 10);

      if (isSubtract) {
        totalMinutes -= offsetMinutes;
      } else {
        totalMinutes += offsetMinutes;
      }

      // Handle day rollover
      if (totalMinutes < 0) totalMinutes += 24 * 60;
      if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;

      const newHour = Math.floor(totalMinutes / 60);
      const newMinute = totalMinutes % 60;
      const ampm = newHour >= 12 ? 'PM' : 'AM';
      const hour12 = newHour % 12 || 12;

      return `${hour12}:${newMinute.toString().padStart(2, '0')}${ampm}`;
    };

    // Calculate pickup time (tour time - offset)
    const puOffset = getTimeOffset(pickup?.distanceBand?.id);
    const puTime = tourStartTime && pickup?.distanceBand
      ? calculateAdjustedTime(tourStartTime, puOffset, true)
      : formatTime(pickup?.suggestedTime) || '-';

    // Calculate dropoff time (tour time + service duration + offset)
    const doOffset = getTimeOffset(dropoff?.distanceBand?.id);
    const doTime = tourStartTime && dropoff?.distanceBand
      ? calculateAdjustedTime(tourStartTime, serviceDuration + doOffset, false)
      : formatTime(dropoff?.suggestedTime) || '-';

    if (pickup && handoff && !dropoff) return `${puTime}/${handoff.handoffText || 'Hand Off'}`;
    if (pickup && !dropoff) return `${puTime}/${pickup.location || '-'}`;
    if (!pickup && handoff && !dropoff) return `-/${handoff.handoffText || 'Hand Off'}`;
    if (!pickup && dropoff) return `${doTime}/${dropoff.location || '-'}`;

    return `${puTime}/${doTime}`;
  }

  private getSpecialRequests(order: Order): string[] {
    return order.specialRequests?.map((request) => {
      const code = request.code.toLowerCase();
      if (code === 'for') {
        return 'fork';
      }

      return code;
    }) ?? [];
  }

  protected getSpecialRequestIcon(code: string): string {
    const iconMap: Record<string, string> = {
      'vip': '/ui-icons/vip-guest.svg',
      'bag': '/ui-icons/baggage-handling.svg',
      'eye': '/ui-icons/eye-contact.svg',
      'fork': '/ui-icons/fork-and-spoon.svg',
      'link': '/ui-icons/linked-orders.svg',
      'wheel': '/ui-icons/wheelchair-access.svg',
      'h': '/ui-icons/wheelchair-access.svg',
      'child': '/ui-icons/child-care.svg',
      'diet': '/ui-icons/dietary-requirements.svg',
    };
    return iconMap[code.toLowerCase()] || '';
  }

  private getStatusIcon(statusCode: string): string {
    const normalizedStatus = statusCode.toLowerCase();
    const iconMap: Record<string, string> = {
      completed: 'check',
      confirmed: 'check',
      active: 'check',
      requested: 'warn',
      offered: 'warn',
      cancelled: 'cross',
      tentative: 'circle',
    };

    return iconMap[normalizedStatus] ?? 'circle';
  }

  private getStatusTone(statusCode: string): string {
    const normalizedStatus = statusCode.toLowerCase();
    const toneMap: Record<string, string> = {
      completed: 'neutral',
      confirmed: 'success',
      active: 'success',
      requested: 'info',
      offered: 'warning',
      cancelled: 'danger',
      tentative: 'info',
    };

    return toneMap[normalizedStatus] ?? 'neutral';
  }

  private updateFilterCounts(): void {
    // Count by canonical status code for reliable counts
    const statusCounts = this.allOrders.reduce(
      (acc, order) => {
        const code = order.statusCode.toLowerCase();
        if (code) {
          acc[code] = (acc[code] ?? 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    this.filters = this.filters.map((filter) => {
      if (filter.label === 'All Orders') {
        return { ...filter, count: this.allOrders.length.toString() };
      }

      if (filter.label === 'Requests') {
        return { ...filter, count: (statusCounts['requested'] ?? 0).toString() };
      }

      if (filter.label === 'Offered') {
        return { ...filter, count: (statusCounts['offered'] ?? 0).toString() };
      }

      if (filter.label === 'Tentative') {
        return { ...filter, count: (statusCounts['tentative'] ?? 0).toString() };
      }

      // Guide Changes, Problem Reports, Tour Reports - no data available yet
      return { ...filter, count: '0' };
    });

    this.updateTotals();
  }

  private uniqueById<T extends { id: number }>(items: T[]): T[] {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }

  private buildAdditionalServices(): OrderAdditionalServiceRequest[] | undefined {
    const services: OrderAdditionalServiceRequest[] = [];

    if (this.pickupLocationNewOrder) {
      services.push({
        kind: 'PICKUP',
        isEnabled: true,
        location: this.pickupLocationNewOrder,
        vehicleType: this.pickupVehicleType,
        distanceBandId: this.pickupDistanceId,
      });
    }

    if (this.dropoffSelected === 'HAND') {
      services.push({
        kind: 'HANDOFF',
        isEnabled: true,
        handoffText: this.handoffTextNewOrder || undefined,
      });
    }

    if (this.dropoffSelected === 'DROP' && this.dropoffLocationNewOrder) {
      services.push({
        kind: 'DROPOFF',
        isEnabled: true,
        location: this.dropoffLocationNewOrder,
        vehicleType: this.dropoffVehicleType,
        distanceBandId: this.dropoffDistanceId,
      });
    }

    return services.length ? services : undefined;
  }

}
