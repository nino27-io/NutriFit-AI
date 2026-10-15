export type ResourceCategory = 'Pola Makan' | 'Olahraga' | 'Gaya Hidup';

export interface ResourceItem {
  id: string;
  title: string;
  category: ResourceCategory;
  summary: string;
  readTime: string;
  image: string;
  imageAlt: string;
}

export const LEARNING_RESOURCES: ResourceItem[] = [
  {
    id: 'piring-makanku-lokal',
    title: 'Menyusun Piring Sehat Harian dengan Bahan Pangan Lokal Murah',
    category: 'Pola Makan',
    summary:
      'Kombinasi tempe, telur, sayur bening, dan nasi porsi terukur mampu memenuhi protein harian tanpa menguras kantong mahasiswa.',
    readTime: '4 menit baca',
    image: '/images/artikel-piring-lokal.webp',
    imageAlt: 'Ilustrasi piring makan sehat dengan lauk tempe, telur, dan sayuran hijau',
  },
  {
    id: 'mengapa-whr-penting',
    title: 'Mengapa Lingkar Pinggang Lebih Jujur daripada Sekadar Angka Timbangan',
    category: 'Gaya Hidup',
    summary:
      'Dua orang dengan BMI sama bisa memiliki risiko metabolik berbeda. Pelajari cara mengukur rasio pinggang-pinggul yang akurat di rumah.',
    readTime: '5 menit baca',
    image: '/images/artikel-ukur-pinggang.webp',
    imageAlt: 'Ilustrasi pita ukur melingkari pinggang untuk analisis komposisi tubuh',
  },
  {
    id: 'latihan-beban-kamar-kos',
    title: 'Panduan Latihan Kekuatan 20 Menit Tanpa Alat untuk Pemula',
    category: 'Olahraga',
    summary:
      'Gerakan bodyweight seperti squat, push-up dinding, dan plank efektif menjaga massa otot di sela jadwal kuliah atau kerja padat.',
    readTime: '4 menit baca',
    image: '/images/artikel-latihan-mandiri.webp',
    imageAlt: 'Ilustrasi latihan kebugaran mandiri tanpa alat di dalam ruangan',
  },
  {
    id: 'bahaya-diet-ekstrem',
    title: 'Bahaya Memangkas Kalori di Bawah BMR bagi Metabolisme Tubuh',
    category: 'Pola Makan',
    summary:
      'Diet terlalu ekstrem justru memicu kelelahan kronis dan efek yoyo. Ketahui batas defisit kalori yang aman untuk jangka panjang.',
    readTime: '6 menit baca',
    image: '/images/artikel-energi-seimbang.webp',
    imageAlt: 'Ilustrasi keseimbangan asupan energi harian dan metabolisme basal',
  },
  {
    id: 'jalan-kaki-neat',
    title: 'Rahasia NEAT: Membakar Kalori Ekstra Lewat Aktivitas Harian Ringan',
    category: 'Olahraga',
    summary:
      'Memilih tangga dan berjalan kaki 7.000 langkah sehari memberi kontribusi besar pada pengeluaran energi harian (TDEE) Anda.',
    readTime: '3 menit baca',
    image: '/images/artikel-jalan-kaki.webp',
    imageAlt: 'Ilustrasi jalan kaki aktif di taman terbuka pada pagi hari',
  },
  {
    id: 'kualitas-tidur-hormon',
    title: 'Hubungan Tidur Cukup dengan Kendali Nafsu Makan dan Pemulihan',
    category: 'Gaya Hidup',
    summary:
      'Kurang tidur meningkatkan hormon ghrelin yang memicu keinginan makan manis berlebih di malam hari. Simak tips tidur berkualitas.',
    readTime: '5 menit baca',
    image: '/images/artikel-tidur-pulih.webp',
    imageAlt: 'Ilustrasi istirahat malam yang berkualitas untuk pemulihan tubuh',
  },
];