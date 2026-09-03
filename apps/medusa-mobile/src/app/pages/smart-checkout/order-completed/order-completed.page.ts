import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-order-completed',
  templateUrl: './order-completed.page.html',
  styleUrls: ['./order-completed.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class OrderCompletedPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
