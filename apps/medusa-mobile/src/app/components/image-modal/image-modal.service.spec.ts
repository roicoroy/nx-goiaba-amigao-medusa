import { TestBed } from '@angular/core/testing';

import { ImageModalService } from './image-modal.service';

describe('ImageModalService', () => {
  let service: ImageModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
