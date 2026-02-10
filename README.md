# 📋 EtsyScript - Etsy Satıcıları için Otomasyon Araçları

Merhaba! Bu koleksiyon, **Etsy'de daha hızlı ve akıllı çalışmak** için yazılmış 25+ otomatik script'ten oluşuyor. Hiç programlama bilgine gerek yok!

---

## 🎯 Bu Script'ler Ne İşe Yarıyor?

Bu script'ler Etsy satıcılarının:
- ✅ **Satışlarını takip etmek** (gelir hesaplamaları)
- ✅ **Müşteri mesajlarını yönetmek** (tepki şablonları)
- ✅ **Ürün listelemeleri analiz etmek** (hangi ürünler iyi satılıyor?)
- ✅ **İstatistikleri görmek** (puanlar, favori sayıları)
- ✅ **Tekrarlayan işleri otomatik yapmak** (link açmak, arama yapmak)

**Kısacası:** Etsy'de harcadığınız zamanı yarı yarıya azaltır!

---

## 📦 Ne Kurman Lazım?

### Adım 1: Tarayıcıya Eklenti Yükle

Script'ler Tampermonkey adlı tarayıcı eklentisi ile çalışır. Bu eklenti Chrome, Firefox, Safari vs. hepsinde var.

**Chrome/Brave/Edge için:**
1. [Tampermonkey Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobp775) linkini aç
2. "Chrome'a ekle" butonuna bas
3. "Uzantıyı ekle" diyerek onayla
4. Uzantılardan geliştirici modunu aç
5. Yine uzantılardan tampermonkey ayrıntılarına tıklayıp "Kullanıcı komut dosyalarına izin ver"
6. Tampermonkey ayarlar dan Yapılandırma modu: Gelişmiş seç

**Firefox için:**
1. [Tampermonkey Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) linkini aç
2. "Firefox'a ekle" butonuna bas

**Safari için:**
- App Store'dan Tampermonkey arayıp indir

### Adım 2: Script'i Kopyala

1. GitHub'da bir script dosyasına tıkla (örnek: `EtsyFinans.user.js`)
2. "Raw" butonuna bas (aslında Raw a basınca otomatik yükler, eğer yüklmeze soraki adım.)
3. Sayfanın tamamını seç (Ctrl+A veya Cmd+A)
4. Kopyala (Ctrl+C veya Cmd+C)

### Adım 3: Tampermonkey'e Yapıştır

1. Tarayıcının sağ üstünde **Tampermonkey** simgesine tıkla
2. "Yeni script oluştur" seçeneğini tıkla (veya "Create a new script")
3. Varsayılan metni sil
4. Kopyaladığın kodu yapıştır (Ctrl+V)
5. **Ctrl+S (veya Cmd+S) ile kaydet**
6. Tarayıcıyı yenile

---

## 🚀 Script'ler Hakkında (Kısaca)

## 🚀 Script'ler Hakkında (Kısaca)

| Script Adı | Ne Yapıyor | Kullanıcı Seviyesi |
|------------|-----------|-------------------|
| **EtsyFinans.user.js** | Satış gelirini otomatik hesaplar, toplam kazancını ve reklam/fee yüzdelerini gösterir | ⭐ Kolay |
| **EtsyReviewMessage.user.js** | Müşteri mesajlarına hızlı cevap vermek için şablonlar ekler | ⭐ Kolay |
| **EtsyOrderRecentbyhub.user.js** | CustomHub'daki siparişleri kategorilere göre gruplandırır ve bir sürü ek özellik katar. | ⭐⭐ Orta |
| **ErankOnEtsy.user.js** | Ürünlerin Etsy'deki sıralamalarını gösterir (SEO analizi) | ⭐⭐ Orta |
| **EtsyDiscountAdjust.user.js** | İndirim oranlarını hızlı hesaplar ve uygular | ⭐⭐ Orta |
| **ShipStationSalesReport.user.js** | Kargo bilgilerini raporlaştırır ve satış verilerini analiz eder | ⭐⭐ Orta |
| **openLinksSequentially.user.js** | Çok sayıda linki birbirini takip ederek aç | ⭐ Kolay |
| **EtsyImageHoverPreview.user.js** | Mouse üzerine getirdiğinde resim önizlemesi gösterir | ⭐ Kolay |
| **ListingChanger.user.js** | Ürün açıklamasını/varyasyonları/fiyarları hızlı değiştirmek için araçlar ekler | ⭐⭐ Orta |
| **EtsyListing.user.js** | Listing başlığını ve etiketlerini kopyalama aracı | ⭐ Kolay |
| **CustumHubSKU.user.js** | CustomHub kütüphanesinde SKU'ları kontrol eder ve Google Sheets'e gönderir | ⭐⭐ Orta |
| **AdWordlist.user.js** | Reklam sözcüklerini listeler ve yönetir (Regex desteği) | ⭐⭐ Orta |
| **etsyListingAnalyzer.user.js** | Etsy listinglerini inline olarak analiz eder ve raporlar | ⭐⭐⭐ İleri |
| **EtsySumPurchases.user.js** | Satın alma işlemlerini analiz eder ve harcama bilgilerini gösterir | ⭐⭐ Orta |

> 💡 **İlk başlayanlar için:** EtsyFinans, openLinksSequentially, EtsyImageHoverPreview ve EtsyListing ile başlayın!

---

