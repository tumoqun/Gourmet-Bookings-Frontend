import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Allotment, Area, Order, Service, ServiceType, Reseller, ResellerContact, Agent } from '../../services/api.service';

interface OrderRow {
  id?: number;
  reseller: string;
  pic: string;
  ref1: string;
  ref2: string;
  requestedDate: string;
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
}

interface StatusFilter {
  label: string;
  count: string;
  active: boolean;
}

@Component({
  selector: 'app-orders-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersView implements OnInit {
  protected isNewOrderOpen = false;
  protected currentNewOrderStep = 1;
  protected adultGuests = 2;
  protected childGuests = 1;
  protected isLoading = false;
  protected errorMessage = '';

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
  
  protected resellers: Reseller[] = [];
  protected contacts: ResellerContact[] = [];
  protected agents: Agent[] = [];
  protected filteredContacts: ResellerContact[] = [];
  protected filteredAgents: Agent[] = [];

  protected selectedResellerId?: number;
  protected selectedContactId?: number;
  protected selectedAgentId?: number;

  protected isTentativeNewOrder = false;
  protected createdByNameNewOrder = '';
  protected picEmailNewOrder = '';
  protected copyEmailNewOrder = '';
  protected targetDateNewOrder = '';
  protected startTimeNewOrder = '';
  protected selectedAllotmentId?: number;
  protected voucherNumberNewOrder = '';
  protected pickupLocationNewOrder = '';
  protected pickupServiceTypeId?: number;
  protected pickupDistanceId?: number;
  protected dropoffLocationNewOrder = '';
  protected dropoffServiceTypeId?: number;
  protected dropoffDistanceId?: number;
  protected selectedAreaId?: number;
  protected selectedServiceTypeId?: number;
  protected dropoffSelected?: string;
  protected ref1NewOrder = '';
  protected ref2NewOrder = '';

  protected filters: StatusFilter[] = [
    { label: 'All Orders', count: '0', active: true },
    { label: 'Guide Changes', count: '0', active: false },
    { label: 'Problem Reports', count: '0', active: false },
    { label: 'Tour Reports', count: '0', active: false },
    { label: 'Tentative', count: '0', active: false },
    { label: 'Pending', count: '0', active: false },
    { label: 'Requests', count: '0', active: false },
  ];

  protected orders: OrderRow[] = [];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadServices();
    this.loadAreas();
    this.loadServiceTypes();
    this.loadResellersData();
  }

  protected loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getOrders().subscribe({
      next: (orders) => {
        Promise.resolve().then(() => {
          this.orders = orders.map((order) => this.mapOrderToRow(order));
          this.updateFilterCounts();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        Promise.resolve().then(() => {
          this.errorMessage = 'Could not load orders from the backend.';
          this.orders = [];
          this.updateFilterCounts();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
    });
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
    this.dropoffSelected = value;
  }

  protected openNewOrderModal(): void {
    this.isNewOrderOpen = true;
    this.currentNewOrderStep = 1;
    this.errorMessage = '';
    this.isTentativeNewOrder = false;
    this.createdByNameNewOrder = '';
    this.picEmailNewOrder = '';
    this.copyEmailNewOrder = '';
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

  protected setNewOrderStep(step: number): void {
    if (step > 4) {
      return;
    }

    this.currentNewOrderStep = step;
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

  protected selectTimeSlot(slot: string): void {
    this.selectedTimeSlot = slot;
    this.selectedService = undefined;
    this.startTimeNewOrder = '';
    this.selectedAllotmentId = undefined;
    this.serviceAllotments = [];
    this.applyServiceFilters();
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
  }

  protected createOrder(): void {
    this.errorMessage = '';

    const orderData = {
      orderNumber: `ORD-${Date.now()}`,
      orderChannel: 'frontend',
      isTentative: this.isTentativeNewOrder,
      createdByName: this.createdByNameNewOrder || 'Alexander Pierce',
      resellerId: this.selectedResellerId,
      picContactId: this.selectedContactId,
      picEmail: this.picEmailNewOrder,
      copyEmail: this.copyEmailNewOrder,
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
              isPrivate: false,
              timeSlotCode: this.selectedTimeSlot === 'Any' ? undefined : this.selectedTimeSlot.toUpperCase(),
              timezone: 'Asia/Tokyo',
            },
          ]
        : undefined,
    };

    this.isLoading = true;
    this.apiService.createOrder(orderData).subscribe({
      next: () => {
        this.closeNewOrderModal();
        this.loadOrders();
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
      area: orderServices[0]?.area?.code ?? '-',
      service: orderServices.length
        ? orderServices.map((os) => {
            const name = os.service?.name ?? os.serviceNameSnapshot ?? 'Service';
            return os.isAdminModified ? `[modified]${name}` : name;
          })
        : ['Order only'],
      type: orderServices[0]?.isPrivate ? 'P' : 'S',
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

  private formatDate(dateString?: string): string {
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

  private formatTime(time?: string): string {
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

  private formatCurrency(amount?: number): string {
    return (amount ?? 0).toLocaleString();
  }

  private getPickupInfo(order: Order): string {
    const pickup = order.additionalServices?.find((service) => service.kind.toUpperCase() === 'PICKUP');
    const dropoff = order.additionalServices?.find((service) => service.kind.toUpperCase() === 'DROPOFF');

    const formatTime = (time?: string) => {
      if (!time) return '';
      const [h, m] = time.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m}${ampm}`;
    };

    if (!pickup && !dropoff) return '-/-';

    const puTime = formatTime(pickup?.suggestedTime) || '-';
    if (pickup && !dropoff) return `${puTime}/${pickup.location || '-'}`;
    if (!pickup && dropoff) return `${formatTime(dropoff.suggestedTime) || '-'}/${dropoff.location || '-'}`;

    const doLoc = dropoff?.location || formatTime(dropoff?.suggestedTime) || '-';
    return `${puTime}/${doLoc}`;
  }

  private getSpecialRequests(order: Order): string[] {
    return order.specialRequests?.map((request) => {
      const code = request.code.toLowerCase();
      return code === 'wheel' ? 'h' : code;
    }) ?? [];
  }

  private getStatusIcon(statusCode: string): string {
    const normalizedStatus = statusCode.toLowerCase();
    const iconMap: Record<string, string> = {
      completed: 'check',
      confirmed: 'check',
      active: 'check',
      requested: 'warn',
      pending_offer: 'warn',
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
      pending_offer: 'warning',
      cancelled: 'danger',
      tentative: 'info',
    };

    return toneMap[normalizedStatus] ?? 'neutral';
  }

  private updateFilterCounts(): void {
    // Count by canonical status code for reliable counts
    const statusCounts = this.orders.reduce(
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
        return { ...filter, count: this.orders.length.toString() };
      }

      if (filter.label === 'Requests') {
        return { ...filter, count: (statusCounts['requested'] ?? 0).toString() };
      }

      if (filter.label === 'Pending') {
        // backend code is PENDING_OFFER
        return { ...filter, count: (statusCounts['pending_offer'] ?? 0).toString() };
      }

      if (filter.label === 'Tentative') {
        return { ...filter, count: (statusCounts['tentative'] ?? 0).toString() };
      }

      return { ...filter, count: '0' };
    });
  }

  private uniqueById<T extends { id: number }>(items: T[]): T[] {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }

  private buildAdditionalServices(): any[] | undefined {
  const services = [];
  if (this.pickupLocationNewOrder) {
    services.push({
      kind: 'PICKUP',
      location: this.pickupLocationNewOrder,
      serviceTypeId: this.pickupServiceTypeId,
      distanceId: this.pickupDistanceId,
    });
  }
  if (this.dropoffLocationNewOrder) {
    services.push({
      kind: 'DROPOFF',
      location: this.dropoffLocationNewOrder,
      serviceTypeId: this.dropoffServiceTypeId,
      distanceId: this.dropoffDistanceId,
    });
  }
  return services.length ? services : undefined;
}

}
