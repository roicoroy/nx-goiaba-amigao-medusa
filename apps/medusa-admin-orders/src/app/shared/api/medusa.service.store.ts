import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Customer } from '../admin-interfaces';
import { BaseHttpService } from './base-http.service';


@Injectable({
  providedIn: 'root'
})
export class MedusaStoreService extends BaseHttpService {
  protected baseUrl = environment.MEDUSA_API_BASE_PATH;

  // Authentication Methods
  login(email: string, password: string): Observable<{ token: string }> {
    const body = { email, password };
    // Use customer authentication endpoint since store staff are customers with metadata
    // This endpoint returns { token: string }
    return this.post<{ token: string }>('/auth/customer/emailpass', body, { withCredentials: false });
  }

  // Note: setSession is not needed for customer authentication
  // Customer auth uses JWT tokens directly in Authorization header

  getCustomerProfile(): Observable<Customer> {
    // Note: This endpoint requires x-publishable-api-key header (added by auth interceptor)
    // and JWT token in Authorization header (also added by auth interceptor)
    return this.get<{ customer: Customer }>('/store/customers/me', { withCredentials: true }).pipe(
      map(response => response.customer)
    );
  }

  logout(): Observable<any> {
    // No server-side session to invalidate - JWT tokens are stateless
    // Just return an empty observable to maintain the interface
    return new Observable(observer => {
      observer.next({});
      observer.complete();
    });
  }
}