## 📝 Adım Adım Kullanma Rehberi

### Senaryo 1: Aylık Satış Gelirini Hesapla

**Ne yapacaksın:** EtsyFinans script'i kullanarak tüm satışlarını toplayacak ve kaç lira kazandığını göreceksin.

**Adımlar:**
1. Script'i kurunca Tampermonkey'deki listede görürsün
2. Etsy hesabında "Finans /Monthley Statements" sayfasına git
3. Sayfayı yenile
4. Sonuç: Seçtiğin ay kaç lira kazandığını,reklam ve fee yüzdelerini göreceksin ✨

---

### Senaryo 2: Müşteri Yorumlarına Hızlı Cevap Ver

**Ne yapacaksın:** Aynı cevapları defalarca yazmak yerine, önceden hazırlanmış şablonları kullanacaksın.

**Adımlar:**
1. EtsyReviewMessage script'i kur
2. Etsy'de "Orders/comlated delivered" sayfasına git. Review mesajı göndermek istiyorsan şablonu tampermonkey simgesinden ayarlarından mesaj şablonları ayarla.
3. Sırayla review mesajı gmndermek için ctrl+spaca (mesaj yazar) , ctrl+alt (mesaj gönderir), ctrl+ sağ tuş(diğer siparişe geçer)
4. Orders sayfasında müşteri mesajını seçince 10 çeşit mesaj gönderebilirsin. ctrl + sayı. 
5. Beğendiğin cevap şablonunu seç
6. İhtiyacına göre düzenle ve gönder
7. **Zaman kazan:** Her yorum için 5 dakika yerine 30 saniye! ⚡

---

### Senaryo 3: Reklam Sözcüklerini Listele

**Ne yapacaksın:** Ürünlerin hangi arama kelimeleriyle bulunduğunu göreceksin.

**Adımlar:**
1. AdWordlist script'i kur
2. Ürün reklamlarnın bulunduğu sayfaya git
3. Sayfasaki listingleri aç.
4. ctrl+alt otomatik gereksiz kelimeleri kapatır.
5. **Fayda:** gereksiz harcama yapan kelimeleri kapatmış olursun. Ayarlarından bunları düzenleyebilirsin. Biliyorsan regex de yapabilirsin. 🎯

---

### Senaryo 4: Resimleri Hover Ettiğinde Önizle

**Ne yapacaksın:** Ürün resimleri hakkında daha fazla bilgi göreceksin.

**Adımlar:**
1. EtsyImageHoverPreview script'i kur
2. Etsy'de ürün listelemedeki küçük resimlerin üzerine mouse'u getir
3. Resim büyüyüp daha net görünecek ✨
4. **Fayda:** Resimleri tıklamadan preview görebilirsin (zaman tasarrufu)

---

## 🐛 Sorun Giderme

**Soru: Script çalışmıyor, hiçbir şey olmuyor?**
- ✅ Tampermonkey kurulu mu? (Tarayıcı simgelerine bak)
- ✅ Script'i doğru mu kopyaladın? (Tüm kodu kopyala, başından sonuna)
- ✅ Tarayıcıyı yeniledin mi? Burası çok önemli.  (F5 tuşu)
- ✅ Doğru sayfadamı sın? (Herbiri sayfasında çalışır)

**Soru: Script'ler benim verilerimi çalıyor mu?**
- ❌ Hayır! Tüm script'ler sadece **tarayıcında çalışır**
- ❌ Hiçbir bilgi sunuculara gönderilmez
- ✅ Tamamen senin kontrolünde

**Soru: Script'leri güncellemek gerekir mi?**
- ✅ Evet, bazen Etsy arayüzü değişir
- ✅ Bu repo'yu takip et ve yeni sürümleri kur

---

## 💡 İpuçları

1. **Hepsini birden kurma** - Bir iki tane ile başla, alışkanlık yap, sonra diğerlerini ekle
2. **Tarayıcı konsolunu aç** (F12 → Console) - Script hataları burada görürsün
3. **Etsy'yi yenile** - Script değişiklikler tarayıcı yenilendikten sonra uygulanır
4. **Tampermonkey ayarlarını kontrol et** - Sağ tık → "Tampermonkey" → "Yönet"

---

## 📞 Yardım ve Destek

- GitHub'da **issue** aç (sorun bildir)
- Script'i güncellediysen pull request gönder
- Sorularını GitHub Discussions'ta sor

---

## 📄 Lisans

Bu script'ler **kişisel kullanım için** açıkça paylaşılmıştır. Ticari amaçla satış yasaktır.

---

## 🎓 Yeni Başlayanlar İçin Hızlı Başlangıç (5 Dakika)

```
1. Tampermonkey kur (2 dakika)
   ↓
2. EtsyFinans script'i kopyala (1 dakika)
   ↓
3. Tampermonkey'e yapıştır ve kaydet (1 dakika)
   ↓
4. Etsy.com'a git, Orders sayfasını aç (1 dakika)
   ↓
5. Yeni buton göreceksin - Tıkla! ✨
```

**Başarı! İlk script'in çalışıyor! 🎉**

Şimdi rahatça diğer script'leri keşfet. Hepsi aynı şekilde kurulur.

---

**Sorularınız mı var? Başlayın ve deneyerek öğrenin! Hiçbir şey kırmıyorsunuz, hepsini deneyebilirsiniz.** 🚀
