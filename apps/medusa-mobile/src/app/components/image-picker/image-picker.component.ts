import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  Input,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { Platform, ActionSheetController } from '@ionic/angular';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { IonImg, IonButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
  standalone: true,
  imports: [CommonModule, IonImg, IonButton, IonIcon, IonLabel, TranslateModule]
})
export class ImagePickerComponent implements OnInit, OnChanges {

  @ViewChild('filePicker', { static: false }) filePickerRef: ElementRef<HTMLInputElement> | undefined;

  @Output() imagePick = new EventEmitter<any>();

  @Input()
  avatar!: string;

  selectedImage: any;

  private platform = inject(Platform);
  private actionSheetController = inject(ActionSheetController);

  ngOnInit() {
    if (this.avatar) {
      this.selectedImage = this.avatar;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['avatar'] && changes['avatar'].currentValue) {
      this.selectedImage = changes['avatar'].currentValue;
    }
  }

  async onPickImage() {
    if (this.platform.is('hybrid')) {
      // On mobile, show action sheet with camera and gallery options
      await this.presentImageSourceActionSheet();
    } else {
      // On web, show action sheet with camera and file picker options
      await this.presentImageSourceActionSheet();
    }
  }

  private async presentImageSourceActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Camera',
          icon: 'camera',
          handler: () => {
            this.takePicture(CameraSource.Camera);
          }
        },
        {
          text: 'Photo Gallery',
          icon: 'images',
          handler: () => {
            if (this.platform.is('hybrid')) {
              this.takePicture(CameraSource.Photos);
            } else {
              this.onFileSelected();
            }
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  private async takePicture(source: CameraSource) {
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source,
        quality: 30, // Lower quality to reduce file size
        width: 400,  // Max width
        height: 400, // Max height
        allowEditing: true, // Allow user to crop/edit
        correctOrientation: true // Fix orientation issues
      });
      const savedPhoto = await this.savePicture(capturedPhoto);
      this.imagePick.emit(savedPhoto.webviewPath);
      this.selectedImage = savedPhoto.webviewPath;
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  }

  private onFileSelected() {
    if (!this.filePickerRef) {
      return;
    }
    this.filePickerRef.nativeElement.click();
  }

  onFileChosen(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('File size too large. Please select an image under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      this.selectedImage = imageUrl;
      this.imagePick.emit(imageUrl);
    };
    reader.readAsDataURL(file);
  }
  private async savePicture(cameraPhoto: Photo) {
    const base64Data = await this.readAsBase64(cameraPhoto);
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });
    if (this.platform.is('hybrid')) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.webPath,
      };
    }
  }
  convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  private async readAsBase64(cameraPhoto: Photo | any) {
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: cameraPhoto.path,
      });

      return file.data;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const response = await fetch(cameraPhoto.webPath!);
      const blob = await response.blob();

      return (await this.convertBlobToBase64(blob)) as string;
    }
  }

}
export async function onLoadImage(savedPhoto: any) {
  const readFile = await Filesystem.readFile({
    path: savedPhoto.filepath,
    directory: Directory.Data,
  });
  return `data:image/jpeg;base64,${readFile.data}`;
}
