# Sahibinden Scraper Servisi (Örnek)

Bu dizin, sahibinden.com arama/listeme sayfalarından veri çıkarmak için örnek
bir FastAPI + Playwright servisi içerir. Servis, verilen URL'yi ziyaret eder,
ilanları ve detay sayfalarını dolaşarak temel alanları JSON formatında döndürür.

> Uyarı: Sahibinden.com web sitesini otomatik olarak taramak hukuki
> kısıtlamalara tabi olabilir. Kullanım öncesinde sitenin kullanım koşullarını,
> robots.txt kurallarını ve yerel mevzuatı inceleyin. Bu kod yalnızca teknik
> örnek niteliğindedir.

## Kurulum

```bash
cd scraper-service
python -m venv .venv
# Windows PowerShell". .venv\\Scripts\\Activate.ps1"
# macOS/Linux"source .venv/bin/activate"
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --reload
```

Servis çalıştığında `http://localhost:8001/health` doğrulama için kullanılabilir.
İlan çekmek için `http://localhost:8001/scrape?url=...` endpoint'ini çağırın.

## Yanıt Formatı

```
{
  "count": 10,
  "listings": [
    {
      "city": "Istanbul",
      "district": "Besiktas",
      "neighbourhood": "Etiler",
      "property_type": "Daire",
      "listing_type": "sale",
      "size_m2": 120,
      "rooms": "3+1",
      "building_age": "5-10",
      "price": 9500000,
      "rent": null,
      "listing_date": "11 Kasım 2025",
      "url": "https://www.sahibinden.com/...",
      "source": "sahibinden",
      "features": ["Eşyalı", "Site İçinde", "Asansör"]
    }
  ]
}
```

## Selector ve Özelleştirme

Sahibinden sayfa yapısı sık sık değişebilir. `main.py` dosyasındaki
`parse_listing_row` ve `fetch_listing_details` fonksiyonlarında kullanılan
CSS seçicilerini güncel HTML yapısına göre düzenleyin. Gerekirse ek alanları
(yapı durumu, aidat, tapu durumu vb.) parse ederek yanıt şemasına ekleyin.

Performans için `MAX_ITEMS` sabiti ile çekilecek ilan sayısını sınırlayabilir,
veya daha fazla eşzamanlı sayfa kullanabilirsiniz.
