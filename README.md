# OKUL GENÇLERİ — gerçek sürüm kaynak paketi

Next.js + Supabase üzerinde çalışan, mobil uyumlu öğrenci seçim uygulaması.

## İçerik
- Dört aday profili (ad, slogan, fotoğraf bağlantısı yönetilebilir)
- Yönetici girişi (Supabase Auth + admin_users yetki listesi)
- Öğrenci listesi ekleme
- Her öğrenciye her UTC saat dilimi için ayrı, rastgele kod üretme
- Bir öğrenci / saat başına tek oy; oylar silinmez ve toplam sonuçlara eklenir
- Duyuru yayınlama ve herkese açık toplam sonuçlar
- Oy kodları veritabanında SHA-256 özeti olarak tutulur; düz kod yalnızca üretim anında gösterilir

## Önemli çalışma kuralı
Saatlik kodlar öğrencilere özel olarak dağıtılmalıdır. Yönetici panelinden her saat yeni kod listesi üretip güvenli biçimde öğrencilere ulaştırın. Aynı saatte tekrar kod üretmek o saat için önceki kodları geçersiz kılar. Kod üretimi şu an yönetici tarafından elle başlatılır; otomatik dağıtım için okulun güvenli öğrenci iletişim sistemiyle ayrıca entegrasyon gerekir.

## 1. Supabase kurulumu
1. https://supabase.com üzerinden ücretsiz proje oluştur.
2. SQL Editor ekranında `supabase/schema.sql` dosyasının tamamını çalıştır.
3. Project Settings → API bölümünden Project URL, anon/public key ve service_role key değerlerini al.
4. Authentication → Users bölümünden yönetici hesabı oluştur (e-posta/şifre).
5. SQL Editor'de şu sorguyu çalıştırıp `USER_UUID` kısmına Auth Users ekranındaki kullanıcının UUID değerini yaz:

```sql
insert into public.admin_users(user_id) values ('USER_UUID');
```

Service role anahtarını kimseyle paylaşma; yalnızca Vercel Environment Variables alanına koy.

## 2. Vercel'e yayınlama
1. Bu klasörü GitHub deposuna yükle (telefondan GitHub web sitesi veya GitHub mobil uygulaması kullanılabilir).
2. https://vercel.com üzerinden GitHub ile giriş yapıp Add New → Project ile depoyu içe aktar.
3. Environment Variables alanına şu üç değişkeni ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy'a bas. Vercel ücretsiz `*.vercel.app` adresi verir.
5. İlk dağıtımdan sonra site adresini açıp `/admin` sayfasından yönetici hesabıyla giriş yap.

## 3. İlk kullanım
1. Yönetici panelinde dört adayın adını, sloganını ve isteğe bağlı fotoğraf URL'sini düzenle.
2. Öğrenci numaralarını satır satır ekle.
3. Her saat için “Saatlik kodları üret” düğmesine bas; CSV'yi indir ve kodları yalnızca ilgili öğrencilere özel ulaştır.
4. Öğrenciler ana sayfada kodlarını girip aday seçerek oy kullanır.
5. Sonuçlar her sayfa yenilendiğinde tüm saatlerin oylarından hesaplanır.

## Güvenlik ve sınırlar
- Oy verme işlemi sunucu tarafında ve tek bir PostgreSQL fonksiyonunda atomik yapılır. Aynı öğrencinin aynı saat için ikinci oyu veritabanı benzersiz kısıtıyla engellenir.
- Öğrenci numaraları oy kayıtlarında isim olarak tutulmaz; oylar öğrenci UUID'siyle ilişkilidir. Bununla birlikte okul numaralarını ve kod CSV'sini hassas veri gibi koruyun.
- Bu sürüm temel üretim altyapısıdır; gerçek bir okul seçimi öncesinde okul yönetimiyle yetki, öğrenci listesi doğrulaması, veri saklama süresi, yedekleme ve bağımsız güvenlik testi belirlenmelidir.
- Vercel/Supabase ücretsiz planlarının limitleri ve kullanım şartları değişebilir. Ücretsiz plan, kesintisiz hizmet garantisi değildir.
- Kod saatleri UTC'ye göre belirlenir. Türkiye saati UTC+3 olduğundan panelde gösterilen saatle kod periyodunu eşleştirirken bu farkı dikkate alın.
