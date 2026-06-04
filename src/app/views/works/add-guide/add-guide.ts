import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Guide, GuideService } from '../../../services/guide.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-add-guide',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-guide.html',
  styleUrl: './add-guide.css',
})
export class AddGuide {
  @Input() visible = false;

  @Output() close = new EventEmitter<void>();

  private searchSubject = new Subject<string>();

  activeTab: 'available' | 'unavailable' = 'available';
  searchKeyword = '';
  selectedGuideIds: number[] = [];
  availableGuides: Guide[] = [];
  unavailableGuides: Guide[] = [];
  calendarInvite = false;
  isLeader = false;
  managerNote = '';

  constructor(
    private guideService: GuideService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.setTab('available');
    this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((keyword) => {
      this.searchGuides(keyword);
    });
  }

  async loadAvailableGuides(searchKeyword: string): Promise<void> {
    const guides = (await this.guideService.getAvailableGuides(searchKeyword).toPromise()) ?? [];
    this.availableGuides = guides;
    this.cdr.detectChanges();
  }

  async loadUnavailableGuides(searchKeyword: string): Promise<void> {
    const guides = (await this.guideService.getUnavailableGuides(searchKeyword).toPromise()) ?? [];
    this.unavailableGuides = guides;
    this.cdr.detectChanges();
  }

  searchGuides(keyword: string): void {
    if (this.activeTab === 'available') {
      this.loadAvailableGuides(keyword);
    } else {
      this.loadUnavailableGuides(keyword);
    }
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  get guides(): Guide[] {
    const source = this.activeTab === 'available' ? this.availableGuides : this.unavailableGuides;

    return source.filter((guide) =>
      guide.fullName.toLowerCase().includes(this.searchKeyword.toLowerCase()),
    );
  }

  setTab(tab: 'available' | 'unavailable'): void {
    this.activeTab = tab;
    this.selectedGuideIds = [];
    this.searchKeyword = '';
    if (tab === 'available') {
      this.loadAvailableGuides(this.searchKeyword);
    } else {
      this.loadUnavailableGuides(this.searchKeyword);
    }
  }

  toggleGuide(guideId: number): void {
    if (this.selectedGuideIds.includes(guideId)) {
      this.selectedGuideIds = this.selectedGuideIds.filter((id) => id !== guideId);
      return;
    }

    this.selectedGuideIds.push(guideId);
  }

  isSelected(guideId: number): boolean {
    return this.selectedGuideIds.includes(guideId);
  }

  addGuide(): void {
    console.log({
      selectedGuideIds: this.selectedGuideIds,
      calendarInvite: this.calendarInvite,
      isLeader: this.isLeader,
      managerNote: this.managerNote,
    });
    this.close.emit();
  }

  closeModal(): void {
    this.close.emit();
  }
}
