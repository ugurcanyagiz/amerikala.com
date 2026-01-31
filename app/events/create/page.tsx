"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Image as ImageIcon,
  Upload,
  AlertCircle
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "social",
    description: "",
    date: "",
    time: "",
    location: "",
    venue: "",
    address: "",
    capacity: "",
    isPaid: false,
    price: "",
    image: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = "Başlık gerekli";
    if (!formData.description) newErrors.description = "Açıklama gerekli";
    if (!formData.date) newErrors.date = "Tarih gerekli";
    if (!formData.time) newErrors.time = "Saat gerekli";
    if (!formData.location) newErrors.location = "Konum gerekli";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Submit to Supabase
    console.log("Creating event:", formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/events">
              <Button variant="ghost" className="gap-2 mb-6">
                <ArrowLeft size={18} />
                Geri Dön
              </Button>
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Yeni Etkinlik Oluştur</h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Toplulukla bir araya gelmek için etkinlik düzenle
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* BASIC INFO */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Temel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <Input
                    label="Etkinlik Başlığı *"
                    placeholder="örn: NYC Turkish Coffee Meetup"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={errors.title}
                  />

                  <Select
                    label="Kategori *"
                    options={[
                      { value: "social", label: "Sosyal" },
                      { value: "sports", label: "Spor" },
                      { value: "tech", label: "Teknoloji" },
                      { value: "culture", label: "Kültür" },
                      { value: "food", label: "Yemek" },
                      { value: "other", label: "Diğer" }
                    ]}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />

                  <Textarea
                    label="Açıklama *"
                    placeholder="Etkinlik hakkında detaylı bilgi verin..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    error={errors.description}
                  />
                </CardContent>
              </Card>

              {/* DATE & TIME */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Tarih & Saat</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Tarih *"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      icon={<Calendar size={18} />}
                      error={errors.date}
                    />

                    <Input
                      label="Saat *"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      icon={<Clock size={18} />}
                      error={errors.time}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* LOCATION */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Konum</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <Input
                    label="Şehir, Eyalet *"
                    placeholder="örn: New York, NY"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    icon={<MapPin size={18} />}
                    error={errors.location}
                  />

                  <Input
                    label="Mekan Adı"
                    placeholder="örn: Turkish Cultural Center"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  />

                  <Input
                    label="Adres"
                    placeholder="Tam adres (opsiyonel)"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </CardContent>
              </Card>

              {/* CAPACITY & PRICING */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Kapasite & Fiyatlandırma</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <Input
                    label="Maksimum Katılımcı"
                    type="number"
                    placeholder="örn: 50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    icon={<Users size={18} />}
                  />

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={formData.isPaid}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    <label htmlFor="isPaid" className="text-sm font-medium">
                      Bu ücretli bir etkinlik
                    </label>
                  </div>

                  {formData.isPaid && (
                    <Input
                      label="Fiyat (USD)"
                      type="number"
                      placeholder="örn: 25"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      icon={<DollarSign size={18} />}
                    />
                  )}
                </CardContent>
              </Card>

              {/* IMAGE UPLOAD */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Etkinlik Görseli</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center hover:border-blue-500 transition-smooth cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {formData.image ? (
                        <div>
                          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-green-500" />
                          <p className="text-sm font-medium text-green-600">
                            {formData.image.name}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Değiştirmek için tıkla
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
                          <p className="text-sm font-medium mb-1">
                            Görsel yüklemek için tıkla
                          </p>
                          <p className="text-xs text-neutral-500">
                            PNG, JPG veya GIF (max. 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* SUBMIT */}
              <Card className="glass bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-1">Oluşturmadan önce kontrol edin:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                        <li>Tüm gerekli alanlar dolduruldu mu?</li>
                        <li>Tarih ve saat bilgileri doğru mu?</li>
                        <li>Konum bilgisi net mi?</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href="/events" className="flex-1">
                      <Button variant="outline" className="w-full">
                        İptal
                      </Button>
                    </Link>
                    <Button type="submit" variant="primary" className="flex-1">
                      Etkinliği Oluştur
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
