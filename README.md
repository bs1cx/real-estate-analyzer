# Gayrimenkul Analiz Paneli (Statik HTML & JS)

Bu proje, herhangi bir backend framework’ü olmadan (Next.js/FastAPI vb.) tamamen **HTML + CSS + JavaScript** ile çalışan hafif bir gayrimenkul analiz panelidir. Veri kaynağı olarak `data/mock_listings.json` dosyasını kullanır ve istemci tarafında hesaplama yapar.

## Özellikler

- Şehir, ilçe, mahalle, konut tipi ve sayısal aralık filtreleri
- Satış/kira analiz modları ve yatırım endeksi hesaplaması
- Ortalama fiyat/kira metrikleri, kira getirisi, 5 yıllık CAGR ve yatırım önerisi
- Zaman serisi grafiği (Chart.js) ve konum haritası (Leaflet + OpenStreetMap)
- İçgörü ve öneri kartları
- JSON veri kaynağını kolayca güncelleyerek gerçek scraper / API ile entegre edilebilir
- Popüler 10 emlak platformu için API entegrasyon sekmesi (Sahibinden, Hepsiemlak, Zingat, Emlakjet, Coldwell Banker TR, RE/MAX Türkiye, Century 21 Türkiye, Flatfy Türkiye, Trem Global, Hürriyet Emlak)

## Kurulum & Çalıştırma

1. Depoyu klonlayın veya indirin.
2. Statik dosyaları doğrudan bir HTTP sunucusunda çalıştırın:

```bash
# Python 3 ile hızlı sunucu
python -m http.server

# veya npm ile
npx serve .
```

3. Tarayıcıdan `http://localhost:8000` (veya sunucunun belirttiği port) adresine gidin.

> Tarayıcı güvenlik kısıtları nedeniyle `index.html` dosyasını çift tıklayıp açmak (file:// protokolü) `fetch` çağrılarını engelleyebilir. Bu nedenle basit de olsa bir HTTP sunucusu kullanın.

## Veri Kaynağını Güncelleme

- Tüm kayıtlar `data/mock_listings.json` dosyasında bulunur.
- Web scraping ile yeni veriler topladığınızda bu JSON dosyasını otomatik olarak güncelleyebilirsiniz.
- JSON şeması:

```jsonc
{
  "city": "Istanbul",
  "district": "Besiktas",
  "neighbourhood": "Etiler",
  "property_type": "Apartment",
  "size_m2": 120,
  "rooms": 4,
  "building_age": 5,
  "listing_type": "sale", // "sale" veya "rent"
  "price": 9500000,
  "rent": null,
  "listing_date": "2021-05-12"
}
```

## API Entegrasyon Sekmesi

- `Analiz Paneli` sekmesinin yanındaki `API Entegrasyonları` sekmesi, 10 popüler portal için endpoint tanımlamanıza izin verir.
- Her kartta:
  - **API Endpoint**: JSON döndüren URL. Gerekiyorsa kendi scraper/proxy servisinizi yazın.
  - **API Anahtarı / Token**: İsteğe bağlı. Girilen değer otomatik olarak `Authorization` başlığına eklenir (Bearer formatında değilse `Bearer` prefix’i eklenir).
  - **Ek Başlıklar**: JSON formatında ekstra header girebilirsiniz (ör. `{"X-API-KEY":"..."}`).
- “Test Et” butonu sadece bağlantıyı kontrol eder, veri setini güncellemez.
- “Veri Çek” butonu gelen kaydı normalize eder, mevcut veri kümesine ekler, filtreleri ve analizi canlı olarak günceller.
- Beklenen JSON yapısı yukarıdaki örnekle aynıdır. Alan adları farklıysa uygulama otomatik eşleşme yapmaya çalışır (`city`, `il`, `province` vb.).
- CORS kısıtları olan kaynaklar için ara bir proxy veya serverless fonksiyon kullanmanız gerekebilir.

## Dış Bağımlılıklar

- [Chart.js 4](https://www.chartjs.org/) (CDN üzerinden)
- [Leaflet 1.9](https://leafletjs.com/) (CDN üzerinden)

İsterseniz bu kütüphaneleri projeye dahil ederek offline kullanım da sağlayabilirsiniz.

## Lisans

Serbestçe özelleştirip kullanabilirsiniz. Scraper veya API entegrasyonlarınızı ekleyerek bu statik paneli gerçek verilerle besleyebilirsiniz.

