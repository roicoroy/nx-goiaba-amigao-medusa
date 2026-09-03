import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { 
  IonContent, 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonText,
  IonIcon
} from '@ionic/angular/standalone';
import { GoiabaHeaderComponent, GoiabaFooterComponent, GoiabaCardComponent } from 'src/app/components/goiaba-components';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.page.html',
  styleUrls: ['./contact-us.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    GoiabaHeaderComponent,
    GoiabaFooterComponent,
    GoiabaCardComponent,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonText,
    IonIcon
  ]
})
export class ContactUsPage implements OnInit {
  contactForm!: FormGroup;
  isSubmitted = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.initForm();
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  get formControls() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log('Contact Form Submitted:', formData);
      
      // Reset form after submission
      this.contactForm.reset();
      this.isSubmitted = false;
    } else {
      console.log('Form is invalid:', this.contactForm.errors);
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.contactForm.get(controlName);
    return !!(control && control.hasError(errorType) && (control.touched || this.isSubmitted));
  }
}
