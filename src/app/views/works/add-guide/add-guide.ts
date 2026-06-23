import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Guide, GuideService } from '../../../services/guide.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-guide',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-guide.html',
  styleUrl: './add-guide.css',
})
export class AddGuide {
  @Input() visible = false;
  @Input() currentGuides: number[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();
  @Output() reloadWork = new EventEmitter<void>();

  private searchSubject = new Subject<string>();

  private route = inject(ActivatedRoute);
  workId = this.route.snapshot.paramMap.get('id');
  activeTab: 'available' | 'unavailable' = 'available';
  searchKeyword = '';
  selectedGuideId: number | null = null;
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
    console.log('currentGuides', this.currentGuides);
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

  isDisabledGuide(guideId: number): boolean {
    return this.currentGuides.includes(guideId);
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
    this.selectedGuideId = null;
    this.searchKeyword = '';
    if (tab === 'available') {
      this.loadAvailableGuides(this.searchKeyword);
    } else {
      this.loadUnavailableGuides(this.searchKeyword);
    }
  }

  toggleGuide(guideId: number): void {
    this.selectedGuideId = guideId;
  }

  isSelected(guideId: number): boolean {
    return this.selectedGuideId === guideId;
  }

  addGuide(): void {
    // Here you would typically call the service to assign the guide to the work
    this.guideService
      .assignGuideToWork({
        workId: Number(this.workId),
        guideId: this.selectedGuideId!,
        role: this.isLeader ? 'leader' : 'guide',
        isCalendarInvitation: this.calendarInvite,
        note: this.managerNote,
        status: 'PENDING',
      })
      .subscribe(() => {
        this.close.emit();
        this.reload.emit();
        this.reloadWork.emit();
      });
  }

  closeModal(): void {
    this.close.emit();
  }
}
