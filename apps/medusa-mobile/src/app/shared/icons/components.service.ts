import { Injectable } from '@angular/core';
import
  * as IonComponents
  from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class IonComponentsService {

  constructor() {
    this.initComponents();
  }

  initComponents() {
    return IonComponents
  }
}
