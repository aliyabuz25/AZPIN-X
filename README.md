# AZPIN-X E-Pin Store

Bu proje, oyun pinleri ve dijital kod satış platformudur. Modern web teknolojileri kullanılarak geliştirilmiş, güvenli ve ölçeklenebilir bir yapıya sahiptir.

## 🚀 Kurulum ve Deployment Rehberi (Production)

Bu proje **Traefik**, **Docker** ve **Portainer** altyapısı üzerinde çalışacak şekilde tasarlanmıştır.

### 1. Ön Hazırlık (Sunucu Tarafı)
Sunucuda aşağıdaki klasör yapısının hazır olduğundan emin olun:

```bash
/datastore/azpin/             # Ana proje klasörü
/datastore/azpin/app/         # Kaynak kodlar burada olacak (ZIP'ten çıkanlar)
/datastore/azpin/uploads/     # Kullanıcı yüklemeleri (Reseller dekont, avatar vb.) - Backend buraya yazar
/datastore/azpin/nginx-logs/  # Nginx erişim ve hata logları
/datastore/azpin/mysql/       # MySQL veritabanı persistency klasörü
```

### 2. Dosya Hazırlığı
Proje dosyalarını sunucuya göndermeden önce yerel ortamda build almayın. Tüm kaynak kodu ziplemeden önce:
- `node_modules` klasörünü LÜTFEN silin.
- `dist` klasörünü LÜTFEN silin.
- `.env` dosyasını dahil etmeyin (Environment variable'lar Portainer üzerinden girilecek).

Projeyi zipleyip sunucuda `/datastore/azpin/azpin.zip` konumuna atın ve `/datastore/azpin/app/` içine çıkarın.

### 3. Docker Image Build (Sunucuda)
Portainer'ın "Pull access denied" xətasını tamamilə həll etmək üçün imajları `:local` tag-i ilə build etməliyik:

```bash
cd /datastore/azpin/app

# Backend Image Build
docker build -t azpin-backend:local -f Dockerfile.backend .

# Frontend Image Build
docker build -t azpin-frontend:local -f Dockerfile.frontend .
```

### 4. Portainer Stack Kurulumu (Sorunsuz)
1. Portainer-də yeni bir Stack yaradın.
2. `portainer-stack.yml` faylını yapıştırın.
3. **ÖNƏMLİ**: Deploy etməzdən əvvəl Portainer-də **"Always pull the image"** (və ya "Pull latest image") seçiminin **KAPALI** (OFF) olduğundan əmin olun.
4. `Deploy the stack` düyməsinə basın.

### 5. Yapılandırma Detayları
Sistem üç ana konteynerdan oluşur:
1. **azpin-db**: MySQL verilənlər bazası.
2. **azpin-backend**: API və Auth server.
3. **azpin-frontend**: Statik fayllar və Nginx proxy.

Traefik həm API (`/api`), həm də Frontend yollarını avtomatik olaraq `Host: azpinx.com` üzərinə yönləndirir.

### 6. Geliştirme (Local)
Yerel ortamda geliştirmek için:
```bash
npm install
npm run dev:all  # Hem frontend hem backend'i aynı anda başlatır
```
Backend: `http://localhost:5174`
Frontend: `http://localhost:5173`

### 7. Son Sənədləşdirmə və Deployment (Xülasə)
Projenin MySQL və Traefik ilə düzgün işləməsi üçün bu addımları izləyin:

1. **GitHub-dan ən son kodu çəkin:**
   ```bash
   cd /datastore/azpin/app
   git pull origin main
   ```
2. **Konteynerləri build edin:**
   ```bash
   docker build -t azpin-backend:latest -f Dockerfile.backend .
   docker build -t azpin-frontend:latest -f Dockerfile.frontend .
   ```
3. **Portainer Stack-i yeniləyin:**
   `portainer-stack.yml` faylını Portainer-ə kopyalayın və lazım olan Environment Variables (JWT_SECRET, DB_PASSWORD və s.) təyin edin. `Update the stack` düyməsinə basın.

Bütün sistem (Database, Auth, Frontend, Traefik) avtomatik qurulacaq və işləyəcək.
