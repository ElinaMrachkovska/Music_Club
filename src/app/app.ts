import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BandPreset } from './models/bands.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  extractedText: string = '';
  errorMessage: string | null = null;
  isLoading: boolean = false;

  private apiKey = '706jb5MIkqgqmx26SPa7UbFw3Jra32ToNXNACnDw';
  private apiUrl = 'https://api.api-ninjas.com/v1/imagetotext';

  constructor(private http: HttpClient, private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  bandPresets: BandPreset[] = [
    {
      id: 1,
      name: 'Nirvana',
      style: 'Grunge (90s, Брудний гітарний звук, депресивні тексти)',
      imagePath: 'bands/grunge.jpg'
    },
    {
      id: 2,
      name: 'Iron Maiden',
      style: 'Heavy Metal (80s, Швидкі соло, галопуючий ритм, потужний вокал)',
      imagePath: 'bands/heavy_metal.jpg'
    },
    {
      id: 3,
      name: 'Led Zeppelin',
      style: 'Hard Rock (70s, Потужні рифи, блюзова основа, драйв)',
      imagePath: 'bands/hard_rock.jpg'
    }
  ];

onFileSelected(event: any): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  const file = input.files[0];
  console.log('Вибраний файл:', file.name, file.size, file.type);

  this.errorMessage = null;
  this.extractedText = '';
  this.isLoading = false;

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    this.errorMessage = '❌ Тільки JPEG або PNG!';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    this.errorMessage = '❌ Файл занадто важкий (макс. 2MB)';
    return;
  }

  this.selectedFile = file;
  
  // Використовуємо URL.createObjectURL замість FileReader
  this.imagePreview = URL.createObjectURL(file);
  console.log('Preview URL:', this.imagePreview);
}

selectPreset(preset: BandPreset): void {
  this.errorMessage = null;
  this.extractedText = '';
  this.imagePreview = preset.imagePath;
  this.isLoading = true;

  this.http.get(preset.imagePath, { responseType: 'blob' }).subscribe({
    next: (blob) => {
      this.selectedFile = new File([blob], `${preset.name}.jpg`, { type: 'image/jpeg' });
      console.log('✅ Файл готовий:', this.selectedFile.name, this.selectedFile.size, 'bytes');
      this.sendToApi();
    },
    error: (err) => {
      console.error('❌ Помилка завантаження:', err);
      this.errorMessage = 'Не вдалося завантажити зображення.';
      this.isLoading = false;
    }
  });
}
  sendToApi(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Файл не вибрано!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    const headers = new HttpHeaders({ 'X-Api-Key': this.apiKey });

    console.log('📤 Відправляємо запит на API...');

    this.http.post<any[]>(this.apiUrl, formData, { headers }).subscribe({
 next: (res) => {
  console.log('📥 Відповідь API:', res);
  
  this.ngZone.run(() => {
    if (res && res.length > 0) {
      this.extractedText = res.map(item => item.text).join(' ');
    } else {
      this.extractedText = '';
      this.errorMessage = '⚠️ На цьому фото текст не знайдено.';
    }
    this.isLoading = false;
    this.cdr.detectChanges(); // ← додай це
  });
},
error: (err) => {
  this.ngZone.run(() => {
    this.errorMessage = `Помилка API: ${err.status} ${err.statusText}`;
    this.isLoading = false;
    this.cdr.detectChanges(); // ← і це
  });
}

});
  }

  // Кнопка "Розпізнати текст" тепер викликає sendToApi напряму
  recognizeText(): void {
    this.sendToApi();
  }

  copyText(): void {
    if (!this.extractedText) return;
    navigator.clipboard.writeText(this.extractedText);
    alert('Текст скопійовано! 🤘');
  }
}