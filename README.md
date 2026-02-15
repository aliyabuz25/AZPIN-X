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
Portainer'ın build context sorununu aşmak için imajları sunucuda (host shell) manuel olarak build etmelisiniz:

```bash
cd /datastore/azpin/app

# Backend Image Build
docker build -t azpin-backend:latest -f Dockerfile.backend .

# Frontend Image Build (Bu işlem biraz sürebilir, vite build içerir)
docker build -t azpin-frontend:latest -f Dockerfile.frontend .
```

### 4. Portainer Stack Kurulumu
Portainer arayüzünde yeni bir Stack oluşturun ve `portainer-stack.yml` dosyasının içeriğini yapıştırın.

⚠️ **Önemli:** Stack Environment variables kısmına aşağıdaki anahtarları eklemeyi UNUTMAYIN:
- `JWT_SECRET`: Güçlü bir gizli anahtar (ör: `azpin-super-secret-123`)
- `DB_HOST`: `azpin-db` (Stack içi iletişim için)
- `DB_USER`: `azpin_user`
- `DB_PASSWORD`: Veritabanı şifresi
- `DB_NAME`: `azpin_db`
- `HUBMSG_API_KEY`: HubMSG SMS servisi API anahtarı
- `MYSQL_ROOT_PASSWORD`: MySQL root şifresi (Veritabanı kurulumu için)

### 5. Yapılandırma Detayları
Sistem üç ana konteynerdan oluşur ve **Internal Bridge Network** üzerinden haberleşir:

1.  **azpin-db (MySQL 8.0)**: Veritabanı motoru. Dışarıya kapalıdır.
2.  **azpin-backend (NodeJS)**: API, Auth ve dosya yükleme işlemlerini yönetir. Cihaz içi cədvəlləri avtomatik yaradır.
3.  **azpin-frontend (Nginx)**: Statik arayüzü sunar ve Reverse Proxy görevi görür.
    - `/` -> Frontend Statics
    - `/api` -> `http://azpin-backend:5174/api` (Internal Proxy)
    - `/uploads` -> `http://azpin-backend:5174/uploads` (Internal Proxy)

Traefik, tüm trafiği (Host: `azpinx.com`) frontend ve backend (/api) konteynerlerine yönlendirir.

### 6. Geliştirme (Local)
Yerel ortamda geliştirmek için:
```bash
npm install
npm run dev:all  # Hem frontend hem backend'i aynı anda başlatır
```
Backend: `http://localhost:5174`
Frontend: `http://localhost:5173`

---
**Not:** Backend API çağrıları frontend tarafından `/api` path'i üzerinden yapılır. Production ortamında Nginx bu çağrıları internal olarak backend sunucusuna (`azpin-backend`) iletir. Local ortamda `vite.config.js` proxy ayarları bu yönlendirmeyi simüle eder.
