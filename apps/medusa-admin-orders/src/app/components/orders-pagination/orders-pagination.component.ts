import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-orders-pagination',
  templateUrl: './orders-pagination.component.html',
  styleUrls: ['./orders-pagination.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class OrdersPaginationComponent {
  @Input() count: number = 0;
  @Input() offset: number = 0;
  @Input() limit: number = 15;
  @Input() loading: boolean = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() loadMore = new EventEmitter<void>();

  get currentPage(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.count / this.limit);
  }

  get hasNextPage(): boolean {
    return this.offset + this.limit < this.count;
  }

  get hasPreviousPage(): boolean {
    return this.offset > 0;
  }

  get startItem(): number {
    return this.count === 0 ? 0 : this.offset + 1;
  }

  get endItem(): number {
    return Math.min(this.offset + this.limit, this.count);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.goToPage(this.currentPage - 1);
    }
  }

  onLoadMore(): void {
    if (this.hasNextPage && !this.loading) {
      this.loadMore.emit();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (current <= 4) {
        // Show pages 2-5, then ellipsis, then last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis marker
        pages.push(total);
      } else if (current >= total - 3) {
        // Show first page, ellipsis, then last 5 pages
        pages.push(-1); // Ellipsis marker
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
        pages.push(-1); // Ellipsis marker
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis marker
        pages.push(total);
      }
    }

    return pages;
  }
}

